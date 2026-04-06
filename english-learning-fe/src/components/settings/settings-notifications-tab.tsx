"use client";

import { Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/i18n/types";
import type { NotificationSettingsState } from "@/components/settings/settings-types";

type SettingsNotificationsTabProps = {
  dictionary: Dictionary["settingsPage"];
  value: NotificationSettingsState;
  onChange: (patch: Partial<NotificationSettingsState>) => void;
  onSave: () => void;
};

type ToggleRowProps = {
  id: string;
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onCheckedChange,
}: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-app-text-muted">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function SettingsNotificationsTab({
  dictionary,
  value,
  onChange,
  onSave,
}: SettingsNotificationsTabProps) {
  return (
    <Card className="border-app-border bg-app-surface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          {dictionary.notificationsTitle}
        </CardTitle>
        <CardDescription>{dictionary.notificationsDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ToggleRow
          id="email-notifications"
          label={dictionary.emailNotificationsLabel}
          hint={dictionary.emailNotificationsHint}
          checked={value.emailNotifications}
          onCheckedChange={(checked) => onChange({ emailNotifications: checked })}
        />
        <Separator />
        <ToggleRow
          id="push-notifications"
          label={dictionary.pushNotificationsLabel}
          hint={dictionary.pushNotificationsHint}
          checked={value.pushNotifications}
          onCheckedChange={(checked) => onChange({ pushNotifications: checked })}
        />
        <Separator />
        <ToggleRow
          id="assignment-reminders"
          label={dictionary.assignmentRemindersLabel}
          hint={dictionary.assignmentRemindersHint}
          checked={value.assignmentReminders}
          onCheckedChange={(checked) => onChange({ assignmentReminders: checked })}
        />
        <Separator />
        <ToggleRow
          id="class-updates"
          label={dictionary.classUpdatesLabel}
          hint={dictionary.classUpdatesHint}
          checked={value.classUpdates}
          onCheckedChange={(checked) => onChange({ classUpdates: checked })}
        />
        <Separator />
        <ToggleRow
          id="weekly-digest"
          label={dictionary.weeklyDigestLabel}
          hint={dictionary.weeklyDigestHint}
          checked={value.weeklyDigest}
          onCheckedChange={(checked) => onChange({ weeklyDigest: checked })}
        />

        <div className="pt-2">
          <Button type="button" className="w-auto" onClick={onSave}>
            {dictionary.savePreferences}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
