import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { StudentProfileForm } from "../components/profile/StudentProfileForm";
import { createStudentProfile } from "../services/students";

export function CompleteStudentProfilePage() {
  const { token, markProfileComplete, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(data: Parameters<typeof createStudentProfile>[0]) {
    if (!token) {
      setError("Sessão inválida. Faça login novamente.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createStudentProfile(data, token);
      await refreshCurrentUser();
      markProfileComplete();
      navigate("/perfil/aluno", { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Não foi possível salvar o perfil.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="auth-screen complete-profile-screen">
      <div className="complete-profile-layout">
        <aside className="complete-profile-layout__aside complete-profile-layout__aside--student">
          <span className="page-eyebrow">Perfil de candidato</span>
          <h1>Complete seu perfil para começar sua jornada.</h1>
          <p>Adicione suas informações básicas, habilidades, foto e disponibilidade para receber vagas com maior aderência.</p>
          <div className="complete-profile-layout__features">
            <div className="complete-profile-layout__feature-item">
              <strong>Matching mais preciso</strong>
              <span>Seu perfil influencia diretamente as recomendações.</span>
            </div>
            <div className="complete-profile-layout__feature-item">
              <strong>Visibilidade profissional</strong>
              <span>Empresas enxergam seu curso, skills, foto e disponibilidade com clareza.</span>
            </div>
            <div className="complete-profile-layout__feature-item">
              <strong>Acompanhamento centralizado</strong>
              <span>Depois do cadastro, você acompanha candidaturas e oportunidades no dashboard.</span>
            </div>
          </div>
        </aside>

        <div className="auth-card auth-card--wide complete-profile-card">
          <div className="auth-card__intro complete-profile-card__intro">
            <span className="page-eyebrow">Etapa final</span>
            <h2>Dados do candidato</h2>
            <p>Preencha os campos para concluir o acesso à plataforma.</p>
          </div>

          <StudentProfileForm
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
