"use client";

import { useMemo, useState } from "react";
import { Award, Calendar, Edit, FileText, Plus, Trash2 } from "lucide-react";
import { useClassDetail } from "@/components/teacher/class-detail/class-detail-context";
import {
  getDaysUntil,
  getLocaleTag,
} from "@/components/teacher/class-detail/class-detail-utils";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/teacher/dashboard/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useData } from "@/mock-data/dataContext";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import type { Assignment } from "@/types/types";

type AssignmentFormData = {
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  status: Assignment["status"];
};

const EMPTY_ASSIGNMENT_FORM: AssignmentFormData = {
  title: "",
  description: "",
  dueDate: "",
  totalPoints: 100,
  status: "Draft",
};

export default function ClassAssignmentsPage() {
  const { dictionary, locale } = useAppSettings();
  const { success: notifySuccess } = useNotification();
  const { assignments, addAssignment, updateAssignment, deleteAssignment } =
    useData();
  const { classId, classItem, enrolledStudents } = useClassDetail();
  const classDetailDictionary = dictionary.classDetailPage;
  const localeTag = getLocaleTag(locale);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null,
  );
  const [formData, setFormData] = useState<AssignmentFormData>(
    EMPTY_ASSIGNMENT_FORM,
  );

  const classAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.classId === classId),
    [assignments, classId],
  );

  const publishedAssignments = useMemo(
    () =>
      classAssignments.filter(
        (assignment) => assignment.status === "Published",
      ),
    [classAssignments],
  );

  const draftAssignments = useMemo(
    () =>
      classAssignments.filter((assignment) => assignment.status === "Draft"),
    [classAssignments],
  );

  const resetForm = () => {
    setEditingAssignment(null);
    setFormData(EMPTY_ASSIGNMENT_FORM);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const handleCreateClick = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingAssignment) {
      updateAssignment(editingAssignment.id, {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        totalPoints: formData.totalPoints,
        status: formData.status,
      });
      notifySuccess(classDetailDictionary.assignmentUpdatedSuccess);
    } else {
      addAssignment({
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        totalPoints: formData.totalPoints,
        status: formData.status,
        classId,
        submissions: enrolledStudents.map((student) => ({
          studentId: student.studentId,
          status: "Not Submitted",
        })),
      });
      notifySuccess(classDetailDictionary.assignmentCreatedSuccess);
    }

    handleDialogOpenChange(false);
  };

  const handleEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      totalPoints: assignment.totalPoints,
      status: assignment.status,
    });
    setDialogOpen(true);
  };

  const handleDelete = (assignmentId: string) => {
    if (!window.confirm(classDetailDictionary.assignmentDeleteConfirm)) {
      return;
    }

    deleteAssignment(assignmentId);
    notifySuccess(classDetailDictionary.assignmentDeletedSuccess);
  };

  const renderDueLabel = (dueDate: string) => {
    const daysUntil = getDaysUntil(dueDate);

    if (daysUntil === 0) {
      return classDetailDictionary.dueToday;
    }

    if (typeof daysUntil === "number" && daysUntil > 0) {
      return `${classDetailDictionary.dueIn} ${daysUntil} ${
        daysUntil === 1 ? classDetailDictionary.day : classDetailDictionary.days
      }`;
    }

    if (typeof daysUntil === "number" && daysUntil < 0) {
      return classDetailDictionary.overdueLabel.replace(
        "{days}",
        String(Math.abs(daysUntil)),
      );
    }

    return "";
  };

  const renderAssignmentCard = (assignment: Assignment) => {
    const submittedCount = assignment.submissions.filter(
      (submission) => submission.status !== "Not Submitted",
    ).length;
    const gradedCount = assignment.submissions.filter(
      (submission) => submission.status === "Graded",
    ).length;
    const totalStudents = enrolledStudents.length;
    const submissionRate =
      totalStudents > 0
        ? Math.round((submittedCount / totalStudents) * 100)
        : 0;
    const dueLabel = renderDueLabel(assignment.dueDate);

    return (
      <Card
        key={assignment.id}
        className="border-app-border bg-app-surface transition-shadow hover:shadow-md"
      >
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-app-text">
                  {assignment.title}
                </h3>
                <Badge
                  variant="outline"
                  className="border-app-border bg-app-surface text-xs text-app-text-muted"
                >
                  {assignment.status === "Published"
                    ? classDetailDictionary.assignmentStatusPublished
                    : assignment.status === "Draft"
                      ? classDetailDictionary.assignmentStatusDraft
                      : classDetailDictionary.unknownStatus}
                </Badge>
              </div>

              <p className="text-sm text-app-text-muted">
                {assignment.description}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-app-text-soft">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {classDetailDictionary.dueDatePrefix}:{" "}
                  {new Date(assignment.dueDate).toLocaleDateString(localeTag, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  {assignment.totalPoints} {classDetailDictionary.pointsLabel}
                </span>
                {dueLabel ? <span>{dueLabel}</span> : null}
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <Button
                variant="outline"
                className="h-9 w-9 px-0"
                onClick={() => handleEdit(assignment)}
                aria-label={classDetailDictionary.editAssignmentTitle}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="h-9 w-9 px-0 text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)]"
                onClick={() => handleDelete(assignment.id)}
                aria-label={classDetailDictionary.assignmentDeleteConfirm}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-3 border-t border-app-border pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-app-text-muted">
                {classDetailDictionary.submissionProgress}
              </span>
              <span className="font-medium text-app-text">
                {submittedCount}/{totalStudents}{" "}
                {classDetailDictionary.submittedLabel} ({submissionRate}%)
              </span>
            </div>
            <Progress value={submissionRate} className="h-2" />
            <div className="flex items-center justify-between text-sm text-app-text-muted">
              <span>
                {classDetailDictionary.gradedLabel}: {gradedCount}/
                {totalStudents}
              </span>
              <span>
                {classDetailDictionary.pendingLabel}:{" "}
                {Math.max(submittedCount - gradedCount, 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!classItem) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-app-text">
            {classDetailDictionary.assignmentsTitle}
          </h1>
          <p className="text-app-text-muted">
            {classDetailDictionary.assignmentsDescription.replace(
              "{name}",
              classItem.className,
            )}
          </p>
        </div>

        <Button className="w-auto" onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          {classDetailDictionary.createAssignment}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-app-text-muted">
              {classDetailDictionary.totalAssignments}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-app-text">
              {classAssignments.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-app-text-muted">
              {classDetailDictionary.assignmentStatusPublished}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-app-text">
              {publishedAssignments.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-app-text-muted">
              {classDetailDictionary.assignmentStatusDraft}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-app-text">
              {draftAssignments.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {publishedAssignments.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-app-text">
            {classDetailDictionary.publishedAssignments}
          </h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {publishedAssignments.map(renderAssignmentCard)}
          </div>
        </section>
      ) : null}

      {draftAssignments.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-app-text">
            {classDetailDictionary.draftAssignments}
          </h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {draftAssignments.map(renderAssignmentCard)}
          </div>
        </section>
      ) : null}

      {classAssignments.length === 0 ? (
        <Card className="border-app-border bg-app-surface px-6 py-12">
          <CardContent className="p-0 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-app-text-soft" />
            <h3 className="mb-2 text-xl font-medium text-app-text">
              {classDetailDictionary.noAssignmentsYet}
            </h3>
            <p className="mb-4 text-app-text-muted">
              {classDetailDictionary.noAssignmentsFullHint}
            </p>
            <Button className="mx-auto w-auto" onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              {classDetailDictionary.createFirstAssignment}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl border-app-border bg-app-surface">
          <DialogHeader>
            <DialogTitle>
              {editingAssignment
                ? classDetailDictionary.editAssignmentTitle
                : classDetailDictionary.createAssignmentTitle}
            </DialogTitle>
            <DialogDescription>
              {editingAssignment
                ? classDetailDictionary.editAssignmentDescription
                : classDetailDictionary.createAssignmentDescription}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="assignment-title" className="text-app-text">
                  {classDetailDictionary.assignmentTitleLabel}
                </Label>
                <Input
                  id="assignment-title"
                  value={formData.title}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder={classDetailDictionary.assignmentTitlePlaceholder}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="assignment-description"
                  className="text-app-text"
                >
                  {classDetailDictionary.assignmentDescriptionLabel}
                </Label>
                <Textarea
                  id="assignment-description"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder={
                    classDetailDictionary.assignmentDescriptionPlaceholder
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label
                    htmlFor="assignment-due-date"
                    className="text-app-text"
                  >
                    {classDetailDictionary.assignmentDueDateLabel}
                  </Label>
                  <Input
                    id="assignment-due-date"
                    type="date"
                    value={formData.dueDate}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        dueDate: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label
                    htmlFor="assignment-total-points"
                    className="text-app-text"
                  >
                    {classDetailDictionary.assignmentPointsLabel}
                  </Label>
                  <Input
                    id="assignment-total-points"
                    type="number"
                    min={0}
                    value={formData.totalPoints}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        totalPoints: Number(event.target.value) || 0,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assignment-status" className="text-app-text">
                  {classDetailDictionary.assignmentStatusLabel}
                </Label>
                <select
                  id="assignment-status"
                  value={formData.status}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: event.target.value as Assignment["status"],
                    }))
                  }
                  className="h-10 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition-colors focus:border-(--color-primary) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
                >
                  <option value="Draft">
                    {classDetailDictionary.assignmentStatusDraft}
                  </option>
                  <option value="Published">
                    {classDetailDictionary.assignmentStatusPublished}
                  </option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="w-auto"
                onClick={() => handleDialogOpenChange(false)}
              >
                {classDetailDictionary.cancel}
              </Button>
              <Button type="submit" className="w-auto">
                {editingAssignment
                  ? classDetailDictionary.editAssignmentTitle
                  : classDetailDictionary.createAssignment}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
