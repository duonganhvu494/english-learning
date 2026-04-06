"use client";

import { Lock, Shield, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Dictionary } from "@/i18n/types";
import type { PasswordFormState } from "@/components/settings/settings-types";

type SettingsSecurityTabProps = {
  dictionary: Dictionary["settingsPage"];
  passwordForm: PasswordFormState;
  onPasswordChange: (patch: Partial<PasswordFormState>) => void;
  onUpdatePassword: () => void;
  twoFactorAuthEnabled: boolean;
  onToggleTwoFactorAuth: (checked: boolean) => void;
  onDeleteAccount: () => void;
};

export function SettingsSecurityTab({
  dictionary,
  passwordForm,
  onPasswordChange,
  onUpdatePassword,
  twoFactorAuthEnabled,
  onToggleTwoFactorAuth,
  onDeleteAccount,
}: SettingsSecurityTabProps) {
  return (
    <div className="space-y-4">
      <Card className="border-app-border bg-app-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {dictionary.securityPasswordTitle}
          </CardTitle>
          <CardDescription>{dictionary.securityPasswordDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">{dictionary.currentPasswordLabel}</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordForm.currentPassword}
              placeholder={dictionary.currentPasswordPlaceholder}
              onChange={(event) =>
                onPasswordChange({ currentPassword: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">{dictionary.newPasswordLabel}</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordForm.newPassword}
              placeholder={dictionary.newPasswordPlaceholder}
              onChange={(event) =>
                onPasswordChange({ newPassword: event.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">{dictionary.confirmPasswordLabel}</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordForm.confirmPassword}
              placeholder={dictionary.confirmPasswordPlaceholder}
              onChange={(event) =>
                onPasswordChange({ confirmPassword: event.target.value })
              }
            />
          </div>
          <Button type="button" className="w-auto" onClick={onUpdatePassword}>
            {dictionary.updatePassword}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-app-border bg-app-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {dictionary.twoFactorTitle}
          </CardTitle>
          <CardDescription>{dictionary.twoFactorDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="two-factor-auth">{dictionary.twoFactorLabel}</Label>
              <p className="text-sm text-app-text-muted">{dictionary.twoFactorHint}</p>
            </div>
            <Switch
              id="two-factor-auth"
              checked={twoFactorAuthEnabled}
              onCheckedChange={onToggleTwoFactorAuth}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-(--color-error) bg-app-surface">
        <CardHeader>
          <CardTitle className="text-(--color-error)">{dictionary.dangerZoneTitle}</CardTitle>
          <CardDescription>{dictionary.dangerZoneDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full border-(--color-error) text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_75%,var(--color-surface)_25%)] sm:w-auto"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {dictionary.deleteAccount}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{dictionary.deleteDialogTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {dictionary.deleteDialogDescription}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{dictionary.deleteDialogCancel}</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-(--color-error)"
                  onClick={onDeleteAccount}
                >
                  {dictionary.deleteDialogConfirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
