import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  getApplicationsByJob,
  getApplicationStatusLabel,
  getApplicationStatusTone,
  updateApplicationStatus,
  type ApplicationStatus,
  type CompanyApplication,
} from "../services/applications";
import { getMyCompanyJobs, type JobItem } from "../services/jobs";

const candidateStageOrder: ApplicationStatus[] = [
  "SENT",
  "UNDER_REVIEW",
  "INTERVIEW",
  "APPROVED",
];

export function CompanyCandidatesPage() {
  const { token, user } = useAuth();
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [query, setQuery] = useState("");
  const [selectedApplicationId, setSelectedApplicationId] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!token || (user?.role !== "COMPANY" && user?.role !== "COORDINATOR")) {
      setJobs([]);
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const loadJobs = user.role === "COMPANY" ? getMyCompanyJobs(token) : Promise.resolve([] as JobItem[]);

    loadJobs
      .then((response) => {
        setJobs(response);
        setSelectedJobId(response[0]?.id ?? "");
      })
      .catch(() => {
        setJobs([]);
        setSelectedJobId("");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token, user]);

  useEffect(() => {
    if (!token || !selectedJobId) {
      setApplications([]);
      return;
    }

    getApplicationsByJob(selectedJobId, token)
      .then((response) => {
        setApplications(response);
        setSelectedApplicationId(response[0]?.id ?? "");
      })
      .catch(() => {
        setApplications([]);
      });
  }, [selectedJobId, token]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const haystack = [
        application.student.name,
        application.student.course,
        application.student.skills.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query.toLowerCase());
    });
  }, [applications, query]);

  const selectedApplication =
    filteredApplications.find((application) => application.id === selectedApplicationId) ?? filteredApplications[0] ?? null;

  const summary = useMemo(
    () => [
      {
        label: "Candidaturas recebidas",
        value: String(applications.length),
        helper: "Dados reais da vaga selecionada",
      },
      {
        label: "Em andamento",
        value: String(applications.filter((item) => item.status === "UNDER_REVIEW" || item.status === "INTERVIEW").length),
        helper: "Perfis em análise ou entrevista",
      },
      {
        label: "Aprovadas",
        value: String(applications.filter((item) => item.status === "APPROVED").length),
        helper: "Candidaturas avançadas",
      },
    ],
    [applications]
  );

  function getNextStatus(status: ApplicationStatus) {
    const currentIndex = candidateStageOrder.indexOf(status);
    return candidateStageOrder[Math.min(currentIndex + 1, candidateStageOrder.length - 1)];
  }

  async function handleStatusUpdate(application: CompanyApplication, nextStatus: ApplicationStatus) {
    if (!token) {
      return;
    }

    setIsUpdating(application.id);
    setFeedbackMessage(null);

    try {
      await updateApplicationStatus(application.id, nextStatus, token);
      setApplications((current) => current.map((item) => (item.id === application.id ? { ...item, status: nextStatus } : item)));
      setFeedbackMessage(`Status atualizado para ${getApplicationStatusLabel(nextStatus)}.`);
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : "Não foi possível atualizar a candidatura.");
    } finally {
      setIsUpdating(null);
    }
  }

  if (isLoading) {
    return (
      <section className="page-section company-candidates-page">
        <header className="page-header company-candidates-page__header">
          <div>
            <span className="page-eyebrow">Área da empresa</span>
            <h1>Solicitações de candidatos</h1>
            <p>Carregando dados reais do backend...</p>
          </div>
        </header>
      </section>
    );
  }

  return (
    <section className="page-section company-candidates-page">
      <header className="page-header company-candidates-page__header">
        <div>
          <span className="page-eyebrow">Área da empresa</span>
          <h1>Solicitações de candidatos</h1>
          <p>Visualize os candidatos inscritos nas suas vagas e decida quem avança ou é recusado.</p>
        </div>
      </header>

      <section className="company-candidates-page__summary content-grid content-grid--three">
        {summary.map((item) => (
          <article key={item.label} className="panel company-summary-card">
            <span className="panel__label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="company-candidates-layout company-candidates-layout--refined">
        <article className="panel company-candidates-board company-candidates-board--refined">
          <div className="company-candidates-board__header">
            <div>
              <span className="panel__label">Solicitações recentes</span>
              <h2>Candidatos recebidos para vagas abertas</h2>
            </div>
            <label className="field company-candidates-toolbar__search">
              <span>Vaga</span>
              <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)}>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="company-candidates-toolbar">
            <label className="field company-candidates-toolbar__search">
              <span>Buscar candidato</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, curso, skill..." />
            </label>
          </div>

          {feedbackMessage ? <p className="form-success company-candidates-board__feedback">{feedbackMessage}</p> : null}

          {!jobs.length ? <p>Você ainda não possui vagas cadastradas.</p> : null}

          <div className="company-candidate-list company-candidate-list--refined">
            {filteredApplications.length ? filteredApplications.map((application, index) => {
              const nextStatus = getNextStatus(application.status);
              const canAdvance = application.status !== "APPROVED" && application.status !== "REJECTED" && nextStatus !== application.status;
              const canReject = application.status !== "APPROVED" && application.status !== "REJECTED";

              return (
                <article
                  key={application.id}
                  className={selectedApplication?.id === application.id ? "company-candidate-card company-candidate-card--refined company-candidate-card--active" : "company-candidate-card company-candidate-card--refined"}
                >
                  <div className="company-candidate-card__main">
                    <span className="company-candidate-card__avatar" aria-hidden="true">
                      {application.student.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div>
                      <span className="panel__label">Top {index + 1}</span>
                      <strong>{application.student.name}</strong>
                      <p>{application.student.course}</p>
                      <span>{application.student.availability}</span>
                    </div>
                  </div>

                  <div className="company-candidate-card__fit company-candidate-card__fit--refined">
                    <strong>{application.score}%</strong>
                    <span>{getApplicationStatusLabel(application.status)}</span>
                  </div>

                  <div className="company-candidate-card__meta">
                    <span className={`status-pill status-pill--${getApplicationStatusTone(application.status)}`}>
                      {getApplicationStatusLabel(application.status)}
                    </span>
                    <div className="company-candidate-card__actions">
                      <button className="secondary-button" type="button" onClick={() => setSelectedApplicationId(application.id)}>
                        Ver perfil
                      </button>
                      {canReject ? (
                        <button
                          className="secondary-button"
                          type="button"
                          disabled={isUpdating === application.id}
                          onClick={() => void handleStatusUpdate(application, "REJECTED")}
                        >
                          {isUpdating === application.id ? "Atualizando..." : "Recusar"}
                        </button>
                      ) : null}
                      {canAdvance ? (
                        <button
                          className="primary-button"
                          type="button"
                          disabled={isUpdating === application.id}
                          onClick={() => void handleStatusUpdate(application, nextStatus)}
                        >
                          {isUpdating === application.id ? "Atualizando..." : nextStatus === "APPROVED" ? "Aceitar" : "Avançar"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            }) : (
              <p>Nenhuma candidatura encontrada para a vaga selecionada.</p>
            )}
          </div>
        </article>

        <aside className="company-candidates-side company-candidates-side--refined">
          <article className="panel company-candidate-detail-card">
            <span className="panel__label">Detalhes do candidato</span>
            <h2>{selectedApplication?.student.name ?? "Nenhum candidato selecionado"}</h2>
            {selectedApplication ? (
              <div className="company-candidate-detail-card__content">
                <p>{selectedApplication.student.portfolio ?? "Sem portfólio informado no momento."}</p>
                <div className="company-candidate-detail-card__meta-grid">
                  <div>
                    <span>Curso</span>
                    <strong>{selectedApplication.student.course}</strong>
                  </div>
                  <div>
                    <span>Disponibilidade</span>
                    <strong>{selectedApplication.student.availability}</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>{getApplicationStatusLabel(selectedApplication.status)}</strong>
                  </div>
                  <div>
                    <span>Match</span>
                    <strong>{selectedApplication.score}%</strong>
                  </div>
                </div>
                <div className="skill-tags">
                  {selectedApplication.student.skills.map((skill) => (
                    <span key={skill} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
            ) : (
              <p>Selecione um candidato para ver mais contexto.</p>
            )}
          </article>
        </aside>
      </section>
    </section>
  );
}
