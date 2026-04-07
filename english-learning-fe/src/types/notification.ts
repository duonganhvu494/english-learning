export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsListQuery = {
  unreadOnly?: boolean;
  limit?: number;
};

export type NotificationUnreadCount = {
  unreadCount: number;
};

export type NotificationMarkAllReadResponse = {
  updatedCount: number;
};

export type NotificationsConnectedPayload = {
  userId: string;
};

export type NotificationCreatedPayload = {
  notification: NotificationItem;
  unreadCount: number;
};

export type NotificationReadPayload = {
  notificationId: string;
  readAt: string | null;
  unreadCount: number;
};

export type NotificationsReadAllPayload = {
  updatedCount: number;
  unreadCount: number;
};

export type NotificationsUnreadCountUpdatedPayload = {
  unreadCount: number;
};

export type NotificationsRealtimeEvent =
  | {
      id: number;
      type: "connected";
      payload: NotificationsConnectedPayload;
    }
  | {
      id: number;
      type: "created";
      payload: NotificationCreatedPayload;
    }
  | {
      id: number;
      type: "read";
      payload: NotificationReadPayload;
    }
  | {
      id: number;
      type: "read_all";
      payload: NotificationsReadAllPayload;
    }
  | {
      id: number;
      type: "unread_count_updated";
      payload: NotificationsUnreadCountUpdatedPayload;
    };
