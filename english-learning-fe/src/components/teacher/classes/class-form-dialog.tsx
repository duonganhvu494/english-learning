"use client";

import { Plus } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CLASS_COLORS,
  type ClassFormData,
  type ClassItem,
  type ClassesDictionary,
} from "@/components/teacher/classes/types";
import { cn } from "@/utils/cn";

type ClassFormDialogProps = {
  open: boolean;
  editingClass: ClassItem | null;
  formData: ClassFormData;
  isSubmitting: boolean;
  dictionary: ClassesDictionary;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (next: ClassFormData) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function ClassFormDialog({
  open,
  editingClass,
  formData,
  isSubmitting,
  dictionary,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: ClassFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {dictionary.newClass}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl border-app-border bg-app-surface">
        <DialogHeader>
          <DialogTitle>
            {editingClass ? dictionary.editClass : dictionary.createNewClass}
          </DialogTitle>
          <DialogDescription>
            {editingClass
              ? dictionary.editClassDescription
              : dictionary.createClassDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{dictionary.classNameLabel}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(event) =>
                onFormDataChange({ ...formData, name: event.target.value })
              }
              placeholder={dictionary.classNamePlaceholder}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">{dictionary.descriptionLabel}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) =>
                onFormDataChange({
                  ...formData,
                  description: event.target.value,
                })
              }
              placeholder={dictionary.descriptionPlaceholder}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="schedule">{dictionary.scheduleLabel}</Label>
            <Input
              id="schedule"
              value={formData.schedule}
              onChange={(event) =>
                onFormDataChange({ ...formData, schedule: event.target.value })
              }
              placeholder={dictionary.schedulePlaceholder}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="level">{dictionary.levelLabel}</Label>
              <select
                id="level"
                value={formData.level}
                onChange={(event) =>
                  onFormDataChange({
                    ...formData,
                    level: event.target.value as ClassFormData["level"],
                  })
                }
                className="h-10 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text"
              >
                <option value="Beginner">{dictionary.levelBeginner}</option>
                <option value="Intermediate">
                  {dictionary.levelIntermediate}
                </option>
                <option value="Advanced">{dictionary.levelAdvanced}</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">{dictionary.statusLabel}</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(event) =>
                  onFormDataChange({
                    ...formData,
                    status: event.target.value as ClassFormData["status"],
                  })
                }
                className="h-10 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text"
              >
                <option value="Active">{dictionary.statusActive}</option>
                <option value="Draft">{dictionary.statusDraft}</option>
                <option value="Completed">{dictionary.statusCompleted}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>{dictionary.colorThemeLabel}</Label>
            <div className="flex flex-wrap gap-2">
              {CLASS_COLORS.map((color) => (
                <Button
                  key={color}
                  type="button"
                  onClick={() => onFormDataChange({ ...formData, color })}
                  variant="secondary"
                  size="sm"
                  className={cn(
                    "h-10 w-10 rounded-lg border-2 bg-transparent p-0 transition-transform",
                    formData.color === color
                      ? "scale-110 border-app-text"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: color }}
                  aria-label={`${dictionary.colorThemeLabel} ${color}`}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {dictionary.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {editingClass ? dictionary.updateClass : dictionary.createClass}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
