"use client";

import type { FormEvent } from "react";
import { Mail, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProfileFormData } from "@/components/profile/profile-types";

type ProfileFormDictionary = {
  personalInformationTitle: string;
  personalInformationDescription: string;
  fullNameLabel: string;
  fullNamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  locationLabel: string;
  locationPlaceholder: string;
  bioLabel: string;
  bioTeacherPlaceholder: string;
  bioStudentPlaceholder: string;
  saveChanges: string;
  cancel: string;
};

type ProfileFormCardProps = {
  dictionary: ProfileFormDictionary;
  isTeacher: boolean;
  isEditing: boolean;
  formData: ProfileFormData;
  onChange: (patch: Partial<ProfileFormData>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
};

export function ProfileFormCard({
  dictionary,
  isTeacher,
  isEditing,
  formData,
  onChange,
  onSubmit,
  onCancel,
}: ProfileFormCardProps) {
  return (
    <Card className="border-app-border bg-app-surface">
      <CardHeader>
        <CardTitle>{dictionary.personalInformationTitle}</CardTitle>
        <CardDescription>{dictionary.personalInformationDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-full-name">{dictionary.fullNameLabel}</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-4 w-4 text-app-text-soft" />
                <Input
                  id="profile-full-name"
                  value={formData.fullName}
                  onChange={(event) => onChange({ fullName: event.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder={dictionary.fullNamePlaceholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email">{dictionary.emailLabel}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-app-text-soft" />
                <Input
                  id="profile-email"
                  type="email"
                  value={formData.email}
                  onChange={(event) => onChange({ email: event.target.value })}
                  disabled={!isEditing}
                  className="pl-10"
                  placeholder={dictionary.emailPlaceholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">{dictionary.phoneLabel}</Label>
              <Input
                id="profile-phone"
                type="tel"
                value={formData.phone}
                onChange={(event) => onChange({ phone: event.target.value })}
                disabled={!isEditing}
                placeholder={dictionary.phonePlaceholder}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-location">{dictionary.locationLabel}</Label>
              <Input
                id="profile-location"
                value={formData.location}
                onChange={(event) => onChange({ location: event.target.value })}
                disabled={!isEditing}
                placeholder={dictionary.locationPlaceholder}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-bio">{dictionary.bioLabel}</Label>
            <Textarea
              id="profile-bio"
              value={formData.bio}
              onChange={(event) => onChange({ bio: event.target.value })}
              disabled={!isEditing}
              rows={4}
              placeholder={
                isTeacher
                  ? dictionary.bioTeacherPlaceholder
                  : dictionary.bioStudentPlaceholder
              }
            />
          </div>

          {isEditing ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit">{dictionary.saveChanges}</Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                {dictionary.cancel}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
