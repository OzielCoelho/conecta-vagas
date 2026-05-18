import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

type LoginFormProps = {
  onSwitchToRegister: () => void;
};

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login, startDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login({ email, password });
      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect");
      const destination =
        result.profileStatus === "incomplete"
          ? result.user.role === "COMPANY"
            ? "/completar-perfil/empresa"
            : "/completar-perfil/aluno"
          : redirect || "/";

      navigate(destination, { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDemoLogin(mode: "student" | "company") {
    startDemo(mode);
    navigate(mode === "company" ? "/empresa/candidatos" : "/perfil/aluno", { replace: true });
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label className="field">
          <span>Senha</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <div className="auth-demo-actions">
        <p className="auth-demo-actions__label">Acesso rápido para visualizar a interface</p>
        <div className="auth-demo-actions__buttons">
          <button className="secondary-button" type="button" onClick={() => handleDemoLogin("student")}>
            Entrar como aluno demo
          </button>
          <button className="secondary-button" type="button" onClick={() => handleDemoLogin("company")}>
            Entrar como empresa demo
          </button>
        </div>
      </div>

      <p className="auth-card__footer">
        Ainda não tem conta? <button className="auth-link-button" type="button" onClick={onSwitchToRegister}>Criar cadastro</button>
      </p>
    </>
  );
}
