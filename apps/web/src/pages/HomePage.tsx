import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthModal } from "../components/auth/AuthModal";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import { getHealth } from "../services/health";
import { getMyStudentProfile } from "../services/students";

type HealthState = "loading" | "online" | "offline";

const featuredJobs = [
  {
    title: "Estágio Front-end React",
    company: "Orbit Labs",
    score: "96%",
    model: "Remoto",
    description: "Atue com React, componentes reutilizáveis e interfaces modernas para produtos digitais.",
  },
  {
    title: "Estágio em Produto Digital",
    company: "Nexa Studio",
    score: "92%",
    model: "Híbrido",
    description: "Participe de discovery, prototipação e evolução de experiências centradas no usuário.",
  },
  {
    title: "Estágio Full Stack Jr.",
    company: "Bridge Tech",
    score: "89%",
    model: "Presencial",
    description: "Apoie APIs, integrações e dashboards internos com foco em crescimento técnico acelerado.",
  },
];

const perfectMatches = [
  { title: "Estágio Front-end React", company: "Orbit Labs", score: "96%" },
  { title: "Estágio em Produto Digital", company: "Nexa Studio", score: "92%" },
  { title: "Estágio Full Stack Jr.", company: "Bridge Tech", score: "89%" },
];

const applicationTimeline = [
  { role: "Estágio Front-end", status: "Enviado", tone: "blue" },
  { role: "Estágio em Dados", status: "Em análise", tone: "amber" },
  { role: "Estágio em Produto", status: "Entrevista", tone: "green" },
];

const kpis = [
  {
    label: "Alinhamento médio",
    value: "91%",
    helper: "Com base no seu perfil atual",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false"><path d="M6 16h3l2-4 3 3 4-7 1 1V18H6Z" fill="currentColor" /></svg>
    ),
  },
  {
    label: "Vagas abertas",
    value: "45",
    helper: "Atualizadas diariamente",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false"><path d="M9 6V4.5h6V6h4A1.5 1.5 0 0 1 20.5 7.5v10A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 5 6Zm1.5 0h3V6h-3Zm-5 4v7.5H19V10Z" fill="currentColor" /></svg>
    ),
  },
  {
    label: "Candidaturas ativas",
    value: "17",
    helper: "Acompanhadas em tempo real",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false"><path d="M12 5a3.5 3.5 0 1 1-3.5 3.5A3.5 3.5 0 0 1 12 5Zm0 9c4 0 7 2.1 7 4.5V20H5v-1.5C5 16.1 8 14 12 14Z" fill="currentColor" /></svg>
    ),
  },
];

