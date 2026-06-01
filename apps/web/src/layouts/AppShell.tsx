import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { Sidebar } from "../components/Sidebar";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/feed": "Feed",
  "/vagas": "Vagas",
  "/alunos": "Candidatos",
  "/perfil/aluno": "Meu perfil",
  "/perfil/aluno/candidaturas": "Candidaturas",
  "/perfil/empresa": "Meu perfil",
  "/empresa/candidatos": "Candidatos",
  "/empresa/vagas": "Minhas vagas",
  "/configuracoes": "Conta e segurança",
};

const roleLabels: Record<string, string> = {
  STUDENT: "Candidato",
  COMPANY: "Empresa",
  COORDINATOR: "Coordenação",
};

function getUserInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.trim() || "Usuário";
  const parts = source.split(" ").filter(Boolean);

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isDemo, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const currentPage = pageTitles[location.pathname] ?? "Dashboard";
  const userLabel = user ? roleLabels[user.role] ?? user.role : "Visitante";
  const userName = useMemo(() => user?.displayName?.trim() || user?.name?.trim() || user?.email || "Usuário", [user]);
  const initials = useMemo(() => getUserInitials(user?.displayName || user?.name, user?.email), [user]);

  function openAuthModal(type: "login" | "register") {
    navigate(`/?auth=${type}`, { replace: location.pathname === "/" });
  }

  function handleOpenSettings() {
    setIsUserMenuOpen(false);
    navigate("/configuracoes");
  }

  function handleLogout() {
    setIsUserMenuOpen(false);
    logout();
    navigate("/?auth=login", { replace: true });
  }

  return (
    <div className={user ? "app-shell" : "app-shell app-shell--public"}>
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
                    <span className="topbar__user-greeting">{isDemo ? "Modo demonstração" : `Bem-vindo(a), ${userLabel}`}</span>
                    <strong>{userName}</strong>
                  </div>

                  <div className="topbar__user-menu-wrap">
                    <button
                      className="topbar__user-icon topbar__user-icon--button"
                      type="button"
                      aria-label="Abrir menu da conta"
                      aria-expanded={isUserMenuOpen}
                      onClick={() => setIsUserMenuOpen((current) => !current)}
                    >
                      {user?.avatarUrl ? (
                        <img className="topbar__user-avatar-image" src={user.avatarUrl} alt={userName} />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </button>

                    {isUserMenuOpen ? (
                      <div className="topbar__user-menu" role="menu">
                        <button className="topbar__user-menu-item" type="button" onClick={handleOpenSettings}>
                          Conta e segurança
                        </button>
                        <button className="topbar__user-menu-item" type="button" onClick={handleLogout}>
                          Sair
                        </button>
                      </div>
                    ) : null}
                  </div>
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
