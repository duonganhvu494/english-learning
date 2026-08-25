import type {
  ListMyNotificationsQuery,
  NotificationListResponse,
  NotificationMarkAllReadResponse,
  NotificationUnreadCountResponse,
} from "@/types";

import { authApi } from "./auth.api";
import { http, unwrap } from "./http";

export const notificationsApi = {
  async listMyNotifications(
    params?: ListMyNotificationsQuery,
  ): Promise<NotificationListResponse> {
    return unwrap<NotificationListResponse>(
      http.get("/notifications/me", {
        params,
      }),
    );
  },

  async getUnreadCount(): Promise<NotificationUnreadCountResponse> {
    return unwrap<NotificationUnreadCountResponse>(
      http.get("/notifications/me/unread-count"),
    );
  },

  async markAllRead(): Promise<NotificationMarkAllReadResponse> {
    await authApi.ensureCsrfToken();

    return unwrap<NotificationMarkAllReadResponse>(
      http.patch("/notifications/me/read-all"),
    );
  },

  async markAsRead(id: string) {
    await authApi.ensureCsrfToken();

    return unwrap(http.patch(`/notifications/${id}/read`));
  },
};
