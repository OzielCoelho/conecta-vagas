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
    <section className="auth-screen complete-profile-screen">
      <div className="complete-profile-layout">
        <aside className="complete-profile-layout__aside complete-profile-layout__aside--company">
          <span className="page-eyebrow">Perfil da empresa</span>
          <h1>Organize sua empresa antes de publicar e acompanhar candidatos.</h1>
          <p>Cadastre os dados principais para dar contexto às vagas e tornar o processo de recrutamento mais profissional.</p>
          <div className="complete-profile-layout__features">
            <div className="complete-profile-layout__feature-item">
              <strong>Apresentação clara</strong>
              <span>Mostre quem é sua empresa e o que ela busca.</span>
            </div>
            <div className="complete-profile-layout__feature-item">
              <strong>Vagas mais atraentes</strong>
              <span>Um perfil bem definido aumenta a confiança do candidato.</span>
            </div>
            <div className="complete-profile-layout__feature-item">
              <strong>Painel de candidatos</strong>
              <span>Depois disso, você acompanha solicitações e pipeline no dashboard da empresa.</span>
            </div>
          </div>
          <div className="complete-profile-layout__metrics complete-profile-layout__metrics--company">
            <div className="complete-profile-layout__metric-item">
              <strong>08</strong>
              <span>vagas prontas para contexto institucional</span>
            </div>
            <div className="complete-profile-layout__metric-item">
              <strong>24</strong>
              <span>candidaturas que dependem de um perfil bem apresentado</span>
            </div>
          </div>
        </aside>

        <div className="auth-card auth-card--wide complete-profile-card">
          <div className="auth-card__intro complete-profile-card__intro">
            <span className="page-eyebrow">Etapa final</span>
            <h2>Dados da empresa</h2>
            <p>Complete o perfil para continuar usando a plataforma.</p>
          </div>

          <CompanyProfileForm
            submitLabel="Salvar perfil"
            isSubmitting={isSubmitting}
            error={error}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </section>
  );
}
