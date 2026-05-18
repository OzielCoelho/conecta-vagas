import { useNavigate } from "react-router-dom";
import { AuthModal } from "../components/auth/AuthModal";
import { RegisterForm } from "../components/auth/RegisterForm";

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <section className="auth-screen">
      <AuthModal
        title="Crie sua conta."
        subtitle="Escolha se você é aluno ou empresa e continue para completar seu perfil logo depois."
        onClose={() => navigate("/", { replace: true })}
      >
        <RegisterForm onSwitchToLogin={() => navigate("/login", { replace: true })} />
      </AuthModal>
    </section>
  );
}
