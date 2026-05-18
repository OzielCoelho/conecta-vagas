import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

function getProfileRoute(role: string) {
  if (role === "STUDENT") return "/completar-perfil/aluno";
  if (role === "COMPANY") return "/completar-perfil/empresa";
  return "/";
}

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping, profileStatus, user } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return <div className="auth-screen auth-screen--status">Carregando sessão...</div>;
  }

  if (!isAuthenticated) {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/?auth=login&redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  if (user && profileStatus === "incomplete") {
    const profileRoute = getProfileRoute(user.role);

    if (location.pathname !== profileRoute) {
      return <Navigate to={profileRoute} replace />;
    }
  }

  return <Outlet />;
}
