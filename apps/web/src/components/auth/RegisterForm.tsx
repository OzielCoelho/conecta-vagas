import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";

const studentBenefits = [
  {
    title: "Perfil mais completo",
    description: "Nome, disponibilidade e apresentação já entram com mais contexto desde o início.",
  },
  {
    title: "Onboarding mais fluido",
    description: "Você termina o cadastro já vendo um perfil com aparência mais profissional.",
  },
  {
    title: "Mais aderência nas vagas",
    description: "Suas informações iniciais ajudam a montar um matching mais claro depois.",
  },
];

const companyBenefits = [
  {
    title: "Perfil estruturado",
    description: "Empresa com dados prontos para evoluir vagas e comunicação.",
  },
  {
    title: "Fluxo simples",
    description: "Cadastro direto com continuidade para completar o perfil.",
  },
  {
    title: "Experiência integrada",
    description: "Dashboard, vagas e candidatos em um só ambiente.",
  },
];

type RegisterFormProps = {
  onSwitchToLogin: () => void;
};

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"STUDENT" | "COMPANY">("STUDENT");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isStudent = role === "STUDENT";
  const featureList = isStudent ? studentBenefits : companyBenefits;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (isStudent && (!firstName.trim() || !lastName.trim())) {
      setError("Informe nome e sobrenome para criar seu perfil de candidato.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await register({
        email,
        password,
        role,
        firstName: isStudent ? firstName.trim() : undefined,
        lastName: isStudent ? lastName.trim() : undefined,
      });
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
    <div className={isStudent ? "register-layout register-layout--animated" : "register-layout register-layout--animated register-layout--company"}>
      <aside className={isStudent ? "register-layout__aside register-layout__aside--animated" : "register-layout__aside register-layout__aside--animated register-layout__aside--company"}>
        <span className="page-eyebrow">Comece agora</span>
        <h2>{isStudent ? "Crie sua conta e comece a montar seu perfil profissional." : "Crie sua conta e prepare sua empresa para publicar vagas."}</h2>
        <p>
          {isStudent
            ? "Defina suas informações iniciais e continue para um perfil de candidato mais claro e mais próximo do que empresas realmente veem."
            : "Organize sua base de recrutamento com um fluxo direto, visual e pronto para acompanhar candidatos."}
        </p>
        <div className="register-layout__feature-list">
          {featureList.map((feature) => (
            <div key={feature.title} className="register-layout__feature-item register-layout__feature-item--animated">
              <strong>{feature.title}</strong>
              <span>{feature.description}</span>
            </div>
          ))}
        </div>
      </aside>

      <div className="register-layout__form-wrap register-layout__form-wrap--animated">
        <form className="auth-form register-form register-form--animated" onSubmit={handleSubmit}>
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
            {isStudent ? (
              <>
                <label className="field">
                  <span>Nome</span>
                  <input value={firstName} onChange={(event) => setFirstName(event.target.value)} required={isStudent} />
                </label>

                <label className="field">
                  <span>Sobrenome</span>
                  <input value={lastName} onChange={(event) => setLastName(event.target.value)} required={isStudent} />
                </label>
              </>
            ) : null}

            <label className={isStudent ? "field register-form__field--full" : "field"}>
              <span>Email</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>

            <label className="field">
              <span>Senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
              />
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
          </div>

          <p className="register-form__hint">A senha deve ter pelo menos 6 caracteres.</p>

          {error ? <p className="form-error">{error}</p> : null}

          <button className="primary-button register-form__submit register-form__submit--animated" type="submit" disabled={isSubmitting}>
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
