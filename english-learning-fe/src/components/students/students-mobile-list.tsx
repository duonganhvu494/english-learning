"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Mail, ShieldCheck, Trash2, User } from "lucide-react";
import { getInitials } from "@/utils/get-initials";
import type { StudentItem, StudentsDictionary } from "./types";

type StudentsMobileListProps = {
  students: StudentItem[];
  deletingId: string | null;
  dictionary: StudentsDictionary;
  onEdit: (student: StudentItem) => void;
  onDelete: (studentId: string) => void;
};

export function StudentsMobileList({
  students,
  deletingId,
  dictionary,
  onEdit,
  onDelete,
}: StudentsMobileListProps) {
  return (
    <div className="space-y-3 p-4 md:hidden">
      {students.map((student) => (
        <article
          key={student.studentId}
          className="rounded-xl border border-app-border bg-app-surface-2 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-sm font-semibold text-(--color-text-inverse)">
              {getInitials(student.fullName, "S")}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-app-text">
                {student.fullName}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-app-text-muted">
                <User className="h-3.5 w-3.5" />
                <span className="truncate">@{student.userName}</span>
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm text-app-text-muted">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{student.email}</span>
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="border-app-border bg-app-surface text-xs text-app-text-muted"
            >
              <ShieldCheck className="mr-1 h-3.5 w-3.5" />
              {student.role}
            </Badge>
            <Badge
              variant="outline"
              className="border-app-border bg-app-surface text-xs text-app-text-muted"
            >
              {student.status}
            </Badge>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-auto"
              onClick={() => onEdit(student)}
            >
              <Edit className="mr-1 h-4 w-4" />
              {dictionary.editStudent}
            </Button>
            <button
              type="button"
              onClick={() => onDelete(student.studentId)}
              disabled={deletingId === student.studentId}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--color-error)_45%,var(--color-border)_55%)] bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)] px-3 text-xs font-semibold uppercase tracking-[0.08em] text-(--color-error) transition-colors hover:bg-[color-mix(in_srgb,var(--color-error-soft)_84%,var(--color-surface)_16%)] hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {dictionary.deleteAction}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
