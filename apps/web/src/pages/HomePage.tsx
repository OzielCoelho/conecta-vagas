import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthModal } from "../components/auth/AuthModal";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";
import carouselImage1 from "../imagens/Captura de tela 2026-05-18 201519.png";
import carouselImage3 from "../imagens/Captura de tela 2026-05-18 203625.png";
import carouselImage4 from "../imagens/Captura de tela 2026-05-18 204924.png";
import carouselImage5 from "../imagens/Captura de tela 2026-05-18 205022.png";
import carouselImage6 from "../imagens/Captura de tela 2026-05-18 205048.png";
import showcaseImage1 from "../imagens/Captura de tela 2026-05-18 205107.png";
import showcaseImage2 from "../imagens/Captura de tela 2026-05-18 205308.png";
import networkingHeroImage from "../imagens/HD-wallpaper-social-networks-blue-digital-background-networking-concepts-blue-networking-background-technology-background.jpg";
import supportImage from "../imagens/The-power-of-networking-640x333.webp";
import estagiosImage from "../imagens/estagios.png";
import slideImage from "../imagens/slide_32.png";

const audienceCards = [
  {
    label: "Para candidatos",
    title: "Organize sua busca por estágio e acompanhe cada passo.",
    image: showcaseImage1,
    points: ["Monte um perfil direto", "Descubra vagas compatíveis", "Acompanhe seus envios"],
  },
  {
    label: "Para empresas",
    title: "Publique vagas e centralize candidatos em um painel visual.",
    image: showcaseImage2,
    points: ["Crie vagas com rapidez", "Compare perfis com mais contexto", "Acompanhe candidaturas"],
  },
];

const publicSteps = [
  {
    step: "01",
    title: "Monte seu perfil",
    description: "Organize dados e habilidades em poucos passos.",
  },
  {
    step: "02",
    title: "Encontre compatibilidade",
    description: "Veja vagas e perfis com mais aderência.",
  },
  {
    step: "03",
    title: "Acompanhe o processo",
    description: "Mantenha o andamento visível do início ao fim.",
  },
];

const showcaseCards = [
  {
    title: "Painel de vagas",
    description: "Visualize oportunidades e filtros com rapidez.",
    image: slideImage,
  },
  {
    title: "Perfil padronizado",
    description: "Apresente informações importantes com mais clareza.",
    image: carouselImage3,
  },
  {
    title: "Pipeline de acompanhamento",
    description: "Entenda status e próximos passos em uma única visão.",
    image: showcaseImage2,
  },
];

