"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
import { ApiError, sessionsApi } from "@/api";
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
import type { ClassSession } from "@/types/session";

type SessionFormData = {
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
};

const EMPTY_SESSION_FORM: SessionFormData = {
  topic: "",
  date: "",
  startTime: "",
  endTime: "",
};

function formatDateInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeInput(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
}

function buildIsoDateTime(date: string, time: string) {
  if (!date || !time) {
    return null;
  }

  const isoValue = new Date(`${date}T${time}:00`);
  if (Number.isNaN(isoValue.getTime())) {
    return null;
  }

  return isoValue.toISOString();
}

export default function ClassCalendarPage() {
  const { dictionary, locale } = useAppSettings();
  const { success: notifySuccess, error: notifyError } = useNotification();
  const { classId, classItem } = useClassDetail();
  const classDetailDictionary = dictionary.classDetailPage;
  const localeTag = getLocaleTag(locale);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);
  const [formData, setFormData] = useState<SessionFormData>(EMPTY_SESSION_FORM);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!classId) {
      setSessions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await sessionsApi.listClassSessions(classId);
      setSessions(response.result);
    } catch (error) {
      setSessions([]);
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classDetailDictionary.loadCalendarError,
          ),
        );
      } else {
        notifyError(classDetailDictionary.loadCalendarError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    classDetailDictionary.loadCalendarError,
    classId,
    dictionary,
    notifyError,
  ]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  const classSessions = useMemo(
    () =>
      [...sessions].sort(
        (sessionA, sessionB) =>
          new Date(sessionA.timeStart).getTime() -
          new Date(sessionB.timeStart).getTime(),
      ),
    [sessions],
  );

  const upcomingSessions = useMemo(
    () =>
      classSessions.filter((session) => {
        const daysUntil = getDaysUntil(session.timeStart);
        return typeof daysUntil === "number" && daysUntil >= 0;
      }),
    [classSessions],
  );

  const pastSessions = useMemo(
    () =>
      classSessions
        .filter((session) => {
          const daysUntil = getDaysUntil(session.timeStart);
          return typeof daysUntil === "number" && daysUntil < 0;
        })
        .slice(-5)
        .reverse(),
    [classSessions],
  );

  const resetForm = () => {
    setEditingSession(null);
    setFormData(EMPTY_SESSION_FORM);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const timeStart = buildIsoDateTime(formData.date, formData.startTime);
    const timeEnd = buildIsoDateTime(formData.date, formData.endTime);

    if (!timeStart || !timeEnd || new Date(timeEnd) <= new Date(timeStart)) {
      notifyError(classDetailDictionary.eventCreateError);
      return;
    }

    const payload = {
      topic: formData.topic.trim(),
      timeStart,
      timeEnd,
    };

    setIsSubmitting(true);
    try {
      if (editingSession) {
        await sessionsApi.updateSession(editingSession.id, payload);
        notifySuccess(classDetailDictionary.eventUpdatedSuccess);
      } else {
        await sessionsApi.createSession(classId, payload);
        notifySuccess(classDetailDictionary.eventCreatedSuccess);
      }

      await loadSessions();
      handleDialogOpenChange(false);
    } catch (error) {
      const fallback = editingSession
        ? classDetailDictionary.eventUpdateError
        : classDetailDictionary.eventCreateError;

      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(error.details, error.code, dictionary, fallback),
        );
      } else {
        notifyError(fallback);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (session: ClassSession) => {
    setEditingSession(session);
    setFormData({
      topic: session.topic,
      date: formatDateInput(session.timeStart),
      startTime: formatTimeInput(session.timeStart),
      endTime: formatTimeInput(session.timeEnd),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (sessionId: string) => {
    if (!window.confirm(classDetailDictionary.eventDeleteConfirm)) {
      return;
    }

    setDeletingSessionId(sessionId);
    try {
      await sessionsApi.deleteSession(sessionId);
      notifySuccess(classDetailDictionary.eventDeletedSuccess);
      await loadSessions();
    } catch (error) {
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classDetailDictionary.eventDeleteError,
          ),
        );
      } else {
        notifyError(classDetailDictionary.eventDeleteError);
      }
    } finally {
      setDeletingSessionId(null);
    }
  };

  if (!classItem) {
    return null;
  }

  const renderRelativeDateLabel = (date: string) => {
    const daysUntil = getDaysUntil(date);

    if (daysUntil === 0) {
      return classDetailDictionary.todayLabel;
    }

    if (daysUntil === 1) {
      return classDetailDictionary.tomorrowLabel;
    }

    if (typeof daysUntil === "number" && daysUntil > 1) {
      return classDetailDictionary.inDaysLabel.replace(
        "{days}",
        String(daysUntil),
      );
    }

    return "";
  };

  const renderSessionDate = (session: ClassSession) => {
    const startDate = new Date(session.timeStart);
    const endDate = new Date(session.timeEnd);

    return `${startDate.toLocaleDateString(localeTag, {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} • ${startDate.toLocaleTimeString(localeTag, {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${endDate.toLocaleTimeString(localeTag, {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-app-text">
            {classDetailDictionary.calendarTitle}
          </h1>
          <p className="text-app-text-muted">
            {classDetailDictionary.calendarDescription.replace(
              "{name}",
              classItem.className,
            )}
          </p>
        </div>

        <Button className="w-auto" onClick={handleCreateClick}>
          <Plus className="mr-2 h-4 w-4" />
          {classDetailDictionary.addEvent}
        </Button>
      </div>

      <Card className="border-app-border bg-app-surface">
        <CardHeader>
          <CardTitle>{classDetailDictionary.upcomingEventsSection}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-xl border border-dashed border-app-border px-4 py-8 text-center text-app-text-muted">
              {classDetailDictionary.loadingCalendar}
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-app-border px-4 py-8 text-center text-app-text-muted">
              <CalendarIcon className="mx-auto mb-3 h-12 w-12" />
              {classSessions.length === 0
                ? classDetailDictionary.noSessionsForCalendar
                : classDetailDictionary.noUpcomingEvents}
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => {
                const relativeDateLabel = renderRelativeDateLabel(
                  session.timeStart,
                );

                return (
                  <article
                    key={session.id}
                    className="relative rounded-xl border border-app-border bg-app-surface-2 p-4 transition-colors hover:border-(--color-primary)"
                  >
                    <Link
                      href={"/teacher/class/" + classId + "/calendar/" + session.id}
                      className="absolute inset-0 z-10 rounded-xl transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary-soft)_30%,transparent)]"
                      aria-label={session.topic}
                    />
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-(--color-primary) text-(--color-text-inverse)">
                        <CalendarIcon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-app-text">
                            {session.topic}
                          </p>
                          <Badge
                            variant="outline"
                            className="border-app-border bg-app-surface text-xs text-app-text-muted"
                          >
                            {classDetailDictionary.eventTypeClass}
                          </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-app-text-soft">
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {renderSessionDate(session)}
                          </span>
                          {relativeDateLabel ? (
                            <span>{relativeDateLabel}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="relative z-20 flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          className="h-9 w-9 px-0"
                          onClick={() => handleEdit(session)}
                          aria-label={classDetailDictionary.editEventDialogTitle}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-9 w-9 px-0 text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)]"
                          onClick={() => handleDelete(session.id)}
                          disabled={deletingSessionId === session.id}
                          aria-label={classDetailDictionary.eventDeleteConfirm}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-app-border bg-app-surface">
        <CardHeader>
          <CardTitle>{classDetailDictionary.pastEventsSection}</CardTitle>
        </CardHeader>
        <CardContent>
          {pastSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-app-border px-4 py-8 text-center text-app-text-muted">
              <CalendarIcon className="mx-auto mb-3 h-12 w-12" />
              {classDetailDictionary.noPastEvents}
            </div>
          ) : (
            <div className="space-y-3">
              {pastSessions.map((session) => (
                <article
                  key={session.id}
                  className="relative rounded-xl border border-app-border bg-app-surface-2 p-4 opacity-75 transition-colors hover:border-(--color-primary)"
                >
                  <Link
                    href={"/teacher/class/" + classId + "/calendar/" + session.id}
                    className="absolute inset-0 z-10 rounded-xl transition-colors hover:bg-[color-mix(in_srgb,var(--color-primary-soft)_30%,transparent)]"
                    aria-label={session.topic}
                  />
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-app-surface text-app-text">
                      <Clock className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-app-text">
                          {session.topic}
                        </p>
                        <Badge
                          variant="outline"
                          className="border-app-border bg-app-surface text-xs text-app-text-muted"
                        >
                          {classDetailDictionary.eventTypeClass}
                        </Badge>
                      </div>
                      <p className="text-sm text-app-text-soft">
                        {renderSessionDate(session)}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="relative z-20 h-9 w-9 shrink-0 px-0 text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)]"
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingSessionId === session.id}
                      aria-label={classDetailDictionary.eventDeleteConfirm}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-2xl border-app-border bg-app-surface">
          <DialogHeader>
            <DialogTitle>
              {editingSession
                ? classDetailDictionary.editEventDialogTitle
                : classDetailDictionary.addEventDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {editingSession
                ? classDetailDictionary.editEventDialogDescription
                : classDetailDictionary.addEventDialogDescription}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="session-topic" className="text-app-text">
                  {classDetailDictionary.eventTitleLabel}
                </Label>
                <Textarea
                  id="session-topic"
                  value={formData.topic}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      topic: event.target.value,
                    }))
                  }
                  placeholder={classDetailDictionary.eventTitlePlaceholder}
                  rows={2}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="session-date" className="text-app-text">
                    {classDetailDictionary.eventDateLabel}
                  </Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={formData.date}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        date: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="session-start-time" className="text-app-text">
                    {classDetailDictionary.sessionStartTimeLabel}
                  </Label>
                  <Input
                    id="session-start-time"
                    type="time"
                    value={formData.startTime}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        startTime: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="session-end-time" className="text-app-text">
                    {classDetailDictionary.sessionEndTimeLabel}
                  </Label>
                  <Input
                    id="session-end-time"
                    type="time"
                    value={formData.endTime}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        endTime: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="w-auto"
                onClick={() => handleDialogOpenChange(false)}
                disabled={isSubmitting}
              >
                {classDetailDictionary.cancel}
              </Button>
              <Button type="submit" className="w-auto" disabled={isSubmitting}>
                {editingSession
                  ? classDetailDictionary.editEventDialogTitle
                  : classDetailDictionary.addEvent}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
