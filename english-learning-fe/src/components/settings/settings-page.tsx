"use client";

import { useState } from "react";
import { Bell, Lock, Palette, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useAuth } from "@/providers/auth-provider";
import { useNotification } from "@/providers/notification-provider";
import { SettingsAppearanceTab } from "@/components/settings/settings-appearance-tab";
import { SettingsNotificationsTab } from "@/components/settings/settings-notifications-tab";
import { SettingsPrivacyTab } from "@/components/settings/settings-privacy-tab";
import { SettingsSecurityTab } from "@/components/settings/settings-security-tab";
import type {
  AppearanceSettingsState,
  NotificationSettingsState,
  PasswordFormState,
  PrivacySettingsState,
} from "@/components/settings/settings-types";

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsState = {
  emailNotifications: true,
  pushNotifications: true,
  assignmentReminders: true,
  classUpdates: true,
  weeklyDigest: false,
};

const DEFAULT_PRIVACY_SETTINGS: PrivacySettingsState = {
  profileVisibility: "public",
  showEmail: false,
};

const DEFAULT_PASSWORD_FORM: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function SettingsPage() {
  const { dictionary, locale, setLocale, theme, setTheme } = useAppSettings();
  const { appRole } = useAuth();
  const { success: notifySuccess, error: notifyError, info: notifyInfo } =
    useNotification();
  const settingsDictionary = dictionary.settingsPage;
  const isTeacher = appRole === "teacher";

  const [notificationSettings, setNotificationSettings] = useState(
    DEFAULT_NOTIFICATION_SETTINGS,
  );
  const [appearanceSettings, setAppearanceSettings] =
    useState<AppearanceSettingsState>({
      theme,
      locale,
    });
  const [privacySettings, setPrivacySettings] = useState(DEFAULT_PRIVACY_SETTINGS);
  const [passwordForm, setPasswordForm] = useState(DEFAULT_PASSWORD_FORM);
  const [twoFactorAuthEnabled, setTwoFactorAuthEnabled] = useState(false);

  const handleSaveNotifications = () => {
    void notificationSettings;
    notifySuccess(
      settingsDictionary.notificationsSavedTitle,
      settingsDictionary.notificationsSavedMessage,
    );
  };

  const handleSaveAppearance = () => {
    setTheme(appearanceSettings.theme);
    setLocale(appearanceSettings.locale);
    notifySuccess(
      settingsDictionary.appearanceSavedTitle,
      settingsDictionary.appearanceSavedMessage,
    );
  };

  const handleSavePrivacy = () => {
    void privacySettings;
    notifySuccess(
      settingsDictionary.privacySavedTitle,
      settingsDictionary.privacySavedMessage,
    );
  };

  const handleUpdatePassword = () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      notifyError(
        settingsDictionary.passwordValidationErrorTitle,
        settingsDictionary.passwordValidationErrorMessage,
      );
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notifyError(
        settingsDictionary.passwordMismatchTitle,
        settingsDictionary.passwordMismatchMessage,
      );
      return;
    }

    notifySuccess(
      settingsDictionary.passwordUpdatedTitle,
      settingsDictionary.passwordUpdatedMessage,
    );
    setPasswordForm(DEFAULT_PASSWORD_FORM);
  };

  const handleToggleTwoFactorAuth = (checked: boolean) => {
    setTwoFactorAuthEnabled(checked);
    if (checked) {
      notifySuccess(
        settingsDictionary.twoFactorEnabledTitle,
        settingsDictionary.twoFactorEnabledMessage,
      );
      return;
    }

    notifyInfo(
      settingsDictionary.twoFactorDisabledTitle,
      settingsDictionary.twoFactorDisabledMessage,
    );
  };

  const handleDeleteAccount = () => {
    notifyError(
      settingsDictionary.deleteAccountTitle,
      settingsDictionary.deleteAccountMessage,
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-app-text">{settingsDictionary.title}</h1>
        <p className="mt-2 text-app-text-muted">{settingsDictionary.description}</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">{settingsDictionary.tabNotifications}</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">{settingsDictionary.tabAppearance}</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">{settingsDictionary.tabPrivacy}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">{settingsDictionary.tabSecurity}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <SettingsNotificationsTab
            dictionary={settingsDictionary}
            value={notificationSettings}
            onChange={(patch) =>
              setNotificationSettings((previous) => ({ ...previous, ...patch }))
            }
            onSave={handleSaveNotifications}
          />
        </TabsContent>

        <TabsContent value="appearance">
          <SettingsAppearanceTab
            dictionary={settingsDictionary}
            value={appearanceSettings}
            onChange={(patch) =>
              setAppearanceSettings((previous) => ({ ...previous, ...patch }))
            }
            onSave={handleSaveAppearance}
          />
        </TabsContent>

        <TabsContent value="privacy">
          <SettingsPrivacyTab
            dictionary={settingsDictionary}
            isTeacher={isTeacher}
            value={privacySettings}
            onChange={(patch) =>
              setPrivacySettings((previous) => ({ ...previous, ...patch }))
            }
            onSave={handleSavePrivacy}
          />
        </TabsContent>

        <TabsContent value="security">
          <SettingsSecurityTab
            dictionary={settingsDictionary}
            passwordForm={passwordForm}
            onPasswordChange={(patch) =>
              setPasswordForm((previous) => ({ ...previous, ...patch }))
            }
            onUpdatePassword={handleUpdatePassword}
            twoFactorAuthEnabled={twoFactorAuthEnabled}
            onToggleTwoFactorAuth={handleToggleTwoFactorAuth}
            onDeleteAccount={handleDeleteAccount}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
