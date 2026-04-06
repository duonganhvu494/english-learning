"use client";

import { Globe, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Dictionary } from "@/i18n/types";
import type { AppearanceSettingsState } from "@/components/settings/settings-types";

type SettingsAppearanceTabProps = {
  dictionary: Dictionary["settingsPage"];
  value: AppearanceSettingsState;
  onChange: (patch: Partial<AppearanceSettingsState>) => void;
  onSave: () => void;
};

export function SettingsAppearanceTab({
  dictionary,
  value,
  onChange,
  onSave,
}: SettingsAppearanceTabProps) {
  return (
    <Card className="border-app-border bg-app-surface">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          {dictionary.appearanceTitle}
        </CardTitle>
        <CardDescription>{dictionary.appearanceDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="settings-theme">{dictionary.themeLabel}</Label>
          <Select
            value={value.theme}
            onValueChange={(nextTheme) =>
              onChange({ theme: nextTheme as AppearanceSettingsState["theme"] })
            }
          >
            <SelectTrigger id="settings-theme">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">{dictionary.themeLight}</SelectItem>
              <SelectItem value="dark">{dictionary.themeDark}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-app-text-muted">{dictionary.themeHint}</p>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="settings-language" className="inline-flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {dictionary.languageLabel}
          </Label>
          <Select
            value={value.locale}
            onValueChange={(nextLocale) =>
              onChange({ locale: nextLocale as AppearanceSettingsState["locale"] })
            }
          >
            <SelectTrigger id="settings-language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">{dictionary.languageEnglish}</SelectItem>
              <SelectItem value="vi">{dictionary.languageVietnamese}</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-app-text-muted">{dictionary.languageHint}</p>
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
