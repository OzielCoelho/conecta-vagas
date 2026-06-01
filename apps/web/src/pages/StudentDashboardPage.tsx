import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  getApplicationStatusLabel,
  getMyApplications,
  type ApplicationStatus,
  type StudentApplication,
} from "../services/applications";
import { getJobs, getJobModelLabel, type JobItem } from "../services/jobs";
import { getMyStudentProfile } from "../services/students";

const pipelineStages: Array<{ key: ApplicationStatus; label: string }> = [
  { key: "SENT", label: "Enviado" },
  { key: "UNDER_REVIEW", label: "Em análise" },
  { key: "INTERVIEW", label: "Entrevista" },
  { key: "APPROVED", label: "Aprovado" },
];

const skillChipTones = ["blue", "violet", "emerald", "amber", "rose", "cyan"] as const;

function getStageIndex(status: ApplicationStatus) {
  if (status === "REJECTED") return -1;
  return pipelineStages.findIndex((stage) => stage.key === status);
}

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [profileComplete, setProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || user?.role !== "STUDENT") {
      setApplications([]);
      setJobs([]);
      setProfileComplete(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    Promise.allSettled([getMyApplications(token), getJobs(token), getMyStudentProfile(token)])
      .then((results) => {
        const [applicationsResult, jobsResult, profileResult] = results;

        setApplications(applicationsResult.status === "fulfilled" ? applicationsResult.value : []);
        setJobs(jobsResult.status === "fulfilled" ? jobsResult.value : []);
        setProfileComplete(profileResult.status === "fulfilled");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, user]);

  const summary = useMemo(
    () => [
      {
        label: "Candidaturas ativas",
        value: String(applications.filter((item) => item.status !== "REJECTED" && item.status !== "APPROVED").length),
        helper: "Processos acompanhados em tempo real",
        tone: "blue" as const,
        icon: "📨",
      },
      {
        label: "Entrevistas",
        value: String(applications.filter((item) => item.status === "INTERVIEW").length),
        helper: "Convites recebidos das empresas",
        tone: "violet" as const,
        icon: "🎤",
      },
      {
        label: "Aprovações",
        value: String(applications.filter((item) => item.status === "APPROVED").length),
        helper: "Candidaturas que avançaram",
        tone: "emerald" as const,
        icon: "🏆",
      },
      {
        label: "Vagas disponíveis",
        value: String(jobs.length),
        helper: "Oportunidades para explorar",
        tone: "amber" as const,
        icon: "✨",
      },
    ],
    [applications, jobs.length]
  );

  const recentStatuses = applications.slice(0, 4);
  const recommendedJobs = jobs.slice(0, 3);

  if (isLoading) {
    return (
      <section className="page-section dashboard-page">
        <header className="dashboard-hero dashboard-hero--student">
          <div>
            <span className="dashboard-hero__eyebrow">Dashboard do Candidato</span>
            <h1>Carregando seu painel...</h1>
          </div>
        </header>
      </section>
    );
  }

  return (
    <section className="page-section dashboard-page">
      <header className="dashboard-hero dashboard-hero--student">
        <div className="dashboard-hero__copy">
          <span className="dashboard-hero__eyebrow">Dashboard do Candidato</span>
          <h1>Olá{user?.firstName ? `, ${user.firstName}` : ""}! Acompanhe sua jornada.</h1>
          <p>Veja o andamento das suas candidaturas e descubra vagas com maior aderência ao seu perfil.</p>
        </div>
        <div className="dashboard-hero__actions">
          {!profileComplete ? (
            <button className="dashboard-hero__button" type="button" onClick={() => navigate("/completar-perfil/aluno")}>
              Completar perfil
            </button>
          ) : (
            <Link className="dashboard-hero__button" to="/vagas">
              Explorar vagas
            </Link>
          )}
        </div>
      </header>

      <section className="dashboard-stats">
        {summary.map((item) => (
          <article key={item.label} className={`dashboard-stat dashboard-stat--${item.tone}`}>
            <span className="dashboard-stat__icon" aria-hidden="true">{item.icon}</span>
            <div className="dashboard-stat__body">
              <span className="dashboard-stat__label">{item.label}</span>
              <strong className="dashboard-stat__value">{item.value}</strong>
              <span className="dashboard-stat__helper">{item.helper}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="dashboard-grid dashboard-grid--student">
        <article className="panel dashboard-card dashboard-card--timeline">
          <div className="dashboard-card__header">
            <div>
              <span className="panel__label">Linha do tempo</span>
              <h2>Andamento das suas candidaturas</h2>
            </div>
            <Link className="secondary-button" to="/perfil/aluno/candidaturas">Ver todas</Link>
          </div>

          <div className="pipeline-list">
            {recentStatuses.length ? recentStatuses.map((item) => {
              const stageIndex = getStageIndex(item.status);
              const rejected = item.status === "REJECTED";

              return (
                <div key={item.id} className="pipeline-item">
                  <div className="pipeline-item__top">
                    <strong>{item.job.title}</strong>
                    <span className={`pipeline-badge pipeline-badge--${rejected ? "rejected" : item.status.toLowerCase()}`}>
                      {getApplicationStatusLabel(item.status)}
                    </span>
                  </div>
                  <div className={`pipeline-track${rejected ? " pipeline-track--rejected" : ""}`}>
                    {pipelineStages.map((stage, index) => {
                      const reached = !rejected && index <= stageIndex;
                      return (
                        <div key={stage.key} className={`pipeline-step${reached ? " pipeline-step--done" : ""}`}>
                          <span className="pipeline-step__dot" aria-hidden="true" />
                          <span className="pipeline-step__label">{stage.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }) : (
              <p className="dashboard-empty">Você ainda não possui candidaturas. Explore as vagas e candidate-se!</p>
            )}
          </div>
        </article>

        <article className="panel dashboard-card dashboard-card--profile">
          <span className="panel__label">Perfil</span>
          <div className="dashboard-progress">
            <div className="dashboard-progress__ring" style={{ ["--value" as string]: profileComplete ? "100" : "40" }}>
              <span>{profileComplete ? "100%" : "40%"}</span>
            </div>
            <div>
              <h2>{profileComplete ? "Perfil completo!" : "Complete seu perfil"}</h2>
              <p>Quanto mais estruturado, melhor o matching com as vagas.</p>
            </div>
          </div>
          <div className="dashboard-tags">
            <span className="feed-chip feed-chip--blue">Skills</span>
            <span className="feed-chip feed-chip--violet">Curso</span>
            <span className="feed-chip feed-chip--emerald">Disponibilidade</span>
          </div>
          <Link className="primary-button" to="/perfil/aluno">Editar perfil</Link>
        </article>
      </section>

      <section className="panel dashboard-card dashboard-card--recommend">
        <div className="dashboard-card__header">
          <div>
            <span className="panel__label">Vagas recomendadas</span>
            <h2>Oportunidades para o seu perfil</h2>
          </div>
          <Link className="secondary-button" to="/vagas">Ver mais</Link>
        </div>

        <div className="dashboard-recommend-grid">
          {recommendedJobs.length ? recommendedJobs.map((job, index) => (
            <article key={job.id} className="dashboard-recommend-card">
              <div className="dashboard-recommend-card__top">
                <span className="dashboard-recommend-card__rank">#{index + 1}</span>
                <span className="status-pill status-pill--highlight">{getJobModelLabel(job.model)}</span>
              </div>
              <strong>{job.title}</strong>
              <p className="dashboard-recommend-card__company">{job.company?.name ?? "Empresa parceira"}</p>
              {job.skills.length ? (
                <div className="dashboard-tags">
                  {job.skills.slice(0, 3).map((skill, skillIndex) => (
                    <span key={skill} className={`feed-chip feed-chip--${skillChipTones[skillIndex % skillChipTones.length]}`}>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          )) : (
            <p className="dashboard-empty">Nenhuma vaga disponível no momento.</p>
          )}
        </div>
      </section>
    </section>
  );
}
