import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Sidebar } from "../components/Sidebar";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/vagas": "Vagas",
  "/alunos": "Alunos",
  "/perfil/aluno": "Meu perfil",
  "/perfil/empresa": "Meu perfil",
  "/empresa/candidatos": "Candidatos",
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
  const { user, isDemo } = useAuth();
  const currentPage = pageTitles[location.pathname] ?? "Dashboard";
  const userLabel = user ? roleLabels[user.role] ?? user.role : "Visitante";

  function openAuthModal(type: "login" | "register") {
    navigate(`/?auth=${type}`, { replace: location.pathname === "/" });
  }

  return (
    <div className={user ? "app-shell" : "app-shell app-shell--public"}>
      {user ? <Sidebar /> : null}
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
                    <span className="topbar__user-greeting">{isDemo ? "Modo demonstração" : `Bem-vindo(a), ${userLabel}`}</span>
                    <strong>{user.email}</strong>
                    <span className="topbar__user-email">Painel Conecta Jovem</span>
                  </div>

                  <span className="topbar__user-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" fill="currentColor" />
                    </svg>
                  </span>
                </div>
              ) : (
                <div className="topbar__visitor-actions">
                  <span className="topbar__visitor-welcome">Bem-vindo(a), Coordenação Conecta Jovem!</span>
                  <div className="topbar__visitor-buttons">
                    <button className="secondary-button" type="button" onClick={() => openAuthModal("login")}>
                      Entrar
                    </button>
                    <button className="primary-button" type="button" onClick={() => openAuthModal("register")}>
                      Criar conta
                    </button>
                  </div>
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