const carouselImages = [
  { src: carouselImage1, alt: "Visão geral da plataforma" },
  { src: slideImage, alt: "Painel inicial da plataforma" },
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

  function handlePrimaryAction() {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }

    navigate("/?auth=register");
  }

  function handleSecondaryAction() {
    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }

    navigate("/?auth=login");
  }

  return (
    <section className="page-section public-home-page public-home-page--standalone">
      <header className="public-home-header">
        <div className="public-home-header__brand">
          <span className="public-home-header__brand-badge" aria-hidden="true">
            <span className="public-home-header__brand-orbit public-home-header__brand-orbit--one" />
            <span className="public-home-header__brand-orbit public-home-header__brand-orbit--two" />
            <span className="public-home-header__brand-core" />
          </span>
          <div>
            <strong>ConectaVagas</strong>
            <span>Conexões entre candidatos e empresas.</span>
          </div>
        </div>

        <div className="public-home-header__actions">
          <button className="secondary-button" type="button" onClick={handleSecondaryAction}>
            {isAuthenticated ? "Ir para o dashboard" : "Entrar"}
          </button>
          {!isAuthenticated ? (
            <button className="primary-button" type="button" onClick={handlePrimaryAction}>
              Criar conta
            </button>
          ) : null}
        </div>
      </header>

      <section className="panel panel--hero public-home-hero public-home-hero--split">
        <div className="public-home-hero__content">
          <div className="public-home-hero__content-art" aria-hidden="true">
            <img src={estagiosImage} alt="" loading="lazy" />
          </div>
          <span className="page-eyebrow">Conecta Vagas</span>
          <h1>Conecte candidatos, empresas e oportunidades em um só lugar.</h1>

          <div className="hero__actions">
            <button className="primary-button" type="button" onClick={handlePrimaryAction}>
              {isAuthenticated ? "Abrir dashboard" : "Criar conta"}
            </button>
            <button className="secondary-button" type="button" onClick={handleSecondaryAction}>
              {isAuthenticated ? "Ver painel" : "Entrar"}
            </button>
          </div>
        </div>

        <div className="public-home-hero__visual">
          <article className="public-home-preview-card public-home-preview-card--main">
            <span className="panel__label">Visão geral</span>
            <h2>Uma plataforma só para acompanhar toda a jornada.</h2>
            <div className="public-home-preview-card__bars">
              <span style={{ width: "92%" }} />
              <span style={{ width: "72%" }} />
              <span style={{ width: "84%" }} />
            </div>
            <div className="public-home-preview-card__footer">
              <strong>Dashboard, vagas e candidatos</strong>
              <span>Mais contexto visual para decidir rápido.</span>
            </div>
          </article>

          <div className="public-home-preview-stack">
            <article className="public-home-preview-card public-home-preview-card--side">
              <span className="panel__label">Matching</span>
              <div className="public-home-preview-card__score">96%</div>
              <p>Compatibilidade em destaque para acelerar escolhas.</p>
            </article>

            <article className="public-home-preview-card public-home-preview-card--side">
              <span className="panel__label">Fluxo</span>
              <strong>Do perfil ao acompanhamento.</strong>
              <p>Sem trocar de contexto a cada etapa.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="panel public-home-carousel-section public-home-carousel-section--feature">
        <div className="public-home-carousel-section__intro public-home-carousel-section__intro--compact">
          <div>
            <span className="panel__label">Sistema Conecta Vagas</span>
            <h2>Um jeito simples de encontrar sua próxima vaga de estágio.</h2>
          </div>
        </div>

        <div className="public-home-carousel" aria-label="Galeria animada de telas da plataforma">
          <div className="public-home-carousel__track">
            {[...carouselImages, ...carouselImages].map((image, index) => (
              <article key={`${image.alt}-${index}`} className="public-home-carousel__item public-home-carousel__item--large">
                <img src={image.src} alt={image.alt} loading="lazy" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-home-audience-grid">
        {audienceCards.map((item) => (
          <article key={item.label} className="panel public-home-audience-card">
            <div className="public-home-audience-card__image">
              <img src={item.image} alt={item.title} loading="lazy" />
            </div>
            <div className="public-home-audience-card__content">
              <span className="panel__label">{item.label}</span>
              <h2>{item.title}</h2>
              <div className="public-home-audience-card__points">
                {item.points.map((point) => (
                  <span key={point} className="skill-tag">{point}</span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="public-home-career-grid">
        {showcaseCards.map((item) => (
          <article key={item.title} className="panel public-home-career-card">
            <div className="public-home-career-card__image">
              <img src={item.image} alt={item.title} loading="lazy" />
            </div>
            <div className="public-home-career-card__content">
              <h2>{item.title}</h2>
              <p>{item.description}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="panel public-home-spotlight public-home-spotlight--compact">
        <div className="public-home-spotlight__media">
          <img src={networkingHeroImage} alt="Rede de conexões representando o encontro entre talentos e empresas" loading="lazy" />
        </div>

        <div className="public-home-spotlight__content">
          <span className="panel__label">O que você encontra aqui</span>
          <h2>Uma entrada mais clara para explorar a plataforma antes do painel principal.</h2>
          <p>Perfis, oportunidades, matching e acompanhamento apresentados de forma mais direta.</p>
          <div className="public-home-spotlight__stats">
            <div className="public-home-spotlight__stat">
              <strong>1 lugar</strong>
              <span>para vagas, perfis e candidaturas</span>
            </div>
            <div className="public-home-spotlight__stat">
              <strong>2 públicos</strong>
              <span>candidatos e empresas no mesmo ambiente</span>
            </div>
          </div>
        </div>
      </section>

      <section className="panel public-home-journey-section">
        <div className="public-home-journey-section__intro">
          <span className="panel__label">Como funciona</span>
          <h2>Três passos para começar.</h2>
        </div>

        <div className="public-home-journey-grid">
          {publicSteps.map((item) => (
            <article key={item.step} className="public-home-journey-card">
              <span className="public-home-journey-card__step">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel public-home-cta-section">
        <div className="public-home-cta-section__content">
          <div>
            <span className="panel__label">Pronto para entrar?</span>
            <h2>Abra o dashboard ou crie sua conta para continuar.</h2>
          </div>

          <div className="hero__actions hero__actions--secondary">
            <button className="primary-button" type="button" onClick={handlePrimaryAction}>
              {isAuthenticated ? "Ir para o dashboard" : "Criar conta"}
            </button>
            <button className="secondary-button" type="button" onClick={handleSecondaryAction}>
              {isAuthenticated ? "Ver painel" : "Entrar"}
            </button>
          </div>
        </div>
        <div className="public-home-cta-section__visual">
          <img src={supportImage} alt="Ilustração de conexões profissionais" loading="lazy" />
        </div>
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
