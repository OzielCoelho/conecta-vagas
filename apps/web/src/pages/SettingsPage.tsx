import { useEffect, useState } from "react";

const settingsChecklist = [
  "Preferências de conta e perfil",
  "Permissões por tipo de usuário",
  "Notificações e comunicação com candidatos",
];

type StoredSettings = {
  darkCards?: boolean;
  compactMode?: boolean;
  notificationsEnabled?: boolean;
  notificationToastsEnabled?: boolean;
  notificationAutoRefreshEnabled?: boolean;
};

const SETTINGS_KEY = "conecta_vagas_settings";

export function SettingsPage() {
  const [darkCards, setDarkCards] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationToastsEnabled, setNotificationToastsEnabled] = useState(true);
  const [notificationAutoRefreshEnabled, setNotificationAutoRefreshEnabled] = useState(true);
  const [statusMessage, setStatusMessage] = useState("Preferências prontas para personalização.");

  useEffect(() => {
    const stored = window.localStorage.getItem(SETTINGS_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as StoredSettings;
      setDarkCards(Boolean(parsed.darkCards));
      setCompactMode(Boolean(parsed.compactMode));
      setNotificationsEnabled(parsed.notificationsEnabled ?? true);
      setNotificationToastsEnabled(parsed.notificationToastsEnabled ?? true);
      setNotificationAutoRefreshEnabled(parsed.notificationAutoRefreshEnabled ?? true);
    } catch {
      window.localStorage.removeItem(SETTINGS_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        darkCards,
        compactMode,
        notificationsEnabled,
        notificationToastsEnabled,
        notificationAutoRefreshEnabled,
      })
    );
  }, [compactMode, darkCards, notificationAutoRefreshEnabled, notificationToastsEnabled, notificationsEnabled]);

  const settingsItems = [
    {
      label: "Tema visual",
      value: darkCards ? "Cards destacados" : "Claro por enquanto",
      helper: "Preferência aplicada imediatamente nos cards desta tela",
    },
    {
      label: "Atualização automática",
      value: notificationAutoRefreshEnabled ? "Polling ativo" : "Atualização manual",
      helper: "Controla a recarga automática das notificações no topo",
    },
    {
      label: "Notificações",
      value: notificationsEnabled ? "Feed ativo" : "Feed pausado",
      helper: notificationToastsEnabled ? "Toasts e lista habilitados" : "Somente lista no sino",
    },
  ];

  return (
    <section className={compactMode ? "page-section settings-page settings-page--refined settings-page--compact" : "page-section settings-page settings-page--refined"}>
      <header className="page-header settings-page__header">
        <div>
          <span className="page-eyebrow">Configurações</span>
          <h1>Uma base pronta para evoluir o aplicativo.</h1>
          <p>
            Aqui podemos depois adicionar preferências, conta do usuário, permissões e ajustes de integração.
          </p>
        </div>
      </header>

      <section className="panel settings-control-panel">
        <div>
          <span className="panel__label">Controles interativos</span>
          <h2>Ative preferências visuais e comportamentais</h2>
          <p>{statusMessage}</p>
        </div>

        <div className="settings-toggle-list">
          <button className={darkCards ? "settings-toggle settings-toggle--active" : "settings-toggle"} type="button" onClick={() => {
            setDarkCards((current) => !current);
            setStatusMessage("Preferência visual atualizada.");
          }}>
            <span>Cards com mais destaque</span>
            <span className="settings-toggle__switch" aria-hidden="true" />
          </button>

          <button className={compactMode ? "settings-toggle settings-toggle--active" : "settings-toggle"} type="button" onClick={() => {
            setCompactMode((current) => !current);
            setStatusMessage("Modo de densidade ajustado.");
          }}>
            <span>Modo compacto</span>
            <span className="settings-toggle__switch" aria-hidden="true" />
          </button>

          <button className={notificationsEnabled ? "settings-toggle settings-toggle--active" : "settings-toggle"} type="button" onClick={() => {
            setNotificationsEnabled((current) => !current);
            setStatusMessage("Visibilidade geral das notificações atualizada.");
          }}>
            <span>Feed de notificações</span>
            <span className="settings-toggle__switch" aria-hidden="true" />
          </button>

          <button className={notificationToastsEnabled ? "settings-toggle settings-toggle--active" : "settings-toggle"} type="button" onClick={() => {
            setNotificationToastsEnabled((current) => !current);
            setStatusMessage("Exibição dos toasts ajustada.");
          }}>
            <span>Toasts no topo</span>
            <span className="settings-toggle__switch" aria-hidden="true" />
          </button>

          <button className={notificationAutoRefreshEnabled ? "settings-toggle settings-toggle--active" : "settings-toggle"} type="button" onClick={() => {
            setNotificationAutoRefreshEnabled((current) => !current);
            setStatusMessage("Atualização automática das notificações ajustada.");
          }}>
            <span>Atualização automática</span>
            <span className="settings-toggle__switch" aria-hidden="true" />
          </button>
        </div>
      </section>

      <section className="content-grid content-grid--three settings-page__grid">
        {settingsItems.map((item) => (
          <article key={item.label} className={darkCards ? "panel settings-card settings-card--interactive settings-card--interactive-active" : "panel settings-card settings-card--interactive"}>
            <span className="panel__label">{item.label}</span>
            <strong>{item.value}</strong>
            <p>{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="settings-page__content">
        <article className="panel settings-card settings-card--wide">
          <span className="panel__label">Próximas evoluções</span>
          <h2>Esta tela já segue o sistema visual e pode crescer sem mudar de linguagem.</h2>
          <ul className="feature-list">
            {settingsChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="content-grid content-grid--three settings-page__extras">
        <article className="panel settings-card settings-card--compact">
          <span className="panel__label">Conta</span>
          <strong>Preferências prontas</strong>
          <p>Espaço reservado para dados do usuário e personalização.</p>
        </article>
        <article className="panel settings-card settings-card--compact">
          <span className="panel__label">Permissões</span>
          <strong>Fluxo por papel</strong>
          <p>Base para diferenciar candidato, empresa e coordenação.</p>
        </article>
        <article className="panel settings-card settings-card--compact">
          <span className="panel__label">Notificações</span>
          <strong>Comunicação central</strong>
          <p>Área preparada para alertas, toasts e atualização automática.</p>
        </article>
      </section>
    </section>
  );
}
