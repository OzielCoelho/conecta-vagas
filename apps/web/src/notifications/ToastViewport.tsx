import { useNavigate } from "react-router-dom";
import { useNotifications } from "./NotificationsProvider";

export function ToastViewport() {
  const navigate = useNavigate();
  const { toasts, dismissToast, markAsRead, notificationToastsEnabled, notificationsEnabled } = useNotifications();

  if (!notificationsEnabled || !notificationToastsEnabled || !toasts.length) {
    return null;
  }

  async function handleToastClick(id: string, linkUrl?: string | null, isRead?: boolean) {
    try {
      if (!isRead) {
        await markAsRead(id);
      }
    } catch {
      dismissToast(id);
      return;
    }

    dismissToast(id);

    if (linkUrl) {
      navigate(linkUrl);
    }
  }

  return (
    <div className="toast-viewport" aria-live="polite" aria-label="Notificações recentes">
      {toasts.map((toast) => (
        <article key={toast.id} className="toast-card">
          <button className="toast-card__content" type="button" onClick={() => void handleToastClick(toast.id, toast.linkUrl, toast.isRead)}>
            <span className="panel__label">{toast.category}</span>
            <strong>{toast.title}</strong>
            <p>{toast.message}</p>
          </button>
          <button className="toast-card__close" type="button" aria-label="Fechar notificação" onClick={() => dismissToast(toast.id)}>
            ×
          </button>
        </article>
      ))}
    </div>
  );
}
