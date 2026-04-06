"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Trash2 } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationsList } from "@/components/notifications/notifications-list";

function replaceTemplate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );
}

export function NotificationsPage() {
  const { appRole } = useAuth();
  const { dictionary } = useAppSettings();
  const { success: notifySuccess } = useNotification();
  const notificationsDictionary = dictionary.notificationsPage;
  const sourceNotifications = notificationsDictionary.mock[appRole];

  const [readOverrides, setReadOverrides] = useState<Record<string, boolean>>({});
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const notifications = useMemo(
    () =>
      sourceNotifications
        .filter((item) => !removedIds.includes(item.id))
        .map((item) => ({
          ...item,
          read: readOverrides[item.id] ?? item.read,
        })),
    [readOverrides, removedIds, sourceNotifications],
  );

  const unreadNotifications = notifications.filter((item) => !item.read);
  const unreadCount = unreadNotifications.length;

  const handleMarkAsRead = (id: string) => {
    setReadOverrides((previous) => ({ ...previous, [id]: true }));
  };

  const handleMarkAllAsRead = () => {
    setReadOverrides((previous) => {
      const next = { ...previous };
      for (const item of notifications) {
        next[item.id] = true;
      }
      return next;
    });
    notifySuccess(
      notificationsDictionary.toasts.allMarkedReadTitle,
      notificationsDictionary.toasts.allMarkedReadMessage,
    );
  };

  const handleDelete = (id: string) => {
    setRemovedIds((previous) =>
      previous.includes(id) ? previous : [...previous, id],
    );
    notifySuccess(
      notificationsDictionary.toasts.notificationDeletedTitle,
      notificationsDictionary.toasts.notificationDeletedMessage,
    );
  };

  const handleClearAll = () => {
    setRemovedIds((previous) => {
      const next = new Set(previous);
      for (const item of notifications) {
        next.add(item.id);
      }
      return Array.from(next);
    });
    notifySuccess(
      notificationsDictionary.toasts.allClearedTitle,
      notificationsDictionary.toasts.allClearedMessage,
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-app-text">
            {notificationsDictionary.title}
          </h1>
          <p className="text-app-text-muted">{notificationsDictionary.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              {notificationsDictionary.markAllRead}
            </Button>
          ) : null}

          {notifications.length > 0 ? (
            <Button variant="outline" onClick={handleClearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              {notificationsDictionary.clearAll}
            </Button>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="all">
            {replaceTemplate(notificationsDictionary.tabLabel, {
              label: notificationsDictionary.tabAll,
              count: String(notifications.length),
            })}
          </TabsTrigger>
          <TabsTrigger value="unread">
            {replaceTemplate(notificationsDictionary.tabLabel, {
              label: notificationsDictionary.tabUnread,
              count: String(unreadCount),
            })}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <NotificationsList
            notifications={notifications}
            emptyIcon="bell"
            emptyTitle={notificationsDictionary.emptyAllTitle}
            emptyDescription={notificationsDictionary.emptyAllDescription}
            newBadgeLabel={notificationsDictionary.newBadge}
            markAsReadLabel={notificationsDictionary.markAsReadAria}
            deleteLabel={notificationsDictionary.deleteAria}
            categories={notificationsDictionary.categories}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        </TabsContent>

        <TabsContent value="unread">
          <NotificationsList
            notifications={unreadNotifications}
            emptyIcon="check"
            emptyTitle={notificationsDictionary.emptyUnreadTitle}
            emptyDescription={notificationsDictionary.emptyUnreadDescription}
            newBadgeLabel={notificationsDictionary.newBadge}
            markAsReadLabel={notificationsDictionary.markAsReadAria}
            deleteLabel={notificationsDictionary.deleteAria}
            categories={notificationsDictionary.categories}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
