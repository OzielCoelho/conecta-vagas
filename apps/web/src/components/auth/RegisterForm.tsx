import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

type RegisterFormProps = {
  onSwitchToLogin: () => void;
};

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"STUDENT" | "COMPANY">("STUDENT");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await register({ email, password, role });
      navigate(result.user.role === "COMPANY" ? "/completar-perfil/empresa" : "/completar-perfil/aluno", {
        replace: true,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível concluir o cadastro.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="role-selector">
          <button
            type="button"
            className={role === "STUDENT" ? "role-option role-option--active" : "role-option"}
            onClick={() => setRole("STUDENT")}
          >
            Aluno
          </button>
          <button
            type="button"
            className={role === "COMPANY" ? "role-option role-option--active" : "role-option"}
            onClick={() => setRole("COMPANY")}
          >
            Empresa
          </button>
        </div>

        <label className="field">
          <span>Email</span>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label className="field">
          <span>Senha</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>

        <label className="field">
          <span>Confirmar senha</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="auth-card__footer">
        Já tem conta? <button className="auth-link-button" type="button" onClick={onSwitchToLogin}>Entrar</button>
      </p>
    </>
  );
}
