import { useNavigate } from "react-router-dom";
import { useNotifications } from "./NotificationsProvider";

function formatRelativeDate(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `há ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `há ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `há ${diffDays} d`;
}

export function NotificationPanel() {
  const navigate = useNavigate();
  const {
    items,
    unreadCount,
    isOpen,
    isLoading,
    closeNotifications,
    markAsRead,
    markAllAsRead,
    notificationsEnabled,
  } = useNotifications();

  if (!notificationsEnabled || !isOpen) {
    return null;
  }

  async function handleOpen(notificationId: string, linkUrl?: string | null, isRead?: boolean) {
    try {
      if (!isRead) {
        await markAsRead(notificationId);
      }
    } catch {
      return;
    }

    closeNotifications();

    if (linkUrl) {
      navigate(linkUrl);
    }
  }

  return (
    <div className="notification-panel" role="dialog" aria-label="Notificações">
      <div className="notification-panel__header">
        <div>
          <span className="panel__label">Notificações</span>
          <h2>Atualizações da plataforma</h2>
        </div>
        <div className="notification-panel__actions">
          <span className="status-pill status-pill--highlight">{unreadCount} não lidas</span>
          <button className="secondary-button" type="button" onClick={() => void markAllAsRead()} disabled={!unreadCount}>
            Marcar todas
          </button>
        </div>
      </div>

      {isLoading ? <p className="notification-panel__state">Carregando notificações...</p> : null}

      {!isLoading && !items.length ? (
        <p className="notification-panel__state">Nenhuma notificação por enquanto.</p>
      ) : null}

      <div className="notification-panel__list">
        {items.map((item) => (
          <button
            key={item.id}
            className={item.isRead ? "notification-panel__item" : "notification-panel__item notification-panel__item--unread"}
            type="button"
            onClick={() => void handleOpen(item.id, item.linkUrl, item.isRead)}
          >
            <div className="notification-panel__item-top">
              <strong>{item.title}</strong>
              <span>{formatRelativeDate(item.createdAt)}</span>
            </div>
            <p>{item.message}</p>
            <div className="notification-panel__item-bottom">
              <span className="status-pill">{item.category}</span>
              {!item.isRead ? <span className="notification-panel__dot" aria-hidden="true" /> : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
