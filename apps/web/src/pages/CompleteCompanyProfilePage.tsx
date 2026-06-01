import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { CompanyProfileForm } from "../components/profile/CompanyProfileForm";
import { createCompanyProfile } from "../services/companies";

export function CompleteCompanyProfilePage() {
  const { token, markProfileComplete, refreshCurrentUser } = useAuth();
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
      await refreshCurrentUser();
      markProfileComplete();
      navigate("/perfil/empresa", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível salvar o perfil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-screen complete-profile-screen complete-profile-screen--company-simple">
      <div className="auth-card auth-card--wide complete-profile-card complete-profile-card--company-simple">
        <div className="auth-card__intro complete-profile-card__intro">
          <span className="page-eyebrow">Etapa final</span>
          <h1>Dados da empresa</h1>
          <p>Preencha as informações principais da empresa para concluir o acesso à plataforma.</p>
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
