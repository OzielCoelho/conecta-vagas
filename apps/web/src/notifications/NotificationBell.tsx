import { useNotifications } from "./NotificationsProvider";

export function NotificationBell() {
  const { unreadCount, isOpen, openNotifications, closeNotifications, notificationsEnabled } = useNotifications();

  if (!notificationsEnabled) {
    return null;
  }

  const label = unreadCount > 0 ? `${unreadCount} notificações não lidas` : "Abrir notificações";

  return (
    <button
      className={isOpen ? "notification-bell notification-bell--active" : "notification-bell"}
      type="button"
      aria-label={label}
      aria-expanded={isOpen}
      onClick={() => {
        if (isOpen) {
          closeNotifications();
          return;
        }

        void openNotifications();
      }}
    >
      <span className="notification-bell__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M12 3a4 4 0 0 0-4 4v1.13c0 .82-.31 1.61-.87 2.21L5.4 12.2A2 2 0 0 0 6.82 15h10.36a2 2 0 0 0 1.42-2.8l-1.73-3.86A3.24 3.24 0 0 1 16 8.13V7a4 4 0 0 0-4-4Zm0 18a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21Z"
            fill="currentColor"
          />
        </svg>
      </span>
      {unreadCount > 0 ? <span className="notification-bell__badge">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
    </button>
  );
}