export function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, startDemo, token, user } = useAuth();
  const [healthState, setHealthState] = useState<HealthState>("loading");
  const [featuredJobIndex, setFeaturedJobIndex] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(82);

  useEffect(() => {
    let isMounted = true;

    getHealth()
      .then((response) => {
        if (isMounted) {
          setHealthState(response.status === "ok" ? "online" : "offline");
        }
      })
      .catch(() => {
        if (isMounted) {
          setHealthState("offline");
        }
      });

    if (token && user?.role === "STUDENT") {
      getMyStudentProfile(token)
        .then((profile) => {
          if (!isMounted) return;

          const localRaw = window.localStorage.getItem(`conecta_vagas_student_details_${user.id}`);
          const localData = localRaw ? (JSON.parse(localRaw) as Record<string, string>) : {};
          const fields = [
            profile.name,
            profile.course,
            profile.skills.length ? "skills" : "",
            profile.availability,
            profile.portfolio ?? "",
            localData.age ?? "",
            localData.city ?? "",
            localData.state ?? "",
            localData.summary ?? "",
            localData.title ?? "",
            localData.semester ?? "",
            localData.university ?? "",
            localData.cr ?? "",
          ];
          const completed = fields.filter((value) => String(value).trim()).length;
          setProfileCompletion(Math.round((completed / fields.length) * 100));
        })
        .catch(() => {
          if (isMounted) {
            setProfileCompletion(82);
          }
        });
    }

    return () => {
      isMounted = false;
    };
  }, [token, user]);

  const healthLabel = useMemo(() => {
    if (healthState === "loading") return "Verificando conexão com a API";
    if (healthState === "online") return "API conectada e pronta";
    return "API indisponível no momento";
  }, [healthState]);

  const searchParams = new URLSearchParams(location.search);
  const authMode = !isAuthenticated ? searchParams.get("auth") : null;

  function closeModal() {
    navigate("/", { replace: true });
  }

  return (
    <section className="page-section home-page">
      <section className="hero panel panel--hero home-hero-grid">
        <div className="hero__content">
          <span className="page-eyebrow">Dashboard</span>
          <h1>Conecte estudantes a estágios com mais clareza e matching inteligente.</h1>
          <p>
            Um painel central para acompanhar vagas, candidaturas, compatibilidade e progresso do perfil de forma mais visual.
          </p>

          <div className="status-row">
            <span
              className={
                healthState === "online"
                  ? "status-pill status-pill--online"
                  : healthState === "offline"
                    ? "status-pill status-pill--offline"
                    : "status-pill"
              }
            >
              {healthLabel}
            </span>
          </div>

          {!isAuthenticated ? (
            <div className="hero__actions">
              <button className="primary-button" type="button" onClick={() => navigate("/?auth=register")}>
                Criar conta
              </button>
              <button className="secondary-button" type="button" onClick={() => navigate("/?auth=login")}>
                Entrar
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  startDemo("student");
                  navigate("/perfil/aluno");
                }}
              >
                Testar demonstração
              </button>
            </div>
          ) : null}
        </div>

        <div className="home-hero-side panel panel--soft home-animated-card">
          <span className="panel__label">Completude do perfil</span>
          <strong className="home-hero-side__value">{profileCompletion}%</strong>
          <div className="progress-bar progress-bar--animated">
            <span className="progress-bar__fill" style={{ width: `${profileCompletion}%` }} />
          </div>
          <p>Quanto mais completo o perfil, melhor o ranking e a qualidade do matching.</p>
        </div>
      </section>

      <section className="home-kpi-grid home-stagger-grid">
        {kpis.map((item) => (
          <article key={item.label} className="panel home-kpi-card home-animated-card">
            <div className="home-kpi-card__top">
              <span className="panel__label">{item.label}</span>
              <span className="home-kpi-card__icon" aria-hidden="true">{item.icon}</span>
            </div>
            <strong className="home-kpi-card__value">{item.value}</strong>
            <p>{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="home-main-layout">
        <div className="home-main-stack">
          <section className="panel home-carousel-card home-animated-card">
            <div className="home-carousel-card__header">
              <div>
                <span className="panel__label">Vagas em destaque</span>
                <h2>Explore 3 oportunidades recomendadas</h2>
              </div>
              <div className="home-carousel-card__actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setFeaturedJobIndex((current) => (current === 0 ? featuredJobs.length - 1 : current - 1))}
                >
                  ←
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setFeaturedJobIndex((current) => (current === featuredJobs.length - 1 ? 0 : current + 1))}
                >
                  →
                </button>
              </div>
            </div>

            <div className="home-carousel-track" style={{ transform: `translateX(-${featuredJobIndex * 100}%)` }}>
              {featuredJobs.map((job) => (
                <article key={job.title} className="home-carousel-slide">
                  <div className="home-carousel-slide__meta">
                    <span className="status-pill status-pill--highlight">{job.score} de compatibilidade</span>
                    <span className="status-pill">{job.model}</span>
                  </div>
                  <h2>{job.title}</h2>
                  <strong>{job.company}</strong>
                  <p>{job.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="content-grid home-dashboard-grid">
            <article className="panel home-widget-card home-animated-card">
              <span className="panel__label">Vagas Match Perfeito</span>
              <h2>Oportunidades com maior aderência</h2>
              <div className="stack-list stack-list--animated">
                {perfectMatches.map((match) => (
                  <div key={match.title} className="stack-list__item">
                    <div>
                      <strong>{match.title}</strong>
                      <p>{match.company}</p>
                    </div>
                    <span className="status-pill status-pill--highlight">{match.score}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="panel home-widget-card home-animated-card">
              <span className="panel__label">Timeline de candidaturas</span>
              <h2>Etapa atual de cada processo</h2>
              <div className="timeline-list timeline-list--animated">
                {applicationTimeline.map((item) => (
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
          </section>
        </div>

        <aside className="home-side-column">
          <article className="panel home-widget-card home-animated-card">
            <span className="panel__label">Compartilhamento</span>
            <h2>Indique vagas para colegas</h2>
            <p>Compartilhe oportunidades rapidamente e aumente o alcance das vagas mais relevantes.</p>
            <button className="secondary-button" type="button">Copiar link da vaga</button>
          </article>

          <article className="panel home-widget-card home-animated-card home-visual-card">
            <span className="panel__label">Status das candidaturas</span>
            <h2>Resumo visual do andamento</h2>
            <div className="stack-list">
              <div className="stack-list__item"><strong>Enviado</strong><span className="status-pill status-pill--blue">33</span></div>
              <div className="stack-list__item"><strong>Em análise</strong><span className="status-pill status-pill--amber">9</span></div>
              <div className="stack-list__item"><strong>Entrevista</strong><span className="status-pill status-pill--green">5</span></div>
            </div>
            <div className="home-ring-chart" aria-hidden="true" />
          </article>

          <article className="panel home-widget-card home-animated-card">
            <span className="panel__label">Acompanhamento</span>
            <h2>Próximos passos</h2>
            <p>Mantenha o perfil atualizado e acompanhe a evolução das vagas com maior score.</p>
          </article>
        </aside>
      </section>

      {authMode === "login" ? (
        <AuthModal
          title="Acesse sua conta."
          subtitle="Entre para acompanhar oportunidades, perfis e conexões dentro da plataforma."
          onClose={closeModal}
        >
          <LoginForm onSwitchToRegister={() => navigate("/?auth=register", { replace: true })} />
        </AuthModal>
      ) : null}

      {authMode === "register" ? (
        <AuthModal
          title="Crie sua conta."
          subtitle="Escolha se você é aluno ou empresa e continue para completar seu perfil logo depois."
          onClose={closeModal}
        >
          <RegisterForm onSwitchToLogin={() => navigate("/?auth=login", { replace: true })} />
        </AuthModal>
      ) : null}
    </section>
  );
}
