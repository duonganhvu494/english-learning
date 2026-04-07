import { httpClient } from "@/api/core/http-client";
import type {
  NotificationItem,
  NotificationMarkAllReadResponse,
  NotificationsListQuery,
  NotificationUnreadCount,
} from "@/types/notification";

function toQueryString(query: NotificationsListQuery = {}) {
  const params = new URLSearchParams();

  if (query.unreadOnly !== undefined) {
    params.set("unreadOnly", String(query.unreadOnly));
  }

  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export const notificationsApi = {
  listMine: (query: NotificationsListQuery = {}) =>
    httpClient.get<NotificationItem[]>(
      `/notifications/me${toQueryString(query)}`,
    ),
  getUnreadCount: () =>
    httpClient.get<NotificationUnreadCount>("/notifications/me/unread-count"),
  markAsRead: (notificationId: string) =>
    httpClient.patch<NotificationItem>(
      `/notifications/${notificationId}/read`,
      {},
    ),
  markAllAsRead: () =>
    httpClient.patch<NotificationMarkAllReadResponse>(
      "/notifications/me/read-all",
      {},
    ),
};
