"use client";

import { notificationsApi } from "@/api";
import { useAuth } from "@/providers/auth-provider";
import { useNotification } from "@/providers/notification-provider";
import type {
  NotificationCreatedPayload,
  NotificationReadPayload,
  NotificationsConnectedPayload,
  NotificationsReadAllPayload,
  NotificationsRealtimeEvent,
  NotificationsUnreadCountUpdatedPayload,
} from "@/types/notification";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { io, type Socket } from "socket.io-client";

type NotificationsRealtimeContextValue = {
  unreadCount: number;
  isConnected: boolean;
  lastEvent: NotificationsRealtimeEvent | null;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: Dispatch<SetStateAction<number>>;
};

const NotificationsRealtimeContext =
  createContext<NotificationsRealtimeContextValue | null>(null);

function nextEventId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function NotificationsRealtimeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated } = useAuth();
  const toast = useNotification();
  const socketRef = useRef<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<NotificationsRealtimeEvent | null>(
    null,
  );

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await notificationsApi.getUnreadCount();
      setUnreadCount(response.result.unreadCount);
    } catch {
      // Keep the last known unread count if this background refresh fails.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const refreshTimer = window.setTimeout(() => {
      void refreshUnreadCount();
    }, 0);

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!apiBaseUrl) {
      return;
    }

    const socket = io(`${apiBaseUrl}/notifications`, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      void refreshUnreadCount();
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on(
      "notifications.connected",
      (payload: NotificationsConnectedPayload) => {
        setLastEvent({
          id: nextEventId(),
          type: "connected",
          payload,
        });
      },
    );

    socket.on("notification.created", (payload: NotificationCreatedPayload) => {
      setUnreadCount(payload.unreadCount);
      setLastEvent({
        id: nextEventId(),
        type: "created",
        payload,
      });
      toast.info(payload.notification.title, payload.notification.body);
    });

    socket.on("notification.read", (payload: NotificationReadPayload) => {
      setUnreadCount(payload.unreadCount);
      setLastEvent({
        id: nextEventId(),
        type: "read",
        payload,
      });
    });

    socket.on(
      "notifications.read_all",
      (payload: NotificationsReadAllPayload) => {
        setUnreadCount(payload.unreadCount);
        setLastEvent({
          id: nextEventId(),
          type: "read_all",
          payload,
        });
      },
    );

    socket.on(
      "notifications.unread_count_updated",
      (payload: NotificationsUnreadCountUpdatedPayload) => {
        setUnreadCount(payload.unreadCount);
        setLastEvent({
          id: nextEventId(),
          type: "unread_count_updated",
          payload,
        });
      },
    );

    return () => {
      window.clearTimeout(refreshTimer);
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, refreshUnreadCount, toast]);

  const value = useMemo<NotificationsRealtimeContextValue>(
    () => ({
      unreadCount: isAuthenticated ? unreadCount : 0,
      isConnected: isAuthenticated ? isConnected : false,
      lastEvent: isAuthenticated ? lastEvent : null,
      refreshUnreadCount,
      setUnreadCount,
    }),
    [
      isAuthenticated,
      isConnected,
      lastEvent,
      refreshUnreadCount,
      unreadCount,
    ],
  );

  return (
    <NotificationsRealtimeContext.Provider value={value}>
      {children}
    </NotificationsRealtimeContext.Provider>
  );
}

export function useNotificationsRealtime() {
  const context = useContext(NotificationsRealtimeContext);
  if (!context) {
    throw new Error(
      "useNotificationsRealtime must be used within NotificationsRealtimeProvider",
    );
  }

  return context;
}
