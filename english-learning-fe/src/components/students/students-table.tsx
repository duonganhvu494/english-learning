"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Mail, Trash2 } from "lucide-react";
import { getInitials } from "@/utils/get-initials";
import type { StudentItem, StudentsDictionary } from "./types";

type StudentsTableProps = {
  students: StudentItem[];
  deletingId: string | null;
  dictionary: StudentsDictionary;
  onEdit: (student: StudentItem) => void;
  onDelete: (studentId: string) => void;
};

export function StudentsTable({
  students,
  deletingId,
  dictionary,
  onEdit,
  onDelete,
}: StudentsTableProps) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="border-app-border">
            <TableHead className="px-4 text-app-text">
              {dictionary.tableStudent}
            </TableHead>
            <TableHead className="px-4 text-app-text">
              {dictionary.tableUserName}
            </TableHead>
            <TableHead className="px-4 text-app-text">
              {dictionary.tableEmail}
            </TableHead>
            <TableHead className="px-4 text-app-text">
              {dictionary.tableRole}
            </TableHead>
            <TableHead className="px-4 text-app-text">
              {dictionary.tableStatus}
            </TableHead>
            <TableHead className="px-4 text-right text-app-text">
              {dictionary.tableActions}
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.studentId}
              className="border-app-border hover:bg-app-surface-2"
            >
              <TableCell className="px-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-sm font-semibold text-(--color-text-inverse)">
                    {getInitials(student.fullName, "S")}
                  </div>
                  <p className="truncate font-medium text-app-text">
                    {student.fullName}
                  </p>
                </div>
              </TableCell>

              <TableCell className="px-4 text-app-text-muted">
                @{student.userName}
              </TableCell>

              <TableCell className="px-4 text-app-text-muted">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="max-w-55 truncate">{student.email}</span>
                </div>
              </TableCell>

              <TableCell className="px-4 text-app-text-muted">
                {student.role}
              </TableCell>

              <TableCell className="px-4">
                <Badge
                  variant="outline"
                  className="border-app-border bg-app-surface-2 text-xs text-app-text-muted"
                >
                  {student.status}
                </Badge>
              </TableCell>

              <TableCell className="px-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(student)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-app-border bg-app-surface text-app-text-muted transition-colors hover:bg-app-surface-2 hover:text-app-text hover:cursor-pointer"
                    aria-label={dictionary.editAction}
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(student.studentId)}
                    disabled={deletingId === student.studentId}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--color-error)_45%,var(--color-border)_55%)] bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)] text-(--color-error) transition-colors hover:bg-[color-mix(in_srgb,var(--color-error-soft)_84%,var(--color-surface)_16%)] hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                    aria-label={dictionary.deleteAction}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
