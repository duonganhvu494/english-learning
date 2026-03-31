"use client";

import { useMemo, useState } from "react";
import { ApiError, authApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";

export default function TeacherSettingsPage() {
  const { dictionary } = useAppSettings();
  const notification = useNotification();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isDisabled = useMemo(
    () =>
      isSubmitting ||
      currentPassword.trim().length === 0 ||
      newPassword.trim().length === 0 ||
      confirmPassword.trim().length === 0,
    [confirmPassword, currentPassword, isSubmitting, newPassword],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      setFormError(dictionary.settingsPage.confirmMismatch);
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notification.success(
        dictionary.settingsPage.successTitle,
        dictionary.settingsPage.successMessage,
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? translateApiMessage(
              error.details,
              error.code,
              dictionary,
              dictionary.settingsPage.errorFallback,
            )
          : dictionary.settingsPage.errorFallback;

      setFormError(message);
      notification.error(dictionary.settingsPage.title, message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-app-text">
          {dictionary.settingsPage.title}
        </h1>
        <p className="mt-2 text-sm text-app-text-muted">
          {dictionary.settingsPage.description}
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl border border-app-border bg-app-surface-2 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-app-text">
            {dictionary.settingsPage.securityTitle}
          </h2>
          <p className="mt-2 text-sm text-app-text-muted">
            {dictionary.settingsPage.securityDescription}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            type="password"
            label={dictionary.settingsPage.currentPasswordLabel}
            placeholder={dictionary.settingsPage.currentPasswordPlaceholder}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />

          <Input
            type="password"
            label={dictionary.settingsPage.newPasswordLabel}
            placeholder={dictionary.settingsPage.newPasswordPlaceholder}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />

          <Input
            type="password"
            label={dictionary.settingsPage.confirmPasswordLabel}
            placeholder={dictionary.settingsPage.confirmPasswordPlaceholder}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />

          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isDisabled} className="w-auto min-w-48">
              {isSubmitting
                ? dictionary.settingsPage.submitting
                : dictionary.settingsPage.submit}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
