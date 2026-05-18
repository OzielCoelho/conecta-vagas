import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  getStoredDemoApplications,
  getStoredDemoJobs,
  isDemoToken,
  saveDemoApplications,
} from "../demo/demo-storage";
import {
  applyToJob,
  getApplicationStatusLabel,
  getApplicationStatusTone,
  getMyApplications,
  type StudentApplication,
} from "../services/applications";
import {
  buildMatchJustification,
  estimateJobMatch,
  getJobModelLabel,
  getJobs,
  type JobItem,
} from "../services/jobs";
import { getMyStudentProfile, type StudentProfile } from "../services/students";

type MatchBand = "all" | "90" | "80" | "70";
type ModelFilter = "all" | "REMOTE" | "HYBRID" | "IN_PERSON";
type StatusFilter = "all" | StudentApplication["status"];

type JobViewModel = {
  job: JobItem;
  application?: StudentApplication;
  score: number;
  scoreLabel: string;
  justification: string;
};

export function JobsPage() {
  const navigate = useNavigate();
  const { token, user, isAuthenticated, startDemo } = useAuth();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [query, setQuery] = useState("");
  const [modelFilter, setModelFilter] = useState<ModelFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [matchBand, setMatchBand] = useState<MatchBand>("all");
  const [onlyMyApplications, setOnlyMyApplications] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingJobId, setSubmittingJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setJobs(getStoredDemoJobs() as JobItem[]);
      setApplications(getStoredDemoApplications() as StudentApplication[]);
      setStudentProfile(null);
      setIsLoading(false);
      return;
    }

    if (isDemoToken(token)) {
      setJobs(getStoredDemoJobs() as JobItem[]);
      setApplications(getStoredDemoApplications() as StudentApplication[]);
      getMyStudentProfile(token)
        .then((profile) => setStudentProfile(profile))
        .catch(() => setStudentProfile(null))
        .finally(() => setIsLoading(false));
      return;
    }

    if (user?.role !== "STUDENT") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    Promise.all([getJobs(token), getMyApplications(token), getMyStudentProfile(token)])
      .then(([jobsResponse, applicationsResponse, studentResponse]) => {
        setJobs(jobsResponse);
        setApplications(applicationsResponse);
        setStudentProfile(studentResponse);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as vagas.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, user]);

  const jobsView = useMemo<JobViewModel[]>(() => {
    return jobs.map((job) => {
      const application = applications.find((item) => item.job.id === job.id);
      const estimatedScore = studentProfile ? estimateJobMatch(studentProfile, job) : 0;
      const score = application?.score ?? estimatedScore;
      const scoreLabel = application ? `${application.score}% nesta candidatura` : `${estimatedScore}% estimado`;
      const justification = studentProfile
        ? buildMatchJustification(studentProfile, job)
        : "Entre ou teste a demonstração para ver o matching completo.";

      return {
        job,
        application,
        score,
        scoreLabel,
        justification,
      };
    });
  }, [applications, jobs, studentProfile]);

  const filteredJobs = useMemo(() => {
    return jobsView
      .filter((item) => {
        if (!query.trim()) return true;
        const normalized = query.toLowerCase();
        return [
          item.job.title,
          item.job.company?.name ?? "",
          item.job.description,
          item.job.skills.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalized);
      })
      .filter((item) => (modelFilter === "all" ? true : item.job.model === modelFilter))
      .filter((item) => {
        if (statusFilter === "all") return true;
        return item.application?.status === statusFilter;
      })
      .filter((item) => {
        if (matchBand === "all") return true;
        const minimum = Number(matchBand);
        return item.score >= minimum;
      })
      .filter((item) => (onlyMyApplications ? Boolean(item.application) : true))
      .sort((first, second) => second.score - first.score);
  }, [jobsView, matchBand, modelFilter, onlyMyApplications, query, statusFilter]);

  const topMatches = filteredJobs.slice(0, 3);

  async function handleApply(jobId: string) {
    if (!token) {
      navigate("/?auth=login");
      return;
    }

    setSubmittingJobId(jobId);
    setError(null);

    try {
      if (isDemoToken(token)) {
        const job = jobs.find((item) => item.id === jobId);
        if (!job) return;
        const demoApplication: StudentApplication = {
          id: `demo-application-${Date.now()}`,
          status: "SENT",
          score: studentProfile ? estimateJobMatch(studentProfile, job) : 88,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          job,
        };
        const nextApplications = [...applications.filter((item) => item.job.id !== jobId), demoApplication];
        setApplications(nextApplications);
        saveDemoApplications(nextApplications);
        return;
      }

      const created = await applyToJob(jobId, token);
      setApplications((current) => [...current.filter((item) => item.job.id !== jobId), created]);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível concluir a candidatura.");
    } finally {
      setSubmittingJobId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="page-section">
        <header className="page-header">
          <div>
            <span className="page-eyebrow">Vagas</span>
            <h1>Explorando oportunidades alinhadas ao seu perfil.</h1>
            <p>Carregando vagas e calculando compatibilidade...</p>
          </div>
        </header>
        <div className="content-grid content-grid--three">
          {[1, 2, 3].map((item) => (
            <div key={item} className="panel skeleton-card" />
          ))}
        </div>
      </section>
    );
  }

  const isVisitor = !token;

  return (
    <section className="page-section jobs-page">
      <header className="page-header jobs-page__header">
        <div>
          <span className="page-eyebrow">Vagas</span>
          <h1>Encontre vagas com maior aderência ao seu perfil.</h1>
          <p>
            Compare compatibilidade, acompanhe status e se candidate com uma experiência mais clara e organizada.
          </p>
        </div>
        <div className="jobs-page__summary">
          <div className="panel jobs-summary-card">
            <span className="panel__label">Total de vagas</span>
            <strong>{jobsView.length}</strong>
          </div>
          <div className="panel jobs-summary-card">
            <span className="panel__label">Melhores matches</span>
            <strong>{jobsView.filter((item) => item.score >= 85).length}</strong>
          </div>
          <div className="panel jobs-summary-card">
            <span className="panel__label">Minhas candidaturas</span>
            <strong>{applications.length}</strong>
          </div>
        </div>
      </header>

      {studentProfile ? (
        <section className="panel jobs-recommendation-banner">
          <div>
            <span className="panel__label">Compatibilidade ativa</span>
            <h2>O ranking considera suas skills, curso e disponibilidade.</h2>
            <p>{studentProfile.skills.slice(0, 3).join(" • ")} • {studentProfile.course}</p>
          </div>
          <span className="status-pill status-pill--highlight">Matching em tempo real</span>
        </section>
      ) : (
        <section className="panel jobs-recommendation-banner">
          <div>
            <span className="panel__label">Modo exploração</span>
            <h2>{isVisitor ? "Veja uma vitrine de vagas antes de entrar." : "Ative a demonstração para ver o matching completo."}</h2>
            <p>{isVisitor ? "Entre ou teste a demonstração para visualizar compatibilidade e status reais." : "Entre no modo demonstração para ver uma jornada completa com score e candidatura."}</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => {
            startDemo("student");
            navigate("/vagas");
          }}>
            Testar demonstração
          </button>
        </section>
      )}

      <section className="panel jobs-filter-bar">
        <label className="field jobs-filter-bar__search">
          <span>Buscar vaga</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="React, dados, estágio remoto..." />
        </label>

        <div className="jobs-filter-group">
          <button className={modelFilter === "all" ? "role-option role-option--active" : "role-option"} type="button" onClick={() => setModelFilter("all")}>Todos</button>
          <button className={modelFilter === "REMOTE" ? "role-option role-option--active" : "role-option"} type="button" onClick={() => setModelFilter("REMOTE")}>Remoto</button>
          <button className={modelFilter === "HYBRID" ? "role-option role-option--active" : "role-option"} type="button" onClick={() => setModelFilter("HYBRID")}>Híbrido</button>
          <button className={modelFilter === "IN_PERSON" ? "role-option role-option--active" : "role-option"} type="button" onClick={() => setModelFilter("IN_PERSON")}>Presencial</button>
        </div>

        <div className="jobs-filter-group">
          <button className={matchBand === "all" ? "role-option role-option--active" : "role-option"} type="button" onClick={() => setMatchBand("all")}>Todos os matches</button>
          <button className={matchBand === "90" ? "role-option role-option--active" : "role-option"} type="button" onClick={() => setMatchBand("90")}>90+</button>
          <button className={matchBand === "80" ? "role-option role-option--active" : "role-option"} type="button" onClick={() => setMatchBand("80")}>80+</button>
          <button className={matchBand === "70" ? "role-option role-option--active" : "role-option"} type="button" onClick={() => setMatchBand("70")}>70+</button>
        </div>

        <div className="jobs-filter-group">
          <button className={statusFilter === "all" ? "role-option role-option--active" : "role-option"} type="button" onClick={() => setStatusFilter("all")}>Todos os status</button>
          <button className={onlyMyApplications ? "role-option role-option--active" : "role-option"} type="button" onClick={() => setOnlyMyApplications((current) => !current)}>Já me candidatei</button>
        </div>
      </section>

      <section className="content-grid content-grid--three jobs-highlight-grid">
        {topMatches.map((item) => (
          <article key={item.job.id} className="panel panel--soft jobs-highlight-card">
            <span className="panel__label">Vaga Match Perfeito</span>
            <h2>{item.job.title}</h2>
            <p>{item.job.company?.name ?? "Empresa parceira"}</p>
            <span className="status-pill status-pill--highlight">{item.scoreLabel}</span>
          </article>
        ))}
      </section>

      {error ? <p className="form-error">{error}</p> : null}

      {filteredJobs.length === 0 ? (
        <section className="panel jobs-empty-state">
          <span className="panel__label">Nenhuma vaga encontrada</span>
          <h2>Não encontramos vagas com esse filtro.</h2>
          <p>Experimente limpar a busca ou combinar menos filtros para ampliar os resultados.</p>
          <button className="secondary-button" type="button" onClick={() => {
            setQuery("");
            setModelFilter("all");
            setStatusFilter("all");
            setMatchBand("all");
            setOnlyMyApplications(false);
          }}>
            Limpar filtros
          </button>
        </section>
      ) : (
        <section className="jobs-card-grid">
          {filteredJobs.map((item) => (
            <article key={item.job.id} className="panel jobs-job-card">
              <div className="jobs-job-card__top">
                <div>
                  <span className="panel__label">{item.job.company?.name ?? "Empresa parceira"}</span>
                  <h2>{item.job.title}</h2>
                  <p className="jobs-job-card__meta">
                    <span className="jobs-job-card__meta-item">{getJobModelLabel(item.job.model)}</span>
                    <span className="jobs-job-card__meta-item">{item.job.location ?? "Local flexível"}</span>
                  </p>
                </div>

                <div className="jobs-job-card__score">
                  <strong>{item.score}%</strong>
                  <span>{item.application ? "Score real" : "Estimado"}</span>
                </div>
              </div>

              <p>{item.job.description}</p>

              <div className="skill-tags">
                {item.job.skills.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>

              <div className="jobs-job-card__details">
                <span><strong>Curso:</strong> {item.job.course ?? "Sem requisito específico"}</span>
                <span><strong>Disponibilidade:</strong> {item.job.availability ?? "A combinar"}</span>
              </div>

              <div className="jobs-job-card__match-box">
                <span className="panel__label">Por que combina com você</span>
                <div className="progress-bar progress-bar--animated">
                  <span className="progress-bar__fill" style={{ width: `${item.score}%` }} />
                </div>
                <p>{item.justification}</p>
              </div>

              <div className="jobs-job-card__footer">
                {item.application ? (
                  <span className={`status-pill status-pill--${getApplicationStatusTone(item.application.status)}`}>
                    {getApplicationStatusLabel(item.application.status)}
                  </span>
                ) : null}

                <button
                  className="primary-button"
                  type="button"
                  disabled={submittingJobId === item.job.id || Boolean(item.application)}
                  onClick={() => handleApply(item.job.id)}
                >
                  {item.application ? "Candidatura enviada" : submittingJobId === item.job.id ? "Enviando..." : "Candidatar-se com 1 clique"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
