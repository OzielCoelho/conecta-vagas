import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "../auth/AuthProvider";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "../services/notifications";

type NotificationPreferences = {
  notificationsEnabled: boolean;
  notificationToastsEnabled: boolean;
  notificationAutoRefreshEnabled: boolean;
};

type ToastItem = NotificationItem & {
  visibleAt: number;
};

type NotificationsContextValue = {
  items: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isOpen: boolean;
  toasts: ToastItem[];
  notificationsEnabled: boolean;
  notificationToastsEnabled: boolean;
  notificationAutoRefreshEnabled: boolean;
  refreshNotifications: (options?: { silent?: boolean }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  openNotifications: () => Promise<void>;
  closeNotifications: () => void;
  dismissToast: (id: string) => void;
};

const SETTINGS_KEY = "conecta_vagas_settings";
const POLLING_INTERVAL_MS = 30000;
const TOAST_TTL_MS = 4500;

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function loadPreferences(): NotificationPreferences {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return {
        notificationsEnabled: true,
        notificationToastsEnabled: true,
        notificationAutoRefreshEnabled: true,
      };
    }

    const parsed = JSON.parse(raw) as Partial<NotificationPreferences>;
    return {
      notificationsEnabled: parsed.notificationsEnabled ?? true,
      notificationToastsEnabled: parsed.notificationToastsEnabled ?? true,
      notificationAutoRefreshEnabled: parsed.notificationAutoRefreshEnabled ?? true,
    };
  } catch {
    return {
      notificationsEnabled: true,
      notificationToastsEnabled: true,
      notificationAutoRefreshEnabled: true,
    };
  }
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated, isDemo } = useAuth();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(() =>
    typeof window === "undefined"
      ? {
          notificationsEnabled: true,
          notificationToastsEnabled: true,
          notificationAutoRefreshEnabled: true,
        }
      : loadPreferences()
  );
  const hasBootstrappedRef = useRef(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const timeoutIdsRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const timeoutId = timeoutIdsRef.current.get(id);
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const scheduleToastRemoval = useCallback(
    (notificationId: string) => {
      const existing = timeoutIdsRef.current.get(notificationId);
      if (existing) {
        window.clearTimeout(existing);
      }

      const timeoutId = window.setTimeout(() => {
        dismissToast(notificationId);
      }, TOAST_TTL_MS);

      timeoutIdsRef.current.set(notificationId, timeoutId);
    },
    [dismissToast]
  );

  const refreshNotifications = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!token || !isAuthenticated || isDemo || !preferences.notificationsEnabled) {
        setItems([]);
        setUnreadCount(0);
        hasBootstrappedRef.current = false;
        seenIdsRef.current = new Set();
        return;
      }

      if (!options?.silent) {
        setIsLoading(true);
      }

      try {
        const response = await getNotifications(token);
        setItems(response.items);
        setUnreadCount(response.unreadCount);

        const incomingIds = new Set(response.items.map((item) => item.id));
        const isFirstLoad = !hasBootstrappedRef.current;

        if (!isFirstLoad && preferences.notificationToastsEnabled) {
          const freshItems = response.items.filter((item) => !seenIdsRef.current.has(item.id));
          if (freshItems.length) {
            setToasts((current) => {
              const next = [...current];
              freshItems
                .slice()
                .reverse()
                .forEach((item) => {
                  if (!next.some((toast) => toast.id === item.id)) {
                    next.unshift({ ...item, visibleAt: Date.now() });
                    scheduleToastRemoval(item.id);
                  }
                });
              return next.slice(0, 4);
            });
          }
        }

        seenIdsRef.current = incomingIds;
        hasBootstrappedRef.current = true;
      } catch {
        setItems([]);
        setUnreadCount(0);
      } finally {
        if (!options?.silent) {
          setIsLoading(false);
        }
      }
    },
    [isAuthenticated, isDemo, preferences.notificationToastsEnabled, preferences.notificationsEnabled, scheduleToastRemoval, token]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      if (!token || isDemo) {
        return;
      }

      const updated = await markNotificationAsRead(id, token);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
      setUnreadCount((current) => Math.max(0, current - 1));
    },
    [isDemo, token]
  );

  const markAllAsRead = useCallback(async () => {
    if (!token || isDemo) {
      return;
    }

    await markAllNotificationsAsRead(token);
    setItems((current) => current.map((item) => ({ ...item, isRead: true, readAt: new Date().toISOString() })));
    setUnreadCount(0);
  }, [isDemo, token]);

  const openNotifications = useCallback(async () => {
    setIsOpen(true);
    await refreshNotifications({ silent: true });
  }, [refreshNotifications]);

  const closeNotifications = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncPreferences = () => {
      setPreferences(loadPreferences());
    };

    syncPreferences();
    window.addEventListener("storage", syncPreferences);
    window.addEventListener("focus", syncPreferences);

    return () => {
      window.removeEventListener("storage", syncPreferences);
      window.removeEventListener("focus", syncPreferences);
    };
  }, []);

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!token || !isAuthenticated || isDemo || !preferences.notificationsEnabled || !preferences.notificationAutoRefreshEnabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshNotifications({ silent: true });
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, isDemo, preferences.notificationAutoRefreshEnabled, preferences.notificationsEnabled, refreshNotifications, token]);

  useEffect(() => {
    if (!token || !isAuthenticated || isDemo || !preferences.notificationsEnabled) {
      return;
    }

    const handleFocus = () => {
      void refreshNotifications({ silent: true });
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, isDemo, preferences.notificationsEnabled, refreshNotifications, token]);

  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIdsRef.current.clear();
    };
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      unreadCount,
      isLoading,
      isOpen,
      toasts,
      notificationsEnabled: preferences.notificationsEnabled,
      notificationToastsEnabled: preferences.notificationToastsEnabled,
      notificationAutoRefreshEnabled: preferences.notificationAutoRefreshEnabled,
      refreshNotifications,
      markAsRead,
      markAllAsRead,
      openNotifications,
      closeNotifications,
      dismissToast,
    }),
    [
      closeNotifications,
      dismissToast,
      isLoading,
      isOpen,
      items,
      markAllAsRead,
      markAsRead,
      openNotifications,
      preferences.notificationAutoRefreshEnabled,
      preferences.notificationToastsEnabled,
      preferences.notificationsEnabled,
      refreshNotifications,
      toasts,
      unreadCount,
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationsProvider");
  }

  return context;
}
