"use client";

import type { Dictionary } from "@/i18n/types";

export type NotificationItem =
  Dictionary["notificationsPage"]["mock"]["teacher"][number];

export type NotificationFilter = "all" | "unread";

export type NotificationCategoryLabels =
  Dictionary["notificationsPage"]["categories"];

