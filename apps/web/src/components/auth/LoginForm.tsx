import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

type LoginFormProps = {
  onSwitchToRegister: () => void;
};

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
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

      <p className="auth-card__footer">
        Ainda não tem conta? <button className="auth-link-button" type="button" onClick={onSwitchToRegister}>Criar cadastro</button>
      </p>
    </>
  );
}
