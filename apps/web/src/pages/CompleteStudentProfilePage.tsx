import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { StudentProfileForm, type StudentProfileFormValues } from "../components/profile/StudentProfileForm";
import { createStudentProfile } from "../services/students";

export function CompleteStudentProfilePage() {
  const { token, user, markProfileComplete, refreshCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = useMemo<StudentProfileFormValues>(() => ({
    firstName: user?.firstName ?? user?.name?.split(" ")[0] ?? "",
    lastName: user?.lastName ?? user?.name?.split(" ").slice(1).join(" ") ?? "",
    course: "",
    skills: "",
    availability: [],
    headline: "",
    summary: "",
    city: "",
    state: "",
    semester: "",
    university: "",
    cr: "",
    portfolio: "",
    photoUrl: "",
  }), [user]);

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
    <section className="auth-screen complete-profile-screen complete-profile-screen--animated">
      <div className="complete-profile-layout complete-profile-layout--animated">
        <aside className="complete-profile-layout__aside complete-profile-layout__aside--student complete-profile-layout__aside--animated">
          <span className="page-eyebrow">Perfil de candidato</span>
          <h1>Monte um perfil que represente de verdade o que empresas vão ver.</h1>
          <p>Agora você define disponibilidade, apresentação, dados acadêmicos, habilidades e foto em um único fluxo.</p>
          <div className="complete-profile-layout__features">
            <div className="complete-profile-layout__feature-item complete-profile-layout__feature-item--animated">
              <strong>Visual profissional</strong>
              <span>Seu perfil fica mais próximo da visão real de empresas e recrutadores.</span>
            </div>
            <div className="complete-profile-layout__feature-item complete-profile-layout__feature-item--animated">
              <strong>Disponibilidade padronizada</strong>
              <span>Escolha manhã, tarde e noite de forma consistente com o matching.</span>
            </div>
            <div className="complete-profile-layout__feature-item complete-profile-layout__feature-item--animated">
              <strong>Mais controle</strong>
              <span>Você decide o que mostrar e o que deixar em branco, sem informações mockadas.</span>
            </div>
          </div>
        </aside>

        <div className="auth-card auth-card--wide complete-profile-card complete-profile-card--animated">
          <div className="auth-card__intro complete-profile-card__intro">
            <span className="page-eyebrow">Etapa final</span>
            <h2>Dados do candidato</h2>
            <p>Preencha os campos para concluir o acesso à plataforma.</p>
          </div>

          <StudentProfileForm
            initialValues={initialValues}
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
