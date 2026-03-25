"use client";

import Link from "next/link";
import { Calendar, Edit, GraduationCap, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClassItem, ClassesDictionary } from "@/components/classes/types";
import { cn } from "@/utils/cn";

type ClassesGridProps = {
  classes: ClassItem[];
  deletingId: string | null;
  dictionary: ClassesDictionary;
  onEdit: (classItem: ClassItem) => void;
  onDelete: (classId: string) => void;
};

const statusClassNameMap: Record<ClassItem["status"], string> = {
  Active:
    "border-[color-mix(in_srgb,var(--color-success)_30%,var(--color-border)_70%)] bg-[color-mix(in_srgb,var(--color-success-soft)_80%,var(--color-surface)_20%)] text-(--color-success)",
  Draft:
    "border-app-border bg-app-surface-2 text-app-text-muted",
  Completed:
    "border-[color-mix(in_srgb,var(--color-info)_30%,var(--color-border)_70%)] bg-[color-mix(in_srgb,var(--color-info-soft)_80%,var(--color-surface)_20%)] text-(--color-info)",
};

export function ClassesGrid({
  classes,
  deletingId,
  dictionary,
  onEdit,
  onDelete,
}: ClassesGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {classes.map((classItem) => (
        <Card
          key={classItem.id}
          className="overflow-hidden border-app-border bg-app-surface transition-shadow hover:shadow-lg"
        >
          <div
            className="flex h-32 items-center justify-center"
            style={{ backgroundColor: classItem.color }}
          >
            <GraduationCap className="h-16 w-16 text-white/80" />
          </div>

          <CardHeader className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-xl font-semibold text-app-text">
                {classItem.className}
              </CardTitle>
              <Badge className={cn("border", statusClassNameMap[classItem.status])}>
                {classItem.status === "Active"
                  ? dictionary.statusActive
                  : classItem.status === "Draft"
                    ? dictionary.statusDraft
                    : dictionary.statusCompleted}
              </Badge>
            </div>
            <CardDescription className="text-app-text-muted">
              {classItem.description || dictionary.descriptionPlaceholder}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-app-text-muted">
              <Calendar className="h-4 w-4" />
              {classItem.schedule || dictionary.noSchedule}
            </div>

            <div className="flex items-center gap-2 text-sm text-app-text-muted">
              <Users className="h-4 w-4" />
              {classItem.studentCount} {dictionary.studentsEnrolled}
            </div>

            <Badge variant="outline" className="border-app-border text-app-text">
              {classItem.level === "Beginner"
                ? dictionary.levelBeginner
                : classItem.level === "Intermediate"
                  ? dictionary.levelIntermediate
                  : dictionary.levelAdvanced}
            </Badge>

            <div className="grid grid-cols-1 gap-2 pt-2 sm:grid-cols-[1fr_auto_auto]">
              <Link href={`/teacher/class/${classItem.id}`}>
                <Button variant="outline" className="w-full">
                  {dictionary.viewDetails}
                </Button>
              </Link>

              <Button
                variant="outline"
                className="w-full px-3 sm:w-12"
                onClick={() => onEdit(classItem)}
                aria-label={dictionary.editClass}
              >
                <Edit className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                className="w-full px-3 text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)] sm:w-12"
                onClick={() => onDelete(classItem.id)}
                disabled={deletingId === classItem.id}
                aria-label={dictionary.deleteClass}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
