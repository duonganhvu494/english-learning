"use client";

import { useState } from "react";
import { ApiError, classesApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useAuth } from "@/providers/auth-provider";
import { useNotification } from "@/providers/notification-provider";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ClassFormData = {
  name: string;
  description: string;
  schedule: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  status: "Active" | "Draft" | "Completed";
  color: string;
};

type CreateClassDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanLimitReached?: (limit: number | null) => void;
  onCreate: (classData: {
    id: string;
    name: string;
    description: string;
    schedule: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    status: "Active" | "Draft" | "Completed";
    color: string;
    studentCount: number;
  }) => void;
};

const MAX_CLASSES_REACHED_CODE = "WORKSPACE_PLAN_MAX_CLASSES_REACHED";

function parseClassLimitFromError(
  details: string | string[] | undefined,
): number | null {
  const source = Array.isArray(details) ? details.join(" ") : details;
  if (typeof source !== "string") {
    return null;
  }

  const matched = source.match(/\bup to\s+(\d+)\s+classes\b/i);
  if (!matched) {
    return null;
  }

  const parsed = Number.parseInt(matched[1] ?? "", 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

const COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
];

export function CreateClassDialog({
  open,
  onOpenChange,
  onPlanLimitReached,
  onCreate,
}: CreateClassDialogProps) {
  const { dictionary } = useAppSettings();
  const { activeWorkspaceId } = useAuth();
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    description: "",
    schedule: "",
    level: "Beginner",
    status: "Active",
    color: COLORS[0],
  });

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      schedule: "",
      level: "Beginner",
      status: "Active",
      color: COLORS[0],
    });
    onOpenChange(false);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success: notifySuccess, error: notifyError } = useNotification();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      notifyError(dictionary.dashboard.classCreateError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!activeWorkspaceId) {
        notifyError(dictionary.dashboard.workspaceNotFound);
        return;
      }

      const response = await classesApi.createClass(activeWorkspaceId, {
        className: formData.name,
        description: formData.description || undefined,
      });

      const created = response.result;

      onCreate({
        id: created.id,
        name: formData.name,
        description: formData.description,
        schedule: formData.schedule,
        level: formData.level,
        status: formData.status,
        color: formData.color,
        studentCount: created.studentCount ?? 0,
      });

      notifySuccess(dictionary.dashboard.classCreatedSuccess);
      handleClose();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === MAX_CLASSES_REACHED_CODE) {
          onPlanLimitReached?.(parseClassLimitFromError(error.details));
          return;
        }

        const message = translateApiMessage(
          error.details,
          error.code,
          dictionary,
          dictionary.dashboard.classCreateError,
        );

        notifyError(message);
      } else {
        notifyError(dictionary.dashboard.classCreateError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{dictionary.dashboard.createDialogTitle}</DialogTitle>
          <DialogDescription>
            {dictionary.dashboard.createDialogDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{dictionary.dashboard.nameLabel}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={dictionary.dashboard.namePlaceholder}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">
              {dictionary.dashboard.descriptionLabel}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder={dictionary.dashboard.descriptionPlaceholder}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="level">{dictionary.dashboard.levelLabel}</Label>
              <select
                id="level"
                value={formData.level}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: e.target.value as ClassFormData["level"],
                  })
                }
                className="h-10 rounded-md border border-app-border px-3 text-app-text"
              >
                <option value="Beginner">
                  {dictionary.classesPage.levelBeginner}
                </option>
                <option value="Intermediate">
                  {dictionary.classesPage.levelIntermediate}
                </option>
                <option value="Advanced">
                  {dictionary.classesPage.levelAdvanced}
                </option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">{dictionary.dashboard.statusLabel}</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as ClassFormData["status"],
                  })
                }
                className="h-10 rounded-md border border-app-border px-3 text-app-text"
              >
                <option value="Active">
                  {dictionary.classesPage.statusActive}
                </option>
                <option value="Draft">{dictionary.classesPage.statusDraft}</option>
                <option value="Completed">
                  {dictionary.classesPage.statusCompleted}
                </option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{dictionary.dashboard.colorLabel}</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <Button
                  key={color}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-10 w-10 rounded-lg border-2 bg-transparent p-0 transition-all",
                    formData.color === color
                      ? "border-app-text scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                  aria-label={`${dictionary.dashboard.colorLabel} ${color}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {dictionary.dashboard.createDialogCancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "..." : dictionary.dashboard.createDialogSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
