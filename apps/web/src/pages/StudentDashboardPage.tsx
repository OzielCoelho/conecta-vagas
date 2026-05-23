import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  getApplicationStatusLabel,
  getApplicationStatusTone,
  getMyApplications,
  type StudentApplication,
} from "../services/applications";
import { getJobs, type JobItem } from "../services/jobs";
import { getMyStudentProfile } from "../services/students";

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
      },
      {
        label: "Perfil completo",
        value: profileComplete ? "100%" : "0%",
        helper: "Quanto melhor o perfil, melhor o matching",
      },
      {
        label: "Vagas disponíveis",
        value: String(jobs.length),
        helper: "Oportunidades carregadas do backend",
      },
    ],
    [applications, jobs.length, profileComplete]
  );

  const recentStatuses = applications.slice(0, 3);
  const recommendedJobs = jobs.slice(0, 3);

  if (isLoading) {
    return (
      <section className="page-section student-dashboard-page">
        <header className="page-header student-dashboard-page__header">
          <div>
            <span className="page-eyebrow">Dashboard do Candidato</span>
            <h1>Seu centro de empregabilidade e acompanhamento de carreira.</h1>
            <p>Carregando dados reais do seu painel...</p>
          </div>
        </header>
      </section>
    );
  }

  return (
    <section className="page-section student-dashboard-page">
      <header className="page-header student-dashboard-page__header">
        <div>
          <span className="page-eyebrow">Dashboard do Candidato</span>
          <h1>Seu centro de empregabilidade e acompanhamento de carreira.</h1>
          <p>
            Acompanhe o status real das suas candidaturas, mantenha o perfil padronizado atualizado e descubra
            vagas com maior matching score.
          </p>
        </div>
        {!profileComplete ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              navigate("/completar-perfil/aluno");
            }}
          >
            Completar perfil
          </button>
        ) : null}
      </header>

      <section className="student-dashboard-page__summary content-grid content-grid--three">
        {summary.map((item) => (
          <article key={item.label} className="panel student-summary-card">
            <span className="panel__label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="student-dashboard-layout student-dashboard-layout--refined">
        <article className="panel student-dashboard-card student-dashboard-card--timeline">
          <div className="student-dashboard-card__header">
            <div>
              <span className="panel__label">Acompanhamento de status</span>
              <h2>Veja em que etapa cada candidatura está</h2>
            </div>
            <Link className="secondary-button" to="/perfil/aluno/candidaturas">
              Ver candidaturas
            </Link>
          </div>

          <div className="timeline-list timeline-list--dashboard">
            {recentStatuses.length ? recentStatuses.map((item) => (
              <div key={item.id} className={`timeline-list__item timeline-list__item--${getApplicationStatusTone(item.status)}`}>
                <span className="timeline-list__dot" aria-hidden="true" />
                <div>
                  <strong>{item.job.title}</strong>
                  <p>{getApplicationStatusLabel(item.status)}</p>
                </div>
              </div>
            )) : (
              <p>Você ainda não possui candidaturas ativas.</p>
            )}
          </div>
        </article>

        <article className="panel student-dashboard-card student-profile-cta-card student-profile-cta-card--refined">
          <div className="student-dashboard-card__header">
            <div>
              <span className="panel__label">Perfil padronizado</span>
              <h2>Atualize habilidades, curso e disponibilidade</h2>
            </div>
            <Link className="primary-button" to="/perfil/aluno">
              Editar perfil
            </Link>
          </div>
          <p>
            Quanto mais estruturado o seu perfil, mais transparente fica o processo e melhores são as recomendações.
          </p>
          <div className="student-profile-cta-card__tags">
            <span className="skill-tag">Skills atualizadas</span>
            <span className="skill-tag">Curso validado</span>
            <span className="skill-tag">Disponibilidade alinhada</span>
          </div>
        </article>
      </section>

      <section className="panel student-dashboard-card student-recommendations-card student-recommendations-card--refined">
        <div className="student-dashboard-card__header">
          <div>
            <span className="panel__label">Vagas recomendadas</span>
            <h2>Oportunidades disponíveis para você explorar</h2>
          </div>
          <Link className="secondary-button" to="/vagas">
            Explorar vagas
          </Link>
        </div>

        <div className="student-recommendations-grid student-recommendations-grid--refined">
          {recommendedJobs.length ? recommendedJobs.map((job, index) => (
            <article key={job.id} className="student-recommendation-card student-recommendation-card--refined">
              <div className="student-recommendation-card__top">
                <div>
                  <span className="panel__label">Top {index + 1}</span>
                  <strong>{job.title}</strong>
                  <p>{job.company?.name ?? "Empresa parceira"}</p>
                </div>
                <span className="status-pill status-pill--highlight">{job.model}</span>
              </div>
              <p>{job.description}</p>
            </article>
          )) : (
            <p>Nenhuma vaga disponível no momento.</p>
          )}
        </div>
      </section>
    </section>
  );
}
