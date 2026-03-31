"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, notificationsApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import { useNotificationsRealtime } from "@/providers/notifications-realtime-provider";
import type { NotificationItem } from "@/types/notification";

function formatNotificationDate(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNotificationType(type: string) {
  return type.replaceAll("_", " ");
}

export default function TeacherNotificationsPage() {
  const { dictionary, locale } = useAppSettings();
  const toast = useNotification();
  const { unreadCount, isConnected, lastEvent, setUnreadCount } =
    useNotificationsRealtime();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const [notificationsResponse, unreadCountResponse] = await Promise.all([
        notificationsApi.listMine({
          unreadOnly,
          limit: 50,
        }),
        notificationsApi.getUnreadCount(),
      ]);

      setNotifications(notificationsResponse.result);
      setUnreadCount(unreadCountResponse.result.unreadCount);
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
      setErrorMessage(
        error instanceof ApiError
          ? translateApiMessage(
              error.details,
              error.code,
              dictionary,
              dictionary.notificationsPage.loadError,
            )
          : dictionary.notificationsPage.loadError,
      );
    } finally {
      setIsLoading(false);
    }
  }, [dictionary, setUnreadCount, unreadOnly]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!lastEvent) {
      return;
    }

    switch (lastEvent.type) {
      case "created": {
        setNotifications((current) => {
          const exists = current.some(
            (item) => item.id === lastEvent.payload.notification.id,
          );
          if (exists) {
            return current;
          }
          return [lastEvent.payload.notification, ...current].slice(0, 50);
        });
        break;
      }
      case "read": {
        setNotifications((current) => {
          if (unreadOnly) {
            return current.filter(
              (item) => item.id !== lastEvent.payload.notificationId,
            );
          }

          return current.map((item) =>
            item.id === lastEvent.payload.notificationId
              ? {
                  ...item,
                  isRead: true,
                  readAt: lastEvent.payload.readAt,
                }
              : item,
          );
        });
        break;
      }
      case "read_all": {
        setNotifications((current) => {
          if (unreadOnly) {
            return [];
          }

          return current.map((item) => ({
            ...item,
            isRead: true,
            readAt: item.readAt ?? new Date().toISOString(),
          }));
        });
        break;
      }
      default:
        break;
    }
  }, [lastEvent, unreadOnly]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await notificationsApi.markAsRead(notificationId);
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? response.result : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      toast.success(
        dictionary.notificationsPage.title,
        dictionary.notificationsPage.markReadSuccess,
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? translateApiMessage(
              error.details,
              error.code,
              dictionary,
              dictionary.notificationsPage.loadError,
            )
          : dictionary.notificationsPage.loadError;
      toast.error(dictionary.notificationsPage.title, message);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      toast.success(
        dictionary.notificationsPage.title,
        dictionary.notificationsPage.updatedAllSuccess,
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? translateApiMessage(
              error.details,
              error.code,
              dictionary,
              dictionary.notificationsPage.loadError,
            )
          : dictionary.notificationsPage.loadError;
      toast.error(dictionary.notificationsPage.title, message);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-app-text">
            {dictionary.notificationsPage.title}
          </h1>
          <p className="mt-2 text-sm text-app-text-muted">
            {dictionary.notificationsPage.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={isConnected ? "secondary" : "outline"}>
            {isConnected
              ? dictionary.notificationsPage.liveConnected
              : dictionary.notificationsPage.liveDisconnected}
          </Badge>
          <Badge variant="secondary">
            {dictionary.notificationsPage.unreadCountLabel}: {unreadCount}
          </Badge>
          <Button
            variant={unreadOnly ? "primary" : "outline"}
            className="w-auto"
            onClick={() => setUnreadOnly((current) => !current)}
          >
            {unreadOnly
              ? dictionary.notificationsPage.allNotifications
              : dictionary.notificationsPage.unreadOnly}
          </Button>
          <Button
            variant="outline"
            className="w-auto"
            onClick={() => void loadNotifications()}
          >
            {dictionary.notificationsPage.refresh}
          </Button>
          <Button
            className="w-auto"
            onClick={() => void handleMarkAllAsRead()}
            disabled={isMarkingAll || unreadNotifications === 0}
          >
            {isMarkingAll
              ? dictionary.notificationsPage.markAllReading
              : dictionary.notificationsPage.markAllRead}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-app-border bg-app-surface-2 px-6 py-10 text-center text-sm text-app-text-muted">
          {dictionary.notificationsPage.loading}
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-app-border bg-app-surface-2 px-6 py-10 text-center">
          <h2 className="text-xl font-semibold text-app-text">
            {dictionary.notificationsPage.emptyTitle}
          </h2>
          <p className="mt-3 text-sm text-app-text-muted">
            {dictionary.notificationsPage.emptyDescription}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-app-border bg-app-surface-2 px-5 py-4"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={item.isRead ? "outline" : "secondary"}>
                      {item.isRead
                        ? dictionary.notificationsPage.allNotifications
                        : dictionary.notificationsPage.unreadOnly}
                    </Badge>
                    <Badge variant="outline">
                      {formatNotificationType(item.type)}
                    </Badge>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-app-text">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm text-app-text-muted">
                      {item.body}
                    </p>
                  </div>
                  <div className="space-y-1 text-xs text-app-text-muted">
                    <p>
                      {dictionary.notificationsPage.createdAtLabel}:{" "}
                      {formatNotificationDate(item.createdAt, locale)}
                    </p>
                    <p>
                      {dictionary.notificationsPage.readAtLabel}:{" "}
                      {formatNotificationDate(item.readAt, locale)}
                    </p>
                  </div>
                </div>

                {!item.isRead ? (
                  <Button
                    variant="outline"
                    className="w-auto"
                    onClick={() => void handleMarkAsRead(item.id)}
                  >
                    {dictionary.notificationsPage.markRead}
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
