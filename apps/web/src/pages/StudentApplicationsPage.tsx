import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import {
  getApplicationStatusLabel,
  getApplicationStatusTone,
  getMyApplications,
  type StudentApplication,
} from "../services/applications";

export function StudentApplicationsPage() {
  const { token, user } = useAuth();
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || user?.role !== "STUDENT") {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    getMyApplications(token)
      .then((response) => {
        setApplications(response);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as candidaturas.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, user]);

  const orderedApplications = useMemo(
    () => [...applications].sort((first, second) => new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()),
    [applications]
  );

  const summary = useMemo(
    () => [
      {
        label: "Total de candidaturas",
        value: String(orderedApplications.length),
        helper: "Processos já iniciados por você",
      },
      {
        label: "Em andamento",
        value: String(orderedApplications.filter((item) => item.status !== "REJECTED" && item.status !== "APPROVED").length),
        helper: "Status ativos no momento",
      },
      {
        label: "Score médio",
        value: orderedApplications.length
          ? `${Math.round(orderedApplications.reduce((total, item) => total + item.score, 0) / orderedApplications.length)}%`
          : "0%",
        helper: "Aderência média das vagas escolhidas",
      },
    ],
    [orderedApplications]
  );

  return (
    <section className="page-section student-applications-page student-applications-page--refined">
      <header className="page-header student-applications-page__header">
        <div>
          <span className="page-eyebrow">Candidaturas</span>
          <h1>Minhas candidaturas</h1>
          <p>Acompanhe o andamento real dos processos, veja o score de aderência e revise as vagas onde você já aplicou.</p>
        </div>
        <Link className="secondary-button" to="/vagas">
          Ver vagas
        </Link>
      </header>

      <section className="student-applications-page__summary content-grid content-grid--three">
        {summary.map((item) => (
          <article key={item.label} className="panel student-summary-card student-summary-card--applications">
            <span className="panel__label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.helper}</p>
          </article>
        ))}
      </section>

      {isLoading ? (
        <div className="content-grid content-grid--three">
          {[1, 2, 3].map((item) => (
            <div key={item} className="panel skeleton-card" />
          ))}
        </div>
      ) : error ? (
        <p className="form-error">{error}</p>
      ) : orderedApplications.length === 0 ? (
        <section className="panel student-applications-empty-state">
          <span className="panel__label">Nenhuma candidatura</span>
          <h2>Você ainda não se candidatou a nenhuma vaga.</h2>
          <p>Explore as oportunidades disponíveis e envie sua candidatura com um clique.</p>
          <Link className="primary-button" to="/vagas">
            Explorar vagas
          </Link>
        </section>
      ) : (
        <section className="student-applications-list">
          {orderedApplications.map((application) => (
            <article key={application.id} className="panel student-application-card">
              <div className="student-application-card__header">
                <div>
                  <span className="panel__label">{application.job.company?.name ?? "Empresa parceira"}</span>
                  <h2>{application.job.title}</h2>
                  <p>{application.job.location ?? "Local flexível"} • {application.job.model}</p>
                </div>
                <span className={`status-pill status-pill--${getApplicationStatusTone(application.status)}`}>
                  {getApplicationStatusLabel(application.status)}
                </span>
              </div>

              <div className="student-application-card__summary">
                <div>
                  <strong>{application.score}%</strong>
                  <span>Score desta candidatura</span>
                </div>
                <div>
                  <strong>{new Date(application.updatedAt).toLocaleDateString("pt-BR")}</strong>
                  <span>Última atualização</span>
                </div>
                <div>
                  <strong>{application.job.course ?? "Sem requisito específico"}</strong>
                  <span>Curso relacionado</span>
                </div>
              </div>

              <div className="skill-tags">
                {application.job.skills.map((skill) => (
                  <span key={skill} className="skill-tag">{skill}</span>
                ))}
              </div>

              <div className="student-application-card__footer">
                <p>{application.job.description}</p>
                <Link className="secondary-button" to="/vagas">
                  Ver vaga
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
