import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

const menuItems = [
  {
    to: "/",
    label: "Home",
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 4.5 4 11v8.5h5.5v-5.5h5V19.5H20V11Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: "/vagas",
    label: "Vagas",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M9 6V4.5h6V6h4A1.5 1.5 0 0 1 20.5 7.5v10A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 5 6Zm1.5 0h3V6h-3Zm-5 4v7.5H19V10Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: "/alunos",
    label: "Alunos",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 5a3.5 3.5 0 1 1-3.5 3.5A3.5 3.5 0 0 1 12 5Zm0 9c4 0 7 2.1 7 4.5V20H5v-1.5C5 16.1 8 14 12 14Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: "/configuracoes",
    label: "Configurações",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="m19.4 13-.1.3 1.4 1.6-1.5 2.6-2-.4-.2.2-.4 2h-3l-.4-2-.3-.1-1.7 1-2.6-1.5.4-2-.2-.2-2-.4v-3l2-.4.1-.3-1-1.7L9.9 5l2 .4.2-.2.4-2h3l.4 2 .3.1 1.7-1L20.5 6l-.4 2 .2.2 2 .4V13ZM12 9a3 3 0 1 0 3 3 3 3 0 0 0-3-3Z" fill="currentColor" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const { logout, user, isDemo } = useAuth();
  const navigate = useNavigate();

  const profileItem =
    user?.role === "STUDENT"
      ? { to: "/perfil/aluno", label: "Meu perfil" }
      : user?.role === "COMPANY"
        ? { to: "/perfil/empresa", label: "Meu perfil" }
        : null;

  function handleLogout() {
    logout();
    navigate(isDemo ? "/" : "/?auth=login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__main">
        <div className="sidebar__brand">
          <span className="sidebar__brand-badge" aria-hidden="true">
            <span className="sidebar__brand-orbit sidebar__brand-orbit--one" />
            <span className="sidebar__brand-orbit sidebar__brand-orbit--two" />
            <span className="sidebar__brand-core" />
          </span>
          <div>
            <strong>Conecta Vagas</strong>
            <p>Estudantes e empresas</p>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Menu principal">
          {profileItem ? (
            <NavLink
              key={profileItem.to}
              to={profileItem.to}
              className={({ isActive }) =>
                isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
              }
            >
              <span className="sidebar__link-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.79-6 4v1h12v-1c0-2.21-2.67-4-6-4Z" fill="currentColor" />
                </svg>
              </span>
              <span>{profileItem.label}</span>
            </NavLink>
          ) : null}

          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                isActive ? "sidebar__link sidebar__link--active" : "sidebar__link"
              }
            >
              <span className="sidebar__link-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar__footer sidebar__footer--stacked">
        <p>{isDemo ? "Você está navegando com um perfil fictício editável." : "Conectando talentos a estágios com mais clareza."}</p>
        {user ? (
          <button className="secondary-button" type="button" onClick={handleLogout}>
            {isDemo ? "Sair da demonstração" : "Sair"}
          </button>
        ) : null}
      </div>
    </aside>
  );
}
