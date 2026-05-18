import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { StudentProfileForm } from "../components/profile/StudentProfileForm";
import { createStudentProfile } from "../services/students";

export function CompleteStudentProfilePage() {
  const { token, markProfileComplete } = useAuth();
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
          <span className="page-eyebrow">Perfil de aluno</span>
          <h1>Complete seu perfil.</h1>
          <p>Preencha seus dados para começar a buscar estágios e se conectar com empresas.</p>
        </div>

        <StudentProfileForm
          submitLabel="Salvar perfil"
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleSubmit}
        />
      </div>
    </section>
  );
}
