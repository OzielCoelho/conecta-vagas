import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { CompanyProfileForm } from "../components/profile/CompanyProfileForm";
import { createCompanyProfile } from "../services/companies";

export function CompleteCompanyProfilePage() {
  const { token, markProfileComplete } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: Parameters<typeof createCompanyProfile>[0]) {
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createCompanyProfile(data, token);
      markProfileComplete();
      navigate("/", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível salvar o perfil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-screen">
      <div className="auth-card auth-card--wide">
        <div className="auth-card__intro">
          <span className="page-eyebrow">Perfil da empresa</span>
          <h1>Complete o perfil da empresa.</h1>
          <p>Adicione as informações principais para começar a publicar vagas e encontrar estudantes.</p>
        </div>

        <CompanyProfileForm
          submitLabel="Salvar perfil"
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
