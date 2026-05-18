import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const studentSummary = [
  {
    label: "Candidaturas ativas",
    value: "5",
    helper: "Processos acompanhados em tempo real",
  },
  {
    label: "Perfil completo",
    value: "92%",
    helper: "Quanto melhor o perfil, melhor o matching",
  },
  {
    label: "Vagas recomendadas",
    value: "12",
    helper: "Compatibilidade alta com seu perfil",
  },
];

const studentStatuses = [
  { role: "Estágio Front-end React", status: "Enviado", tone: "blue" },
  { role: "Estágio em Dados", status: "Em análise", tone: "amber" },
  { role: "Estágio em Produto", status: "Entrevista", tone: "green" },
];

const studentRecommendations = [
  {
    title: "Estágio Front-end React",
    company: "Orbit Labs",
    score: "96%",
    summary: "Alto alinhamento com React, TypeScript e portfólio atualizado.",
  },
  {
    title: "Estágio em Produto Digital",
    company: "Nexa Studio",
    score: "92%",
    summary: "Boa aderência entre habilidades, comunicação e disponibilidade.",
  },
  {
    title: "Estágio Full Stack Jr.",
    company: "Bridge Tech",
    score: "89%",
    summary: "Stack técnica compatível e bom potencial de evolução na vaga.",
  },
];

export function StudentDashboardPage() {
  const navigate = useNavigate();
  const { startDemo, token } = useAuth();
  const isVisitor = !token;

  return (
    <section className="page-section student-dashboard-page">
      <header className="page-header student-dashboard-page__header">
        <div>
          <span className="page-eyebrow">Dashboard do Aluno</span>
          <h1>Seu centro de empregabilidade e acompanhamento de carreira.</h1>
          <p>
            Acompanhe o status real das suas candidaturas, mantenha o perfil padronizado atualizado e descubra
            vagas com maior matching score.
          </p>
        </div>
        {isVisitor ? (
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              startDemo("student");
              navigate("/");
            }}
          >
            Testar dashboard do aluno
          </button>
        ) : null}
      </header>

      <section className="student-dashboard-page__summary content-grid content-grid--three">
        {studentSummary.map((item) => (
          <article key={item.label} className="panel student-summary-card">
            <span className="panel__label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="student-dashboard-layout">
        <article className="panel student-dashboard-card">
          <div className="student-dashboard-card__header">
            <div>
              <span className="panel__label">Acompanhamento de status</span>
              <h2>Veja em que etapa cada candidatura está</h2>
            </div>
            <Link className="secondary-button" to="/vagas">
              Ver candidaturas
            </Link>
          </div>

          <div className="timeline-list">
            {studentStatuses.map((item) => (
              <div key={item.role} className={`timeline-list__item timeline-list__item--${item.tone}`}>
                <span className="timeline-list__dot" aria-hidden="true" />
                <div>
                  <strong>{item.role}</strong>
                  <p>{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel student-dashboard-card student-profile-cta-card">
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
            <span className="skill-tag">Disponibilidade pronta</span>
          </div>
        </article>
      </section>

      <section className="panel student-dashboard-card student-recommendations-card">
        <div className="student-dashboard-card__header">
          <div>
            <span className="panel__label">Vagas recomendadas</span>
            <h2>Oportunidades com maior matching score para você</h2>
          </div>
          <Link className="secondary-button" to="/vagas">
            Explorar vagas
          </Link>
        </div>

        <div className="student-recommendations-grid">
          {studentRecommendations.map((job) => (
            <article key={job.title} className="student-recommendation-card">
              <div className="student-recommendation-card__top">
                <div>
                  <strong>{job.title}</strong>
                  <p>{job.company}</p>
                </div>
                <span className="status-pill status-pill--highlight">{job.score}</span>
              </div>
              <p>{job.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
