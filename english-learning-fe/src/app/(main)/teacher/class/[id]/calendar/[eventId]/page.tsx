"use client";

import { use, useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError, sessionsApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { CalendarEventDetailView } from "@/components/teacher/calendar/calendar-event-detail-view";
import { useClassDetail } from "@/components/teacher/class-detail/class-detail-context";
import { getDaysUntil, getLocaleTag } from "@/components/teacher/class-detail/class-detail-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import type { ClassSession } from "@/types/session";

type PageProps = {
  params: Promise<{
    id: string;
    eventId: string;
  }>;
};

type EventFormData = {
  topic: string;
  date: string;
  startTime: string;
  endTime: string;
};

const EMPTY_FORM: EventFormData = {
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

  const value = new Date(`${date}T${time}:00`);
  if (Number.isNaN(value.getTime())) {
    return null;
  }
  return value.toISOString();
}

export default function CalendarEventDetailPage({ params }: PageProps) {
  const { id: classId, eventId } = use(params);
  const router = useRouter();
  const { dictionary, locale } = useAppSettings();
  const classDetailDictionary = dictionary.classDetailPage;
  const localeTag = getLocaleTag(locale);
  const {
    success: notifySuccess,
    error: notifyError,
    info: notifyInfo,
  } = useNotification();
  const { classItem, enrolledStudents } = useClassDetail();

  const [event, setEvent] = useState<ClassSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM);

  const loadEvent = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await sessionsApi.getSessionDetail(eventId);
      const nextEvent = response.result;
      if (nextEvent.classId !== classId) {
        setEvent(null);
      } else {
        setEvent(nextEvent);
      }
    } catch (error) {
      setEvent(null);
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
    eventId,
    notifyError,
  ]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const handleOpenEdit = () => {
    if (!event) {
      return;
    }

    setFormData({
      topic: event.topic,
      date: formatDateInput(event.timeStart),
      startTime: formatTimeInput(event.timeStart),
      endTime: formatTimeInput(event.timeEnd),
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmitEdit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();

    const timeStart = buildIsoDateTime(formData.date, formData.startTime);
    const timeEnd = buildIsoDateTime(formData.date, formData.endTime);
    if (!event || !timeStart || !timeEnd || new Date(timeEnd) <= new Date(timeStart)) {
      notifyError(classDetailDictionary.eventUpdateError);
      return;
    }

    setIsSubmitting(true);
    try {
      await sessionsApi.updateSession(event.id, {
        topic: formData.topic.trim(),
        timeStart,
        timeEnd,
      });
      notifySuccess(classDetailDictionary.eventUpdatedSuccess);
      setIsEditDialogOpen(false);
      await loadEvent();
    } catch (error) {
      if (error instanceof ApiError) {
        notifyError(
          translateApiMessage(
            error.details,
            error.code,
            dictionary,
            classDetailDictionary.eventUpdateError,
          ),
        );
      } else {
        notifyError(classDetailDictionary.eventUpdateError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event) {
      return;
    }
    if (!window.confirm(classDetailDictionary.eventDeleteConfirm)) {
      return;
    }

    try {
      await sessionsApi.deleteSession(event.id);
      notifySuccess(classDetailDictionary.eventDeletedSuccess);
      router.replace(`/teacher/class/${classId}/calendar`);
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
    }
  };

  const handleSendReminder = () => {
    notifyInfo(
      classDetailDictionary.comingSoonTitle,
      classDetailDictionary.sendReminderSoonMessage,
    );
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notifySuccess(
        classDetailDictionary.copiedTitle,
        classDetailDictionary.eventLinkCopiedMessage,
      );
    } catch {
      notifyError(
        classDetailDictionary.copyFailedTitle,
        classDetailDictionary.copyEventLinkFailedMessage,
      );
    }
  };

  if (!classItem) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="border-app-border bg-app-surface">
        <CardContent className="py-14 text-center text-app-text-muted">
          {classDetailDictionary.loadingCalendar}
        </CardContent>
      </Card>
    );
  }

  if (!event) {
    return (
      <Card className="border-app-border bg-app-surface">
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-xl font-semibold text-app-text">
            {classDetailDictionary.eventNotFound}
          </p>
          <div className="mx-auto w-full max-w-xs">
            <Link href={`/teacher/class/${classId}/calendar`}>
              <Button variant="outline" className="w-full">
                {classDetailDictionary.backToClasses}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysUntil = getDaysUntil(event.timeStart);
  const isPast = typeof daysUntil === "number" && daysUntil < 0;

  return (
    <CalendarEventDetailView
      classId={classId}
      className={classItem.className}
      enrolledStudentCount={enrolledStudents.length}
      event={event}
      localeTag={localeTag}
      classDetailDictionary={classDetailDictionary}
      deleteLabel={dictionary.classesPage.deleteClass}
      isPast={isPast}
      daysUntil={daysUntil}
      formData={formData}
      isEditDialogOpen={isEditDialogOpen}
      isSubmitting={isSubmitting}
      onBack={() => router.back()}
      onOpenEdit={handleOpenEdit}
      onDelete={handleDelete}
      onSendReminder={handleSendReminder}
      onCopyLink={handleCopyLink}
      onEditDialogOpenChange={setIsEditDialogOpen}
      onFormChange={(patch) =>
        setFormData((prev) => ({
          ...prev,
          ...patch,
        }))
      }
      onSubmitEdit={handleSubmitEdit}
    />
  );
}
