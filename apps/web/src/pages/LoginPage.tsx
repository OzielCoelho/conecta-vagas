import { useNavigate } from "react-router-dom";
import { AuthModal } from "../components/auth/AuthModal";
import { LoginForm } from "../components/auth/LoginForm";

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <section className="auth-screen">
      <AuthModal
        title="Acesse sua conta."
        subtitle="Entre para acompanhar oportunidades, perfis e conexões dentro da plataforma."
        onClose={() => navigate("/", { replace: true })}
      >
        <LoginForm onSwitchToRegister={() => navigate("/cadastro", { replace: true })} />
      </AuthModal>
    </section>
  );
}
