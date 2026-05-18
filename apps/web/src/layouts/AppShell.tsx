import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Sidebar } from "../components/Sidebar";

const pageTitles: Record<string, string> = {
  "/": "Home",
  "/vagas": "Vagas",
  "/alunos": "Alunos",
  "/perfil/aluno": "Meu perfil",
  "/perfil/empresa": "Meu perfil",
  "/configuracoes": "Configurações",
};

const roleLabels: Record<string, string> = {
  STUDENT: "Aluno",
  COMPANY: "Empresa",
  COORDINATOR: "Coordenação",
};

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isDemo, startDemo } = useAuth();
  const currentPage = pageTitles[location.pathname] ?? "Home";
  const userLabel = user ? roleLabels[user.role] ?? user.role : "Visitante";

  function openAuthModal(type: "login" | "register") {
    navigate(`/?auth=${type}`, { replace: location.pathname === "/" });
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <header className="topbar">
          <div className="topbar__bar" aria-label="Navegação superior">
            <div className="topbar__bar-left">
              <span className="topbar__current-page">{currentPage}</span>
            </div>

            <div className="topbar__bar-right">
              {user ? (
                <div className="topbar__user-summary" aria-label="Usuário logado">
                  <div className="topbar__user-text">
                    <span className="topbar__user-greeting">{isDemo ? "Modo demonstração" : "Bem-vindo"}</span>
                    <strong>{userLabel}</strong>
                    <span className="topbar__user-email">{user.email}</span>
                  </div>

                  <span className="topbar__user-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" fill="currentColor" />
                    </svg>
                  </span>
                </div>
              ) : (
                <div className="topbar__visitor-actions">
                  <button className="secondary-button" type="button" onClick={() => openAuthModal("login")}>
                    Entrar
                  </button>
                  <button className="secondary-button" type="button" onClick={() => {
                    startDemo("student");
                    navigate("/perfil/aluno");
                  }}>
                    Testar demo
                  </button>
                  <button className="primary-button" type="button" onClick={() => openAuthModal("register")}>
                    Criar conta
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
