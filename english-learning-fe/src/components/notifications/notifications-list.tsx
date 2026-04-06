"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Bell,
  BookOpen,
  Calendar,
  CheckCheck,
  CheckCircle,
  Info,
  Trash2,
  User,
  XCircle,
  Award,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  NotificationCategoryLabels,
  NotificationItem,
} from "@/components/notifications/notifications-types";

const TYPE_ICON_MAP: Record<NotificationItem["type"], LucideIcon> = {
  info: Info,
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
};

const TYPE_COLOR_MAP: Record<NotificationItem["type"], string> = {
  info: "bg-[color-mix(in_srgb,var(--color-info-soft)_72%,var(--color-surface)_28%)] text-(--color-info)",
  success:
    "bg-[color-mix(in_srgb,var(--color-success-soft)_72%,var(--color-surface)_28%)] text-(--color-success)",
  warning:
    "bg-[color-mix(in_srgb,var(--color-warning-soft)_72%,var(--color-surface)_28%)] text-(--color-warning)",
  error:
    "bg-[color-mix(in_srgb,var(--color-error-soft)_72%,var(--color-surface)_28%)] text-(--color-error)",
};

const CATEGORY_ICON_MAP: Record<NotificationItem["category"], LucideIcon> = {
  class: BookOpen,
  assignment: Award,
  event: Calendar,
  system: Bell,
  student: User,
};

type NotificationsListProps = {
  notifications: NotificationItem[];
  emptyIcon: "bell" | "check";
  emptyTitle: string;
  emptyDescription: string;
  newBadgeLabel: string;
  markAsReadLabel: string;
  deleteLabel: string;
  categories: NotificationCategoryLabels;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
};

function getCategoryLabel(
  category: NotificationItem["category"],
  labels: NotificationCategoryLabels,
) {
  return labels[category];
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: "bell" | "check";
  title: string;
  description: string;
}) {
  const Icon = icon === "check" ? CheckCircle : Bell;
  const iconColorClass =
    icon === "check"
      ? "bg-[color-mix(in_srgb,var(--color-success-soft)_75%,var(--color-surface)_25%)] text-(--color-success)"
      : "bg-app-surface-2 text-app-text-muted";

  return (
    <Card className="border-app-border bg-app-surface">
      <CardContent className="py-12">
        <div className="text-center">
          <div
            className={`mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${iconColorClass}`}
          >
            <Icon className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-medium text-app-text">{title}</h3>
          <p className="text-app-text-muted">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function NotificationsList({
  notifications,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  newBadgeLabel,
  markAsReadLabel,
  deleteLabel,
  categories,
  onMarkAsRead,
  onDelete,
}: NotificationsListProps) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <Card className="border-app-border bg-app-surface">
      <CardContent className="p-0">
        <div className="divide-y divide-app-border">
          {notifications.map((notification) => {
            const TypeIcon = TYPE_ICON_MAP[notification.type];
            const CategoryIcon = CATEGORY_ICON_MAP[notification.category];

            return (
              <div
                key={notification.id}
                className={`p-4 transition-colors sm:p-6 ${
                  notification.read
                    ? "hover:bg-app-surface-2"
                    : "bg-[color-mix(in_srgb,var(--color-info-soft)_18%,var(--color-surface)_82%)] hover:bg-[color-mix(in_srgb,var(--color-info-soft)_26%,var(--color-surface)_74%)]"
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TYPE_COLOR_MAP[notification.type]}`}
                  >
                    <TypeIcon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-app-text">
                          {notification.title}
                        </h3>
                        {!notification.read ? (
                          <Badge className="text-xs">{newBadgeLabel}</Badge>
                        ) : null}
                      </div>
                      <span className="whitespace-nowrap text-xs text-app-text-muted">
                        {notification.timestamp}
                      </span>
                    </div>

                    <p className="mb-3 text-sm text-app-text-muted">
                      {notification.message}
                    </p>

                    <Badge variant="outline" className="text-xs">
                      <CategoryIcon className="mr-1 h-3 w-3" />
                      {getCategoryLabel(notification.category, categories)}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2">
                    {!notification.read ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onMarkAsRead(notification.id)}
                        className="h-8 w-8 border-0 bg-transparent p-0 normal-case tracking-normal"
                        aria-label={markAsReadLabel}
                        title={markAsReadLabel}
                      >
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(notification.id)}
                      className="h-8 w-8 border-0 bg-transparent p-0 text-(--color-error) normal-case tracking-normal hover:text-(--color-error)"
                      aria-label={deleteLabel}
                      title={deleteLabel}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
