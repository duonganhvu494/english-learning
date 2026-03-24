"use client";

import {
  AlertCircle,
  CheckCircle,
  Info,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/utils/cn";

type NotificationType = "success" | "error" | "warning" | "info";

type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  message?: string;
};

type NotifyOptions = {
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
};

type NotificationContextValue = {
  notify: (options: NotifyOptions) => void;
  success: (
    title: string,
    messageOrDuration?: string | number,
    duration?: number,
  ) => void;
  error: (
    title: string,
    messageOrDuration?: string | number,
    duration?: number,
  ) => void;
  warning: (
    title: string,
    messageOrDuration?: string | number,
    duration?: number,
  ) => void;
  info: (
    title: string,
    messageOrDuration?: string | number,
    duration?: number,
  ) => void;
  remove: (id: number) => void;
};

const DEFAULT_DURATION = 3500;
const EXIT_DURATION = 300;

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const NOTIFICATION_STYLES: Record<
  NotificationType,
  {
    container: string;
    icon: string;
    title: string;
    message: string;
    closeButton: string;
  }
> = {
  success: {
    container:
      "border-[color-mix(in_srgb,var(--color-success)_35%,var(--color-border)_65%)] bg-[color-mix(in_srgb,var(--color-success-soft)_82%,var(--color-surface)_18%)]",
    icon: "text-(--color-success)",
    title: "text-(--color-success)",
    message: "text-app-text",
    closeButton:
      "text-(--color-success) hover:bg-[color-mix(in_srgb,var(--color-success-soft)_68%,var(--color-surface)_32%)]",
  },
  error: {
    container:
      "border-[color-mix(in_srgb,var(--color-error)_35%,var(--color-border)_65%)] bg-[color-mix(in_srgb,var(--color-error-soft)_82%,var(--color-surface)_18%)]",
    icon: "text-(--color-error)",
    title: "text-(--color-error)",
    message: "text-app-text",
    closeButton:
      "text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_68%,var(--color-surface)_32%)]",
  },
  warning: {
    container:
      "border-[color-mix(in_srgb,var(--color-warning)_35%,var(--color-border)_65%)] bg-[color-mix(in_srgb,var(--color-warning-soft)_82%,var(--color-surface)_18%)]",
    icon: "text-(--color-warning)",
    title: "text-(--color-warning)",
    message: "text-app-text",
    closeButton:
      "text-(--color-warning) hover:bg-[color-mix(in_srgb,var(--color-warning-soft)_68%,var(--color-surface)_32%)]",
  },
  info: {
    container:
      "border-[color-mix(in_srgb,var(--color-info)_35%,var(--color-border)_65%)] bg-[color-mix(in_srgb,var(--color-info-soft)_82%,var(--color-surface)_18%)]",
    icon: "text-(--color-info)",
    title: "text-(--color-info)",
    message: "text-app-text",
    closeButton:
      "text-(--color-info) hover:bg-[color-mix(in_srgb,var(--color-info-soft)_68%,var(--color-surface)_32%)]",
  },
};

function normalizeNotificationInput(
  title: string,
  messageOrDuration?: string | number,
  duration?: number,
) {
  if (typeof messageOrDuration === "number") {
    return { title, message: undefined, duration: messageOrDuration };
  }

  return { title, message: messageOrDuration, duration };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [exiting, setExiting] = useState<Set<number>>(new Set());

  const remove = useCallback((id: number) => {
    setExiting((prev) => new Set(prev).add(id));

    window.setTimeout(() => {
      setNotifications((previous) =>
        previous.filter((notification) => notification.id !== id),
      );
      setExiting((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, EXIT_DURATION);
  }, []);

  const notify = useCallback(
    ({ type, title, message, duration = DEFAULT_DURATION }: NotifyOptions) => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setNotifications((previous) => [
        ...previous,
        { id, type, title, message },
      ]);

      window.setTimeout(() => {
        remove(id);
      }, duration);
    },
    [remove],
  );

  const value = useMemo<NotificationContextValue>(
    () => ({
      notify,
      success: (title, messageOrDuration, duration) =>
        notify({
          type: "success",
          ...normalizeNotificationInput(title, messageOrDuration, duration),
        }),
      error: (title, messageOrDuration, duration) =>
        notify({
          type: "error",
          ...normalizeNotificationInput(title, messageOrDuration, duration),
        }),
      warning: (title, messageOrDuration, duration) =>
        notify({
          type: "warning",
          ...normalizeNotificationInput(title, messageOrDuration, duration),
        }),
      info: (title, messageOrDuration, duration) =>
        notify({
          type: "info",
          ...normalizeNotificationInput(title, messageOrDuration, duration),
        }),
      remove,
    }),
    [notify, remove],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {notifications.map((notification) => {
          const isLeaving = exiting.has(notification.id);
          const Icon = NOTIFICATION_ICONS[notification.type];
          const colorScheme = NOTIFICATION_STYLES[notification.type];

          return (
            <div
              key={notification.id}
              className={cn(
                "pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 ease-out transform-gpu",
                colorScheme.container,
                isLeaving
                  ? "opacity-0 translate-x-full"
                  : "opacity-100 translate-x-0",
              )}
              style={{
                animation: isLeaving ? "none" : "slide-in-right 300ms ease-out",
              }}
              role="status"
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={cn("mt-0.5 h-5 w-5 shrink-0", colorScheme.icon)}
                />
                <div className="min-w-0 flex-1">
                  <h3
                    className={cn(
                      "mb-1 text-sm font-semibold",
                      colorScheme.title,
                    )}
                  >
                    {notification.title}
                  </h3>
                  {notification.message ? (
                    <p
                      className={cn(
                        "text-sm leading-5 opacity-90",
                        colorScheme.message,
                      )}
                    >
                      {notification.message}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => remove(notification.id)}
                  className={cn(
                    "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors",
                    colorScheme.closeButton,
                  )}
                  aria-label="Close notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
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
