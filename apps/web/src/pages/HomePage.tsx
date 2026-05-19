import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthModal } from "../components/auth/AuthModal";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import carouselImage1 from "../imagens/Captura de tela 2026-05-18 201519.png";
import carouselImage2 from "../imagens/Captura de tela 2026-05-18 202004.png";
import carouselImage3 from "../imagens/Captura de tela 2026-05-18 203625.png";
import carouselImage4 from "../imagens/Captura de tela 2026-05-18 204924.png";
import carouselImage5 from "../imagens/Captura de tela 2026-05-18 205022.png";
import carouselImage6 from "../imagens/Captura de tela 2026-05-18 205048.png";
import networkingHeroImage from "../imagens/HD-wallpaper-social-networks-blue-digital-background-networking-concepts-blue-networking-background-technology-background.jpg";

const publicHighlights = [
  {
    title: "Matching inteligente",
    description: "Conecte candidatos e empresas com base em habilidades, curso, disponibilidade e aderência real.",
  },
  {
    title: "Transparência no processo",
    description: "Acompanhe status das candidaturas e reduza o ruído do processo manual de recrutamento.",
  },
  {
    title: "Perfis padronizados",
    description: "Organize informações de candidatos e empresas em um formato claro para decisões mais rápidas.",
  },
];

const publicSteps = [
  "Crie um perfil padronizado com habilidades, curso e disponibilidade.",
  "Receba vagas recomendadas com maior matching score.",
  "Acompanhe o andamento de cada candidatura em tempo real.",
];

const publicStats = [
  { label: "Fluxo centralizado", value: "100%" },
  { label: "Perfis padronizados", value: "1 painel" },
  { label: "Processo visível", value: "Tempo real" },
];

const carouselImages = [
  { src: carouselImage1, alt: "Visão da home da plataforma" },
  { src: carouselImage2, alt: "Tela de vagas da plataforma" },
  { src: carouselImage3, alt: "Tela de perfil do candidato" },
  { src: carouselImage4, alt: "Tela de pipeline e acompanhamento" },
  { src: carouselImage5, alt: "Tela de candidatos e empresa" },
  { src: carouselImage6, alt: "Tela complementar da experiência" },
];

export function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const authMode = !isAuthenticated ? searchParams.get("auth") : null;

  function closeModal() {
    navigate("/", { replace: true });
  }

  return (
    <section className="page-section public-home-page">
      <section className="panel panel--hero public-home-hero public-home-hero--split">
        <div className="public-home-hero__content">
          <span className="page-eyebrow">Conecta Vagas</span>
          <h1>Uma plataforma para aproximar empregabilidade, acompanhamento e matching entre candidatos e empresas.</h1>
          <p>
            Centralize vagas, perfis e candidaturas em uma experiência mais clara para quem busca estágio e para quem
            recruta com eficiência.
          </p>

          <div className="hero__actions">
            <button className="primary-button" type="button" onClick={() => navigate("/?auth=register")}>
              Criar conta
            </button>
            <button className="secondary-button" type="button" onClick={() => navigate("/?auth=login")}>
              Entrar
            </button>
          </div>
        </div>

        <div className="public-home-hero__visual">
          <article className="public-home-preview-card public-home-preview-card--main">
            <span className="panel__label">Visão em tempo real</span>
            <h2>Pipeline simplificado</h2>
            <div className="public-home-preview-card__bars">
              <span style={{ width: "92%" }} />
              <span style={{ width: "68%" }} />
              <span style={{ width: "84%" }} />
            </div>
            <div className="public-home-preview-card__footer">
              <strong>Dashboard intuitivo</strong>
              <span>Status, matching e acompanhamento em um só lugar.</span>
            </div>
          </article>

          <div className="public-home-preview-stack">
            <article className="public-home-preview-card public-home-preview-card--side">
              <span className="panel__label">Matching</span>
              <div className="public-home-preview-card__score">96%</div>
              <p>Compatibilidade destacada para acelerar a decisão.</p>
            </article>

            <article className="public-home-preview-card public-home-preview-card--side">
              <span className="panel__label">Experiência guiada</span>
              <strong>Perfis, vagas e candidaturas no mesmo fluxo.</strong>
              <p>Uma linguagem única para toda a plataforma.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="panel public-home-spotlight">
        <div className="public-home-spotlight__media">
          <img
            src={networkingHeroImage}
            alt="Equipe diversa colaborando em um escritório"
            loading="lazy"
          />
        </div>

        <div className="public-home-spotlight__content">
          <span className="panel__label">Conexões reais</span>
          <h2>Uma plataforma feita para aproximar pessoas, oportunidades e empresas no mesmo ambiente.</h2>
          <p>
            Esse destaque reforça a proposta do Conecta Vagas: colaboração, diversidade e processos mais humanos sem perder clareza visual.
          </p>
          <div className="public-home-spotlight__stats">
            <div className="public-home-spotlight__stat">
              <strong>Perfis</strong>
              <span>candidatos e empresas no mesmo fluxo</span>
            </div>
            <div className="public-home-spotlight__stat">
              <strong>Status</strong>
              <span>acompanhamento centralizado das candidaturas</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel public-home-carousel-section">
        <div className="public-home-carousel-section__intro">
          <div>
            <span className="panel__label">Experiência visual</span>
            <h2>Conheça a plataforma em movimento.</h2>
            <p>Um carrossel com as telas principais para apresentar rapidamente a experiência do Conecta Vagas.</p>
          </div>
        </div>

        <div className="public-home-carousel" aria-label="Galeria animada de telas da plataforma">
          <div className="public-home-carousel__track">
            {[...carouselImages, ...carouselImages].map((image, index) => (
              <article key={`${image.alt}-${index}`} className="public-home-carousel__item">
                <img src={image.src} alt={image.alt} loading="lazy" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-home-highlights content-grid content-grid--three">
        {publicHighlights.map((item) => (
          <article key={item.title} className="panel public-home-highlight-card">
            <span className="panel__label">Destaque</span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
          </article>
        ))}
      </section>

      <section className="public-home-showcase-grid">
        <article className="panel public-home-info-card public-home-info-card--steps">
          <span className="panel__label">Como funciona</span>
          <h2>O candidato acompanha sua carreira. A empresa acompanha os candidatos. A plataforma organiza tudo.</h2>
          <div className="public-home-step-list">
            {publicSteps.map((item) => (
              <div key={item} className="public-home-step-item">
                <span className="public-home-step-item__icon" aria-hidden="true">•</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="panel public-home-stats-card">
          <span className="panel__label">Indicadores</span>
          <h2>Uma experiência mais visual para candidatos e empresas.</h2>
          <div className="public-home-stats-list">
            {publicStats.map((item) => (
              <div key={item.label} className="public-home-stats-item">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </article>
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
          subtitle="Escolha se você é candidato ou empresa e continue para completar seu perfil logo depois."
          onClose={closeModal}
        >
          <RegisterForm onSwitchToLogin={() => navigate("/?auth=login", { replace: true })} />
        </AuthModal>
      ) : null}
    </section>
  );
}
