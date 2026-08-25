import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { io, type Socket } from "socket.io-client";

import { API_BASE_URL, notificationsApi } from "@/api";
import type { NotificationItem } from "@/types";

interface NotificationCreatedPayload {
  notification: NotificationItem;
  unreadCount: number;
}

interface NotificationReadPayload {
  notificationId: string;
  readAt: string | null;
  unreadCount: number;
}

interface NotificationsReadAllPayload {
  updatedCount: number;
  unreadCount: number;
}

interface UnreadCountUpdatedPayload {
  unreadCount: number;
}

interface NotificationContextValue {
  latestNotifications: NotificationItem[];
  unreadCount: number;

  refreshLatestNotifications: () => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

const HEADER_NOTIFICATION_LIMIT = 5;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [latestNotifications, setLatestNotifications] = useState<
    NotificationItem[]
  >([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const refreshLatestNotifications = async () => {
    const [countResult, notificationResult] = await Promise.all([
      notificationsApi.getUnreadCount(),

      notificationsApi.listMyNotifications({
        limit: HEADER_NOTIFICATION_LIMIT,
      }),
    ]);

    setUnreadCount(countResult.unreadCount);

    setLatestNotifications(notificationResult.items);
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead();

    const readAt = new Date().toISOString();

    setLatestNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt ?? readAt,
      })),
    );

    setUnreadCount(0);
  };

  useEffect(() => {
    void refreshLatestNotifications();

    const socket: Socket = io(`${API_BASE_URL}/notifications`, {
      withCredentials: true,
    });

    socket.on("notification.created", (payload: NotificationCreatedPayload) => {
      setLatestNotifications((prev) => {
        const exists = prev.some((item) => item.id === payload.notification.id);

        if (exists) {
          return prev;
        }

        return [payload.notification, ...prev].slice(
          0,
          HEADER_NOTIFICATION_LIMIT,
        );
      });

      setUnreadCount(payload.unreadCount);
    });

    socket.on("notification.read", (payload: NotificationReadPayload) => {
      setLatestNotifications((prev) =>
        prev.map((item) =>
          item.id === payload.notificationId
            ? {
                ...item,
                isRead: true,
                readAt: payload.readAt,
              }
            : item,
        ),
      );

      setUnreadCount(payload.unreadCount);
    });

    socket.on(
      "notifications.read_all",
      (payload: NotificationsReadAllPayload) => {
        const readAt = new Date().toISOString();

        setLatestNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            isRead: true,
            readAt: item.readAt ?? readAt,
          })),
        );

        setUnreadCount(payload.unreadCount);
      },
    );

    socket.on(
      "notifications.unread_count_updated",
      (payload: UnreadCountUpdatedPayload) => {
        setUnreadCount(payload.unreadCount);
      },
    );

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        latestNotifications,
        unreadCount,

        refreshLatestNotifications,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider",
    );
  }

  return context;
}
