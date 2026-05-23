import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { getStoredDemoJobs } from "../demo/demo-storage";
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
  getAvailabilityLabel,
  getJobModelLabel,
  getJobs,
  type JobItem,
} from "../services/jobs";
import { getMyStudentProfile, type StudentProfile } from "../services/students";
import heroStageImage from "../imagens/estagios.png";
import powerImage from "../imagens/The-power-of-networking-640x333.webp";
import basesImage from "../imagens/bases.jpg";
import socialImage from "../imagens/6962d64ca6e66b24ac58011a_tipos-empresas-1200_og-2.jpeg";
import networkingImage from "../imagens/importancia-do-networking-1024x683.png";
import slideImage from "../imagens/slide_32.png";
import showcaseImage from "../imagens/Captura de tela 2026-05-18 205107.png";

type MatchBand = "all" | "90" | "80" | "70";
type ModelFilter = "all" | "REMOTE" | "HYBRID" | "IN_PERSON";
type StatusFilter = "all" | StudentApplication["status"];

type JobViewModel = {
  job: JobItem;
  application?: StudentApplication;
  score: number;
  scoreLabel: string;
  justification: string;
  heroImage: string;
};

const jobImages = [heroStageImage, slideImage, networkingImage, powerImage, basesImage, socialImage, showcaseImage];

function selectJobImage(seed: string) {
  const total = seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return jobImages[total % jobImages.length];
}

function getScoreTone(score: number): "green" | "amber" | "red" {
  if (score >= 80) return "green";
  if (score >= 50) return "amber";
  return "red";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Alta compatibilidade";
  if (score >= 50) return "Média compatibilidade";
  return "Baixa compatibilidade";
}

function mergeWithDemoJobs(realJobs: JobItem[]) {
  const demoJobs = getStoredDemoJobs() as JobItem[];
  if (realJobs.length >= 4) return realJobs;

  return [
    ...realJobs,
    ...demoJobs.filter((demoJob: JobItem) => !realJobs.some((job) => job.id === demoJob.id)),
  ];
}

