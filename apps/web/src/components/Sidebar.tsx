import { type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

type SidebarMenuItem = {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
};

const dashboardItem: SidebarMenuItem = {
  to: "/dashboard",
  label: "Dashboard",
  end: true,
  icon: (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M12 4.5 4 11v8.5h5.5v-5.5h5V19.5H20V11Z" fill="currentColor" />
    </svg>
  ),
};

const studentMenuItems: SidebarMenuItem[] = [
  dashboardItem,
  {
    to: "/feed",
    label: "Feed",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v10A1.5 1.5 0 0 1 19 18.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5Zm2 2v2h10v-2Zm0 4v5h6v-5Z" fill="currentColor" />
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
    to: "/perfil/aluno/candidaturas",
    label: "Candidaturas",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v12A1.5 1.5 0 0 1 17 19.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Zm1 3v1.5h8V7.5Zm0 4v1.5h8V11.5Zm0 4V17h5v-1.5Z" fill="currentColor" />
      </svg>
    ),
  },
];

const companyMenuItems: SidebarMenuItem[] = [
  dashboardItem,
  {
    to: "/feed",
    label: "Feed",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v10A1.5 1.5 0 0 1 19 18.5H5A1.5 1.5 0 0 1 3.5 17V7A1.5 1.5 0 0 1 5 5.5Zm2 2v2h10v-2Zm0 4v5h6v-5Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: "/empresa/vagas",
    label: "Minhas vagas",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M9 6V4.5h6V6h4A1.5 1.5 0 0 1 20.5 7.5v10A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-10A1.5 1.5 0 0 1 5 6Zm1.5 0h3V6h-3Zm-5 4v7.5H19V10Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: "/empresa/candidatos",
    label: "Candidatos",
    icon: (
      <svg viewBox="0 0 24 24" focusable="false">
        <path d="M12 5a3.5 3.5 0 1 1-3.5 3.5A3.5 3.5 0 0 1 12 5Zm0 9c4 0 7 2.1 7 4.5V20H5v-1.5C5 16.1 8 14 12 14Z" fill="currentColor" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const profileItem =
    user?.role === "STUDENT"
      ? { to: "/perfil/aluno", label: "Meu perfil" }
      : user?.role === "COMPANY"
        ? { to: "/perfil/empresa", label: "Meu perfil" }
        : null;

  const menuItems = user?.role === "COMPANY" ? companyMenuItems : studentMenuItems;

  function handleLogout() {
    logout();
    navigate("/?auth=login", { replace: true });
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
            <strong>ConectaVagas</strong>
            <p>Painel administrativo</p>
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
              end={item.end ?? false}
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
        <p>{user?.role === "COMPANY" ? "Centralize vagas, candidatos e candidaturas em um único painel." : "Acompanhe sua empregabilidade com vagas, perfil e candidaturas em um só lugar."}</p>
        {user ? (
          <button className="secondary-button" type="button" onClick={handleLogout}>
            Sair
          </button>
        ) : null}
      </div>
    </aside>
  );
}
