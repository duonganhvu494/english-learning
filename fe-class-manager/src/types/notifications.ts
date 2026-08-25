export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface NotificationMarkAllReadResponse {
  updatedCount: number;
}

export interface ListMyNotificationsQuery {
  unreadOnly?: boolean;
  limit?: number;
  cursor?: string;
}
