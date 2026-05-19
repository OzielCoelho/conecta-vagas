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
    <div className="register-layout">
      <aside className="register-layout__aside">
        <span className="page-eyebrow">Comece agora</span>
        <h2>Crie sua conta e entre na plataforma.</h2>
        <p>
          Escolha seu perfil, organize suas informações e continue para acompanhar vagas, matching e candidaturas.
        </p>
        <div className="register-layout__feature-list">
          <div className="register-layout__feature-item">
            <strong>Perfil estruturado</strong>
            <span>Candidato ou empresa com dados prontos para seguir.</span>
          </div>
          <div className="register-layout__feature-item">
            <strong>Fluxo simples</strong>
            <span>Cadastro direto com continuidade para completar o perfil.</span>
          </div>
          <div className="register-layout__feature-item">
            <strong>Experiência integrada</strong>
            <span>Dashboard, vagas e candidaturas em um só ambiente.</span>
          </div>
        </div>
      </aside>

      <div className="register-layout__form-wrap">
        <form className="auth-form register-form" onSubmit={handleSubmit}>
          <div className="register-form__header">
            <h3>Cadastro</h3>
            <p>Informe seus dados para criar a conta.</p>
          </div>

          <div className="register-role-selector" role="tablist" aria-label="Tipo de conta">
            <button
              type="button"
              className={role === "STUDENT" ? "register-role-option register-role-option--active" : "register-role-option"}
              onClick={() => setRole("STUDENT")}
            >
              Candidato
            </button>
            <button
              type="button"
              className={role === "COMPANY" ? "register-role-option register-role-option--active" : "register-role-option"}
              onClick={() => setRole("COMPANY")}
            >
              Empresa
            </button>
          </div>

          <div className="register-form__grid">
            <label className="field">
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>

            <label className="field">
              <span>Senha</span>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>

            <label className="field register-form__field--full">
              <span>Confirmar senha</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
          </div>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button register-form__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <p className="auth-card__footer register-form__footer">
          Já tem conta? <button className="auth-link-button" type="button" onClick={onSwitchToLogin}>Entrar</button>
        </p>
      </div>
    </div>
  );
}
