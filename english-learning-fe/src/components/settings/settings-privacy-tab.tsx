"use client";

import { Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Dictionary } from "@/i18n/types";
import type { PrivacySettingsState } from "@/components/settings/settings-types";

type SettingsPrivacyTabProps = {
  dictionary: Dictionary["settingsPage"];
  isTeacher: boolean;
  value: PrivacySettingsState;
  onChange: (patch: Partial<PrivacySettingsState>) => void;
  onSave: () => void;
};

export function SettingsPrivacyTab({
  dictionary,
  isTeacher,
  value,
  onChange,
  onSave,
}: SettingsPrivacyTabProps) {
  const selectedProfileVisibilityLabel =
    value.profileVisibility === "public"
      ? dictionary.profileVisibilityPublic
      : value.profileVisibility === "private"
        ? dictionary.profileVisibilityPrivate
        : isTeacher
          ? dictionary.profileVisibilityMembersTeacher
          : dictionary.profileVisibilityMembersStudent;

  return (
    <Card className="border-app-border bg-app-surface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {dictionary.privacyTitle}
        </CardTitle>
        <CardDescription>{dictionary.privacyDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="profile-visibility">{dictionary.profileVisibilityLabel}</Label>
          <Select
            value={value.profileVisibility}
            onValueChange={(nextValue) =>
              onChange({
                profileVisibility: nextValue as PrivacySettingsState["profileVisibility"],
              })
            }
          >
            <SelectTrigger id="profile-visibility">
              <span>{selectedProfileVisibilityLabel}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">{dictionary.profileVisibilityPublic}</SelectItem>
              <SelectItem value="private">{dictionary.profileVisibilityPrivate}</SelectItem>
              <SelectItem value="members-only">
                {isTeacher
                  ? dictionary.profileVisibilityMembersTeacher
                  : dictionary.profileVisibilityMembersStudent}
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-app-text-muted">{dictionary.profileVisibilityHint}</p>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="show-email">{dictionary.showEmailLabel}</Label>
            <p className="text-sm text-app-text-muted">{dictionary.showEmailHint}</p>
          </div>
          <Switch
            id="show-email"
            checked={value.showEmail}
            onCheckedChange={(checked) => onChange({ showEmail: checked })}
          />
        </div>

        <div className="pt-2">
          <Button type="button" className="w-auto" onClick={onSave}>
            {dictionary.savePreferences}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
