"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type NotificationType = "success" | "error";

type NotificationItem = {
  id: number;
  type: NotificationType;
  message: string;
};

type NotifyOptions = {
  type: NotificationType;
  message: string;
  duration?: number;
};

type NotificationContextValue = {
  notify: (options: NotifyOptions) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  remove: (id: number) => void;
};

const DEFAULT_DURATION = 3500;

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

function getToastClass(type: NotificationType) {
  if (type === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const remove = useCallback((id: number) => {
    setNotifications((previous) =>
      previous.filter((notification) => notification.id !== id),
    );
  }, []);

  const notify = useCallback(
    ({ type, message, duration = DEFAULT_DURATION }: NotifyOptions) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setNotifications((previous) => [...previous, { id, type, message }]);

      window.setTimeout(() => {
        remove(id);
      }, duration);
    },
    [remove],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      success: (message, duration) =>
        notify({ type: "success", message, duration }),
      error: (message, duration) =>
        notify({ type: "error", message, duration }),
      remove,
    }),
    [notify, remove],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed top-4 right-4 z-100 flex w-[min(92vw,360px)] flex-col gap-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`pointer-events-auto rounded-sm border px-4 py-3 text-sm font-medium shadow-md ${getToastClass(
              notification.type,
            )}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p>{notification.message}</p>
              <button
                type="button"
                onClick={() => remove(notification.id)}
                className="cursor-pointer text-inherit/80 transition-colors hover:text-inherit"
                aria-label="Close notification"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotification must be used inside NotificationProvider.",
    );
  }

  return context;
}
