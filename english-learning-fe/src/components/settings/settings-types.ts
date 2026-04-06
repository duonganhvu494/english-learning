"use client";

import type { Locale, Theme } from "@/config/app-settings";

export type NotificationSettingsState = {
  emailNotifications: boolean;
  pushNotifications: boolean;
  assignmentReminders: boolean;
  classUpdates: boolean;
  weeklyDigest: boolean;
};

export type PrivacyVisibility = "public" | "private" | "members-only";

export type PrivacySettingsState = {
  profileVisibility: PrivacyVisibility;
  showEmail: boolean;
};

export type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type AppearanceSettingsState = {
  theme: Theme;
  locale: Locale;
};
