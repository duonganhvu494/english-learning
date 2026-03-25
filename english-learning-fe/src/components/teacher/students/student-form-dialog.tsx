"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus } from "lucide-react";
import type { StudentFormData, StudentItem, StudentsDictionary } from "./types";

type StudentFormDialogProps = {
  open: boolean;
  editingStudent: StudentItem | null;
  formData: StudentFormData;
  isSubmitting: boolean;
  dictionary: StudentsDictionary;
  onOpenChange: (open: boolean) => void;
  onFormDataChange: (next: StudentFormData) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function StudentFormDialog({
  open,
  editingStudent,
  formData,
  isSubmitting,
  dictionary,
  onOpenChange,
  onFormDataChange,
  onSubmit,
}: StudentFormDialogProps) {
  const updateField = (field: keyof StudentFormData, value: string) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-auto">
          <Plus className="mr-2 h-4 w-4" />
          {dictionary.addStudent}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {editingStudent ? dictionary.editStudent : dictionary.addNewStudent}
          </DialogTitle>
          <DialogDescription>
            {editingStudent
              ? dictionary.editStudentDescription
              : dictionary.addStudentDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="student-full-name">
                {dictionary.fullNameLabel}
              </Label>
              <Input
                id="student-full-name"
                value={formData.fullName}
                onChange={(event) =>
                  updateField("fullName", event.target.value)
                }
                placeholder={dictionary.fullNamePlaceholder}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="student-username">
                {dictionary.userNameLabel}
              </Label>
              <Input
                id="student-username"
                value={formData.userName}
                onChange={(event) =>
                  updateField("userName", event.target.value)
                }
                placeholder={dictionary.userNamePlaceholder}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="student-email">{dictionary.emailLabel}</Label>
              <Input
                id="student-email"
                type="email"
                value={formData.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder={dictionary.emailPlaceholder}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="w-auto"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {dictionary.cancel}
            </Button>
            <Button type="submit" className="w-auto" disabled={isSubmitting}>
              {editingStudent
                ? dictionary.updateStudent
                : dictionary.addStudentSubmit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
