import { useCallback, useEffect, useState } from "react";
import { Bell, Check, Clock } from "lucide-react";
import { toast } from "sonner";

import Card, { CardBody } from "@/app/components/ui/Card";
import Button from "@/app/components/ui/Button";

import { notificationsApi, getApiErrorMessage } from "@/api";
import type { NotificationItem } from "@/types";
import { useNotifications } from "@/app/providers/NotificationProvider";

const PAGE_SIZE = 3;

type FilterTab = "all" | "unread";

export default function NotificationsPage() {
  // Dùng chung unreadCount + markAllRead với dropdown ở header
  // để badge số lượng chưa đọc luôn đồng bộ giữa 2 nơi.
  const { unreadCount, markAllRead: markAllReadShared } = useNotifications();

  const [filter, setFilter] = useState<FilterTab>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchFirstPage = useCallback(async (tab: FilterTab) => {
    setIsLoading(true);

    try {
      // NOTE: nếu BE hỗ trợ lọc chưa đọc thì truyền thêm param (vd. unreadOnly).
      // Nếu API của bạn chưa hỗ trợ, có thể lọc tạm ở client bằng notifications.filter(n => !n.isRead)
      const result = await notificationsApi.listMyNotifications({
        limit: PAGE_SIZE,
        ...(tab === "unread" ? { unreadOnly: true } : {}),
      });

      setNotifications(result.items);
      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải thông báo"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFirstPage(filter);
  }, [filter, fetchFirstPage]);

  const loadMore = async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const result = await notificationsApi.listMyNotifications({
        limit: PAGE_SIZE,
        cursor: nextCursor,
        ...(filter === "unread" ? { unreadOnly: true } : {}),
      });

      setNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newItems = result.items.filter((n) => !existingIds.has(n.id));
        return [...prev, ...newItems];
      });

      setNextCursor(result.nextCursor);
      setHasMore(result.hasMore);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải thêm thông báo"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllReadShared();

      const readAt = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? readAt })),
      );

      toast.success("Đã đánh dấu đã đọc tất cả thông báo");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật thông báo"));
    }
  };

  // NOTE: giả định BE có endpoint đánh dấu đã đọc 1 thông báo (notificationsApi.markRead).
  // Nếu tên hàm thực tế khác, đổi lại cho khớp file src/api/notifications.ts của bạn.
  const handleItemClick = async (item: NotificationItem) => {
    if (item.isRead) return;

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === item.id
          ? { ...n, isRead: true, readAt: new Date().toISOString() }
          : n,
      ),
    );

    try {
      await notificationsApi.markAsRead(item.id);
    } catch (error) {
      // Rollback nếu API lỗi
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === item.id ? { ...n, isRead: false, readAt: null } : n,
        ),
      );
      toast.error(getApiErrorMessage(error, "Không thể đánh dấu đã đọc"));
    }
  };

  const totalLoaded = notifications.length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="mt-1 text-gray-600">
            Xem lại các thông báo và hoạt động gần đây
          </p>
        </div>

        <Button
          onClick={() => void handleMarkAllRead()}
          disabled={unreadCount === 0}
        >
          <Check className="h-4 w-4" />
          Đánh dấu đã đọc
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đã tải</p>
                <p className="mt-1 text-2xl font-bold">{totalLoaded}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chưa đọc</p>
                <p className="mt-1 text-2xl font-bold">{unreadCount}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-50">
                <Bell className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(
          [
            { key: "all", label: "Tất cả" },
            { key: "unread", label: "Chưa đọc" },
          ] as { key: FilterTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              filter === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardBody>
          <div className="space-y-1">
            {isLoading ? (
              <div className="py-12 text-center text-gray-500">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                {filter === "unread"
                  ? "Không có thông báo chưa đọc"
                  : "Không có thông báo"}
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => void handleItemClick(notification)}
                  className={`flex w-full gap-4 rounded-lg p-4 text-left hover:bg-gray-50 ${
                    notification.isRead ? "" : "bg-blue-50"
                  }`}
                >
                  <div className="mt-1">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        notification.isRead ? "bg-gray-300" : "bg-blue-600"
                      }`}
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between gap-3">
                      <h3 className="font-medium text-gray-900">
                        {notification.title}
                      </h3>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      {notification.body}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {hasMore && (
            <div className="mt-6 border-t pt-4 text-center">
              <Button
                variant="outline"
                disabled={isLoadingMore}
                onClick={() => void loadMore()}
              >
                {isLoadingMore ? "Đang tải..." : "Xem thêm"}
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
