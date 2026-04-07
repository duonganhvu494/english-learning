"use client";

export type NotificationItem = {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  category: "class" | "assignment" | "event" | "system" | "student";
};

export type NotificationFilter = "all" | "unread";

export type NotificationCategoryLabels = Record<
  NotificationItem["category"],
  string
>;

