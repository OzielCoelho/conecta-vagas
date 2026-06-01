import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

function getDestination(role?: string, profileStatus?: string) {
  if (profileStatus === "incomplete") {
    if (role === "STUDENT") return "/completar-perfil/aluno";
    if (role === "COMPANY") return "/completar-perfil/empresa";
  }

  return "/dashboard";
}

export function GuestRoute() {
  const { isAuthenticated, isBootstrapping, user, profileStatus } = useAuth();

  if (isBootstrapping) {
    return <div className="auth-screen auth-screen--status">Carregando sessão...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to={getDestination(user?.role, profileStatus)} replace />;
  }

  return <Outlet />;
}
