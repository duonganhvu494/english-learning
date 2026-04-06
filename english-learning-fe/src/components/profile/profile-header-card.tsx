"use client";

import { Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type ProfileHeaderCardProps = {
  fullName: string;
  contact: string;
  initials: string;
  roleLabel: string;
  additionalBadges: string[];
  editLabel: string;
  isEditing: boolean;
  onEdit: () => void;
  onUploadPhoto: () => void;
};

export function ProfileHeaderCard({
  fullName,
  contact,
  initials,
  roleLabel,
  additionalBadges,
  editLabel,
  isEditing,
  onEdit,
  onUploadPhoto,
}: ProfileHeaderCardProps) {
  return (
    <Card className="border-app-border bg-app-surface">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative shrink-0">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-(--color-primary) text-2xl font-semibold text-(--color-text-inverse)">
              {initials}
            </div>
            <Button
              type="button"
              size="sm"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full px-0"
              onClick={onUploadPhoto}
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 space-y-1">
            <h2 className="text-2xl font-semibold text-app-text">{fullName}</h2>
            <p className="text-sm text-app-text-muted">{contact}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{roleLabel}</Badge>
              {additionalBadges.map((badge) => (
                <Badge key={badge} variant="outline">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>

          {!isEditing ? (
            <Button type="button" onClick={onEdit}>
              {editLabel}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