export function JobsPage() {
  const navigate = useNavigate();
  const { token, user, isAuthenticated } = useAuth();
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
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setJobs(getStoredDemoJobs() as JobItem[]);
      setApplications([]);
      setStudentProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const requests: Promise<unknown>[] = [getJobs(token)];

    if (user?.role === "STUDENT") {
      requests.push(getMyApplications(token), getMyStudentProfile(token));
    }

    Promise.allSettled(requests)
      .then((responses) => {
        const jobsResult = responses[0];
        const realJobs = jobsResult.status === "fulfilled" ? (jobsResult.value as JobItem[]) : [];

        if (user?.role === "STUDENT") {
          setJobs(mergeWithDemoJobs(realJobs));
          setApplications(responses[1]?.status === "fulfilled" ? (responses[1].value as StudentApplication[]) : []);
          setStudentProfile(responses[2]?.status === "fulfilled" ? (responses[2].value as StudentProfile) : null);
        } else {
          setJobs(realJobs);
          setApplications([]);
          setStudentProfile(null);
        }
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
      const scoreLabel = application
        ? `${application.score}% nesta candidatura`
        : studentProfile
          ? `${estimatedScore}% estimado`
          : "Faça login para ver seu score";
      const justification = studentProfile
        ? buildMatchJustification(studentProfile, job)
        : "Entre com sua conta para calcular o matching com base no seu perfil.";

      return {
        job,
        application,
        score,
        scoreLabel,
        justification,
        heroImage: selectJobImage(job.id),
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
  const selectedJob = useMemo(
    () => jobsView.find((item) => item.job.id === selectedJobId) ?? null,
    [jobsView, selectedJobId]
  );

  function openJobDetails(jobId: string) {
    setSelectedJobId(jobId);
  }

  function closeJobDetails() {
    setSelectedJobId(null);
  }

  function handleJobSurfaceKeyDown(event: KeyboardEvent<HTMLDivElement>, jobId: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openJobDetails(jobId);
    }
  }

  async function handleApply(jobId: string) {
    if (!token) {
      navigate("/?auth=login");
      return;
    }

    setSubmittingJobId(jobId);
    setError(null);

    try {
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
        <div className="jobs-page__header-copy">
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
            <p>
              {studentProfile.skills.slice(0, 3).join(" • ")} • {studentProfile.course} • {studentProfile.availability.length ? studentProfile.availability.join(" • ") : "Disponibilidade pendente"}
            </p>
          </div>
          <span className="status-pill status-pill--highlight">Matching em tempo real</span>
        </section>
      ) : (
        <section className="panel jobs-recommendation-banner">
          <div>
            <span className="panel__label">Acesso necessário</span>
            <h2>
              {isVisitor
                ? "Entre para visualizar seu matching com as vagas."
                : "Complete seu perfil para ativar o matching."}
            </h2>
            <p>
              {isVisitor
                ? "Enquanto isso, você já pode explorar vagas demonstrativas e entender como a plataforma funciona."
                : "Seu score depende das skills, curso e disponibilidade cadastrados no perfil."}
            </p>
          </div>
          {!isVisitor ? null : (
            <button className="secondary-button" type="button" onClick={() => navigate("/?auth=login")}>
              Entrar
            </button>
          )}
        </section>
      )}

      <section className="panel jobs-filter-bar jobs-filter-bar--compact">
        <label className="field jobs-filter-bar__search jobs-filter-bar__search--compact">
          <span>Buscar vaga</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="React, dados, estágio remoto..." />
        </label>

        <div className="jobs-filter-grid">
          <label className="field jobs-filter-select">
            <span>Modelo</span>
            <select value={modelFilter} onChange={(event) => setModelFilter(event.target.value as ModelFilter)}>
              <option value="all">Todos</option>
              <option value="REMOTE">Remoto</option>
              <option value="HYBRID">Híbrido</option>
              <option value="IN_PERSON">Presencial</option>
            </select>
          </label>

          <label className="field jobs-filter-select">
            <span>Match</span>
            <select value={matchBand} onChange={(event) => setMatchBand(event.target.value as MatchBand)}>
              <option value="all">Todos os matches</option>
              <option value="90">90+</option>
              <option value="80">80+</option>
              <option value="70">70+</option>
            </select>
          </label>

          <label className="field jobs-filter-select">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
              <option value="all">Todos os status</option>
              <option value="SENT">Enviado</option>
              <option value="UNDER_REVIEW">Em análise</option>
              <option value="INTERVIEW">Entrevista</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REJECTED">Reprovado</option>
            </select>
          </label>

          <label className="field jobs-filter-checkbox">
            <span>Atalho</span>
            <button
              className={onlyMyApplications ? "role-option role-option--active" : "role-option"}
              type="button"
              onClick={() => setOnlyMyApplications((current) => !current)}
            >
              Já me candidatei
            </button>
          </label>
        </div>
      </section>

      <section className="content-grid content-grid--three jobs-highlight-grid">
        {topMatches.map((item, index) => (
          <article key={item.job.id} className="panel panel--soft jobs-highlight-card">
            <span className="panel__label">Top {index + 1}</span>
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
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              setQuery("");
              setModelFilter("all");
              setStatusFilter("all");
              setMatchBand("all");
              setOnlyMyApplications(false);
            }}
          >
            Limpar filtros
          </button>
        </section>
      ) : (
        <section className="jobs-card-grid">
          {filteredJobs.map((item) => {
            const scoreTone = getScoreTone(item.score);
            const scoreDescription = getScoreLabel(item.score);

            return (
              <article key={item.job.id} className={`panel jobs-job-card jobs-job-card--interactive jobs-job-card--${scoreTone}`}>
                <div
                  className="jobs-job-card__surface"
                  role="button"
                  tabIndex={0}
                  aria-label={`Ver detalhes da vaga ${item.job.title}`}
                  onClick={() => openJobDetails(item.job.id)}
                  onKeyDown={(event) => handleJobSurfaceKeyDown(event, item.job.id)}
                >
                  <div className="jobs-job-card__media">
                    <img src={item.heroImage} alt={item.job.title} loading="lazy" />
                    <span className={`status-pill status-pill--${scoreTone}`}>{scoreDescription}</span>
                  </div>

                  <div className="jobs-job-card__top">
                    <div>
                      <span className="panel__label">{item.job.company?.name ?? "Empresa parceira"}</span>
                      <h2>{item.job.title}</h2>
                      <p className="jobs-job-card__meta">
                        <span className="jobs-job-card__meta-item">{getJobModelLabel(item.job.model)}</span>
                        <span className="jobs-job-card__meta-item">{item.job.location ?? "Local flexível"}</span>
                      </p>
                    </div>

                    <div className={`jobs-job-card__score jobs-job-card__score--${scoreTone}`}>
                      <strong>{item.score}%</strong>
                      <span>{item.application ? "Score real" : studentProfile ? "Estimado" : "Indisponível"}</span>
                    </div>
                  </div>

                  <p>{item.job.description}</p>

                  <div className="skill-tags">
                    {item.job.skills.map((skill) => (
                      <span key={skill} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="jobs-job-card__details">
                    <span>
                      <strong>Curso:</strong> {item.job.course ?? "Sem requisito específico"}
                    </span>
                    <span>
                      <strong>Disponibilidade:</strong> {getAvailabilityLabel(item.job.availability)}
                    </span>
                  </div>

                  <div className="jobs-job-card__match-box">
                    <span className="panel__label">Por que combina com você</span>
                    <div className="progress-bar progress-bar--animated">
                      <span className={`progress-bar__fill progress-bar__fill--${scoreTone}`} style={{ width: `${item.score}%` }} />
                    </div>
                    <p>{item.justification}</p>
                  </div>
                </div>

                <div className="jobs-job-card__footer">
                  {item.application ? (
                    <span className={`status-pill status-pill--${getApplicationStatusTone(item.application.status)}`}>
                      {getApplicationStatusLabel(item.application.status)}
                    </span>
                  ) : (
                    <button className="secondary-button" type="button" onClick={() => openJobDetails(item.job.id)}>
                      Ver detalhes
                    </button>
                  )}

                  <button
                    className="primary-button"
                    type="button"
                    disabled={
                      submittingJobId === item.job.id ||
                      Boolean(item.application) ||
                      !isAuthenticated ||
                      user?.role !== "STUDENT"
                    }
                    onClick={(event) => {
                      event.stopPropagation();
                      handleApply(item.job.id);
                    }}
                  >
                    {item.application
                      ? "Candidatura enviada"
                      : submittingJobId === item.job.id
                        ? "Enviando..."
                        : "Candidatar-se com 1 clique"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {selectedJob ? (
        <div className="auth-modal-overlay" role="presentation" onClick={closeJobDetails}>
          <div
            className="auth-modal jobs-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="job-details-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button className="auth-modal__close" type="button" onClick={closeJobDetails} aria-label="Fechar detalhes da vaga">
              ×
            </button>

            <div className="jobs-details-modal__layout">
              <div className="jobs-details-modal__media">
                <img src={selectedJob.heroImage} alt={selectedJob.job.title} loading="lazy" />
              </div>

              <div className="jobs-details-modal__content">
                <div className="auth-card__intro auth-modal__intro auth-modal__intro--compact">
                  <span className="page-eyebrow">{selectedJob.job.company?.name ?? "Empresa parceira"}</span>
                  <h1 id="job-details-modal-title">{selectedJob.job.title}</h1>
                  <p>{selectedJob.job.company?.about ?? "Veja mais contexto sobre a vaga, requisitos e compatibilidade com o seu perfil."}</p>
                </div>

                <div className="jobs-details-modal__meta">
                  <span className={`status-pill status-pill--${getScoreTone(selectedJob.score)}`}>{getScoreLabel(selectedJob.score)}</span>
                  <span className="jobs-job-card__meta-item">{getJobModelLabel(selectedJob.job.model)}</span>
                  <span className="jobs-job-card__meta-item">{selectedJob.job.location ?? "Local flexível"}</span>
                </div>

                <div className={`jobs-job-card__score jobs-job-card__score--${getScoreTone(selectedJob.score)}`}>
                  <strong>{selectedJob.score}%</strong>
                  <span>{selectedJob.scoreLabel}</span>
                </div>

                <div className="jobs-details-modal__section">
                  <span className="panel__label">Descrição</span>
                  <p>{selectedJob.job.description}</p>
                </div>

                <div className="jobs-details-modal__section">
                  <span className="panel__label">Skills</span>
                  <div className="skill-tags">
                    {selectedJob.job.skills.map((skill) => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="jobs-details-modal__details">
                  <span><strong>Curso:</strong> {selectedJob.job.course ?? "Sem requisito específico"}</span>
                  <span><strong>Disponibilidade:</strong> {getAvailabilityLabel(selectedJob.job.availability)}</span>
                </div>

                <div className="jobs-job-card__match-box">
                  <span className="panel__label">Por que combina com você</span>
                  <div className="progress-bar progress-bar--animated">
                    <span className={`progress-bar__fill progress-bar__fill--${getScoreTone(selectedJob.score)}`} style={{ width: `${selectedJob.score}%` }} />
                  </div>
                  <p>{selectedJob.justification}</p>
                </div>

                <div className="jobs-details-modal__actions">
                  {selectedJob.application ? (
                    <span className={`status-pill status-pill--${getApplicationStatusTone(selectedJob.application.status)}`}>
                      {getApplicationStatusLabel(selectedJob.application.status)}
                    </span>
                  ) : null}

                  <button
                    className="primary-button"
                    type="button"
                    disabled={
                      submittingJobId === selectedJob.job.id ||
                      Boolean(selectedJob.application) ||
                      !isAuthenticated ||
                      user?.role !== "STUDENT"
                    }
                    onClick={() => handleApply(selectedJob.job.id)}
                  >
                    {selectedJob.application
                      ? "Candidatura enviada"
                      : submittingJobId === selectedJob.job.id
                        ? "Enviando..."
                        : "Candidatar-se com 1 clique"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
