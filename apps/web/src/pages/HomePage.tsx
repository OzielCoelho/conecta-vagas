import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { AuthModal } from "../components/auth/AuthModal";
import { LoginForm } from "../components/auth/LoginForm";
import { RegisterForm } from "../components/auth/RegisterForm";

const publicHighlights = [
  {
    title: "Matching inteligente",
    description: "Conecte alunos e empresas com base em habilidades, curso, disponibilidade e aderência real.",
  },
  {
    title: "Transparência no processo",
    description: "Acompanhe status das candidaturas e reduza o ruído do processo manual de recrutamento.",
  },
  {
    title: "Perfis padronizados",
    description: "Organize informações de alunos e empresas em um formato claro para decisões mais rápidas.",
  },
];

export function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, startDemo } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const authMode = !isAuthenticated ? searchParams.get("auth") : null;

  function closeModal() {
    navigate("/", { replace: true });
  }

  return (
    <section className="page-section public-home-page">
      <section className="panel panel--hero public-home-hero">
        <div className="public-home-hero__content">
          <span className="page-eyebrow">Conecta Vagas</span>
          <h1>Uma plataforma para aproximar empregabilidade, acompanhamento e matching entre alunos e empresas.</h1>
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
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                startDemo("student");
                navigate("/");
              }}
            >
              Ver dashboard do aluno
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                startDemo("company");
                navigate("/");
              }}
            >
              Ver dashboard da empresa
            </button>
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

      <section className="panel public-home-info-card">
        <span className="panel__label">Como funciona</span>
        <h2>O aluno acompanha sua carreira. A empresa acompanha os candidatos. A plataforma organiza tudo.</h2>
        <p>
          Visitantes conhecem a solução, alunos têm um dashboard com foco em empregabilidade e empresas mantêm o
          painel operacional de candidatos e solicitações.
        </p>
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
