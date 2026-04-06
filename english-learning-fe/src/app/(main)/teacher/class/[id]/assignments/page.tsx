"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Calendar, FileText, Plus, Trash2 } from "lucide-react";
import { ApiError, assignmentsApi, sessionsApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { useClassDetail } from "@/components/teacher/class-detail/class-detail-context";
import {
  getDaysUntil,
  getLocaleTag,
} from "@/components/teacher/class-detail/class-detail-utils";
import { Label } from "@/components/ui/label";
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
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import type {
  AssignmentType,
  SessionAssignment,
} from "@/types/assignment";
import type { ClassSession } from "@/types/session";

type AssignmentFormData = {
  sessionId: string;
  title: string;
  description: string;
  type: AssignmentType;
  timeStart: string;
  timeEnd: string;
};

const EMPTY_ASSIGNMENT_FORM: AssignmentFormData = {
  sessionId: "",
  title: "",
  description: "",
  type: "manual",
  timeStart: "",
  timeEnd: "",
};

function toLocalDateTimeInput(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toIsoDateTime(localDateTime: string) {
  if (!localDateTime) {
    return null;
  }

  const value = new Date(localDateTime);
  if (Number.isNaN(value.getTime())) {
    return null;
  }

  return value.toISOString();
}

function getDefaultDateRange() {
  const now = new Date();
  now.setSeconds(0, 0);
  const end = new Date(now);
  end.setHours(end.getHours() + 1);

  return {
    timeStart: toLocalDateTimeInput(now.toISOString()),
    timeEnd: toLocalDateTimeInput(end.toISOString()),
  };
}

export default function ClassAssignmentsPage() {
  const { dictionary, locale } = useAppSettings();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { classId, classItem } = useClassDetail();
  const classDetailDictionary = dictionary.classDetailPage;
  const localeTag = getLocaleTag(locale);

  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [assignments, setAssignments] = useState<SessionAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<AssignmentFormData>(
    EMPTY_ASSIGNMENT_FORM,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(
    null,
  );

  const loadAssignments = useCallback(async () => {
    if (!classId) {
      setSessions([]);
      setAssignments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const sessionResponse = await sessionsApi.listClassSessions(classId);
      const classSessions = sessionResponse.result;
      setSessions(classSessions);

      if (classSessions.length === 0) {
        setAssignments([]);
        return;
      }

      const assignmentResponses = await Promise.all(
        classSessions.map((session) =>
          assignmentsApi.listSessionAssignments(session.id),
        ),
      );

      const classAssignments = assignmentResponses.flatMap(
        (response) => response.result,
      );
      setAssignments(classAssignments);
    } catch (error) {
      setSessions([]);
      setAssignments([]);
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classDetailDictionary.loadAssignmentsError,
          ),
        );
      } else {
        notifyError(classDetailDictionary.loadAssignmentsError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    classDetailDictionary.loadAssignmentsError,
    classId,
    dictionary,
    notifyError,
  ]);

  useEffect(() => {
    void loadAssignments();
  }, [loadAssignments]);

  const sessionMap = useMemo(
    () => new Map(sessions.map((session) => [session.id, session])),
    [sessions],
  );

  const sortedAssignments = useMemo(
    () =>
      [...assignments].sort(
        (assignmentA, assignmentB) =>
          new Date(assignmentA.timeStart).getTime() -
          new Date(assignmentB.timeStart).getTime(),
      ),
    [assignments],
  );

  const assignmentGroups = useMemo(
    () => ({
      open: sortedAssignments.filter((assignment) => assignment.status === "open"),
      upcoming: sortedAssignments.filter(
        (assignment) => assignment.status === "upcoming",
      ),
      closed: sortedAssignments.filter(
        (assignment) => assignment.status === "closed",
      ),
    }),
    [sortedAssignments],
  );

  const resetForm = useCallback(() => {
    const defaultRange = getDefaultDateRange();

    setFormData({
      ...EMPTY_ASSIGNMENT_FORM,
      sessionId: sessions[0]?.id ?? "",
      timeStart: defaultRange.timeStart,
      timeEnd: defaultRange.timeEnd,
    });
  }, [sessions]);

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      resetForm();
    }
  };

  const handleCreateAssignment = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!formData.sessionId) {
      notifyError(classDetailDictionary.noSessionsForAssignments);
      return;
    }

    const timeStartIso = toIsoDateTime(formData.timeStart);
    const timeEndIso = toIsoDateTime(formData.timeEnd);

    if (
      !timeStartIso ||
      !timeEndIso ||
      new Date(timeEndIso) <= new Date(timeStartIso)
    ) {
      notifyError(classDetailDictionary.assignmentCreateError);
      return;
    }

    setIsSubmitting(true);
    try {
      await assignmentsApi.createAssignment(formData.sessionId, {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        type: formData.type,
        timeStart: timeStartIso,
        timeEnd: timeEndIso,
      });

      notifySuccess(classDetailDictionary.assignmentCreatedSuccess);
      setDialogOpen(false);
      await loadAssignments();
    } catch (error) {
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classDetailDictionary.assignmentCreateError,
          ),
        );
      } else {
        notifyError(classDetailDictionary.assignmentCreateError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!window.confirm(classDetailDictionary.assignmentDeleteConfirm)) {
      return;
    }

    setDeletingAssignmentId(assignmentId);
    try {
      await assignmentsApi.deleteAssignment(assignmentId);
      notifySuccess(classDetailDictionary.assignmentDeletedSuccess);
      await loadAssignments();
    } catch (error) {
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classDetailDictionary.assignmentDeleteError,
          ),
        );
      } else {
        notifyError(classDetailDictionary.assignmentDeleteError);
      }
    } finally {
      setDeletingAssignmentId(null);
    }
  };

  const getAssignmentTypeLabel = (type: AssignmentType) => {
    if (type === "quiz") {
      return classDetailDictionary.assignmentTypeQuiz;
    }

    return classDetailDictionary.assignmentTypeManual;
  };

  const getAssignmentStatusLabel = (status: SessionAssignment["status"]) => {
    if (status === "open") {
      return classDetailDictionary.assignmentStatusOpen;
    }

    if (status === "upcoming") {
      return classDetailDictionary.assignmentStatusUpcoming;
    }

    return classDetailDictionary.assignmentStatusClosed;
  };

  const getAssignmentStatusClassName = (status: SessionAssignment["status"]) => {
    if (status === "open") {
      return "border-[color-mix(in_srgb,var(--color-success)_35%,var(--color-border)_65%)] bg-[color-mix(in_srgb,var(--color-success-soft)_75%,var(--color-surface)_25%)] text-(--color-success)";
    }

    if (status === "upcoming") {
      return "border-[color-mix(in_srgb,var(--color-warning)_35%,var(--color-border)_65%)] bg-[color-mix(in_srgb,var(--color-warning-soft)_75%,var(--color-surface)_25%)] text-(--color-warning)";
    }

    return "border-app-border bg-app-surface-2 text-app-text-muted";
  };

  const renderDueLabel = (timeEnd: string) => {
    const daysUntil = getDaysUntil(timeEnd);

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

  const renderAssignmentCard = (assignment: SessionAssignment) => {
    const session = sessionMap.get(assignment.sessionId);

    return (
      <Card
        key={assignment.id}
        className="border-app-border bg-app-surface transition-colors hover:border-(--color-primary)"
      >
        <CardContent className="relative space-y-4 p-6">
          <Link
            href={"/teacher/class/" + classId + "/assignments/" + assignment.id}
            className="absolute inset-0 z-10 rounded-xl transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary-soft)_30%,transparent)]"
            aria-label={assignment.title}
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-app-text">
                  {assignment.title}
                </p>
                <Badge
                  variant="outline"
                  className="border-app-border bg-app-surface text-xs text-app-text-muted"
                >
                  {getAssignmentTypeLabel(assignment.type)}
                </Badge>
                <Badge
                  variant="outline"
                  className={getAssignmentStatusClassName(assignment.status)}
                >
                  {getAssignmentStatusLabel(assignment.status)}
                </Badge>
              </div>

              {assignment.description ? (
                <p className="text-sm text-app-text-muted">
                  {assignment.description}
                </p>
              ) : null}

              <div className="mt-3 space-y-1 text-sm text-app-text-soft">
                <p className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(assignment.timeStart).toLocaleString(localeTag, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(assignment.timeEnd).toLocaleString(localeTag, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {session ? (
                  <p>
                    {classDetailDictionary.assignmentSessionLabel}: {session.topic}
                  </p>
                ) : null}
                <p>{renderDueLabel(assignment.timeEnd)}</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="relative z-20 h-9 w-9 shrink-0 px-0 text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)]"
              onClick={() => handleDeleteAssignment(assignment.id)}
              disabled={deletingAssignmentId === assignment.id}
              aria-label={classDetailDictionary.assignmentDeleteConfirm}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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

        <Button
          className="w-auto"
          onClick={() => handleDialogOpenChange(true)}
          disabled={sessions.length === 0}
        >
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
              {assignments.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-app-text-muted">
              {classDetailDictionary.assignmentStatusOpen}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-app-text">
              {assignmentGroups.open.length}
            </p>
          </CardContent>
        </Card>

        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-app-text-muted">
              {classDetailDictionary.assignmentStatusUpcoming}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-app-text">
              {assignmentGroups.upcoming.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card className="border-app-border bg-app-surface">
          <CardContent className="py-14 text-center text-app-text-muted">
            {classDetailDictionary.loadingAssignments}
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card className="border-app-border bg-app-surface px-6 py-12">
          <CardContent className="p-0 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-app-text-soft" />
            <h3 className="mb-2 text-xl font-medium text-app-text">
              {classDetailDictionary.noAssignmentsYet}
            </h3>
            <p className="text-app-text-muted">
              {classDetailDictionary.noSessionsForAssignments}
            </p>
          </CardContent>
        </Card>
      ) : assignments.length === 0 ? (
        <Card className="border-app-border bg-app-surface px-6 py-12">
          <CardContent className="p-0 text-center">
            <FileText className="mx-auto mb-4 h-16 w-16 text-app-text-soft" />
            <h3 className="mb-2 text-xl font-medium text-app-text">
              {classDetailDictionary.noAssignmentsYet}
            </h3>
            <p className="mb-4 text-app-text-muted">
              {classDetailDictionary.noAssignmentsFullHint}
            </p>
            <Button
              className="mx-auto w-auto"
              onClick={() => handleDialogOpenChange(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {classDetailDictionary.createFirstAssignment}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {sortedAssignments.map(renderAssignmentCard)}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl border-app-border bg-app-surface">
          <DialogHeader>
            <DialogTitle>{classDetailDictionary.createAssignmentTitle}</DialogTitle>
            <DialogDescription>
              {classDetailDictionary.createAssignmentDescription}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAssignment}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="assignment-session" className="text-app-text">
                  {classDetailDictionary.assignmentSessionLabel}
                </Label>
                <select
                  id="assignment-session"
                  value={formData.sessionId}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      sessionId: event.target.value,
                    }))
                  }
                  className="h-10 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition-colors focus:border-(--color-primary) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
                  required
                >
                  <option value="">
                    {classDetailDictionary.assignmentSessionPlaceholder}
                  </option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.topic}
                    </option>
                  ))}
                </select>
              </div>

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
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label
                    htmlFor="assignment-start-time"
                    className="text-app-text"
                  >
                    {classDetailDictionary.assignmentStartTimeLabel}
                  </Label>
                  <Input
                    id="assignment-start-time"
                    type="datetime-local"
                    value={formData.timeStart}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        timeStart: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="assignment-end-time" className="text-app-text">
                    {classDetailDictionary.assignmentEndTimeLabel}
                  </Label>
                  <Input
                    id="assignment-end-time"
                    type="datetime-local"
                    value={formData.timeEnd}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        timeEnd: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="assignment-type" className="text-app-text">
                  {classDetailDictionary.assignmentTypeLabel}
                </Label>
                <select
                  id="assignment-type"
                  value={formData.type}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: event.target.value as AssignmentType,
                    }))
                  }
                  className="h-10 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition-colors focus:border-(--color-primary) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
                >
                  <option value="manual">
                    {classDetailDictionary.assignmentTypeManual}
                  </option>
                  <option value="quiz">
                    {classDetailDictionary.assignmentTypeQuiz}
                  </option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="w-auto"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                {classDetailDictionary.cancel}
              </Button>
              <Button type="submit" className="w-auto" disabled={isSubmitting}>
                {classDetailDictionary.createAssignment}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
