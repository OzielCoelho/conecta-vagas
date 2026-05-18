const companySummary = [
  {
    label: "Novas solicitações",
    value: "18",
    helper: "Recebidas nas últimas 48 horas",
  },
  {
    label: "Em triagem",
    value: "12",
    helper: "Candidatos aguardando decisão inicial",
  },
  {
    label: "Entrevistas marcadas",
    value: "6",
    helper: "Processos ativos nesta semana",
  },
];

const candidateRequests = [
  {
    name: "Ana Souza",
    role: "Front-end React",
    course: "ADS • 5º semestre",
    fit: "95%",
    status: "Perfil muito aderente",
    time: "há 12 min",
  },
  {
    name: "Marcos Lima",
    role: "Dados Jr.",
    course: "Eng. Software • 6º semestre",
    fit: "91%",
    status: "Em avaliação",
    time: "há 25 min",
  },
  {
    name: "Beatriz Moraes",
    role: "UX/UI Designer",
    course: "Design • 4º semestre",
    fit: "88%",
    status: "Documentos completos",
    time: "há 41 min",
  },
  {
    name: "João Pedro",
    role: "Back-end Node",
    course: "Sistemas • 7º semestre",
    fit: "84%",
    status: "Aguardando retorno",
    time: "há 1 h",
  },
];

const pipeline = [
  { label: "Recebidas", value: 24, tone: "blue" },
  { label: "Triagem", value: 12, tone: "amber" },
  { label: "Entrevista", value: 6, tone: "cyan" },
  { label: "Aprovadas", value: 4, tone: "green" },
];

const quickActions = [
  "Revisar currículo e portfólio",
  "Convidar para entrevista",
  "Enviar retorno com status atualizado",
];

export function CompanyCandidatesPage() {
  return (
    <section className="page-section company-candidates-page">
      <header className="page-header company-candidates-page__header">
        <div>
          <span className="page-eyebrow">Área da empresa</span>
          <h1>Solicitações de candidatos</h1>
          <p>Visualize os candidatos recebidos, acompanhe o pipeline e priorize os perfis com maior aderência.</p>
        </div>
      </header>

      <section className="company-candidates-page__summary content-grid content-grid--three">
        {companySummary.map((item) => (
          <article key={item.label} className="panel company-summary-card">
            <span className="panel__label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="company-candidates-layout">
        <article className="panel company-candidates-board">
          <div className="company-candidates-board__header">
            <div>
              <span className="panel__label">Solicitações recentes</span>
              <h2>Candidatos recebidos para vagas abertas</h2>
            </div>
            <button className="secondary-button" type="button">Exportar lista</button>
          </div>

          <div className="company-candidate-list">
            {candidateRequests.map((candidate) => (
              <article key={`${candidate.name}-${candidate.role}`} className="company-candidate-card">
                <div className="company-candidate-card__main">
                  <span className="company-candidate-card__avatar" aria-hidden="true">
                    {candidate.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                  <div>
                    <strong>{candidate.name}</strong>
                    <p>{candidate.role}</p>
                    <span>{candidate.course}</span>
                  </div>
                </div>

                <div className="company-candidate-card__fit">
                  <strong>{candidate.fit}</strong>
                  <span>{candidate.status}</span>
                </div>

                <div className="company-candidate-card__meta">
                  <span className="status-pill status-pill--highlight">{candidate.time}</span>
                  <div className="company-candidate-card__actions">
                    <button className="secondary-button" type="button">Ver perfil</button>
                    <button className="primary-button" type="button">Avançar</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </article>

        <aside className="company-candidates-side">
          <article className="panel company-pipeline-card">
            <span className="panel__label">Pipeline</span>
            <h2>Status atual das candidaturas</h2>
            <div className="company-pipeline-card__chart" aria-hidden="true" />
            <div className="company-pipeline-card__list">
              {pipeline.map((item) => (
                <div key={item.label} className="company-pipeline-card__item">
                  <span className={`company-pipeline-card__dot company-pipeline-card__dot--${item.tone}`} aria-hidden="true" />
                  <strong>{item.label}</strong>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel company-quick-actions-card">
            <span className="panel__label">Próximos passos</span>
            <h2>Ações rápidas da empresa</h2>
            <div className="stack-list">
              {quickActions.map((item) => (
                <div key={item} className="stack-list__item company-quick-actions-card__item">
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
          </article>
        </aside>
      </section>
    </section>
  );
}
