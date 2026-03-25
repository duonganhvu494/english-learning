"use client";

import { useMemo, useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Plus,
  Trash2,
} from "lucide-react";
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
import { useData } from "@/mock-data/dataContext";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import type { CalendarEvent } from "@/types/types";

type EventFormData = {
  title: string;
  description: string;
  date: string;
  time: string;
  type: CalendarEvent["type"];
};

const EMPTY_EVENT_FORM: EventFormData = {
  title: "",
  description: "",
  date: "",
  time: "",
  type: "Class",
};

const EVENT_COLORS: Record<CalendarEvent["type"], string> = {
  Class: "#3B82F6",
  "Assignment Due": "#EF4444",
  Exam: "#F59E0B",
  Event: "#10B981",
};

export default function ClassCalendarPage() {
  const { dictionary, locale } = useAppSettings();
  const { success: notifySuccess } = useNotification();
  const {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
  } = useData();
  const { classId, classItem } = useClassDetail();
  const classDetailDictionary = dictionary.classDetailPage;
  const localeTag = getLocaleTag(locale);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(EMPTY_EVENT_FORM);

  const classEvents = useMemo(
    () =>
      [...calendarEvents]
        .filter((event) => event.classId === classId)
        .sort(
          (eventA, eventB) =>
            new Date(eventA.date).getTime() - new Date(eventB.date).getTime(),
        ),
    [calendarEvents, classId],
  );

  const upcomingEvents = useMemo(
    () =>
      classEvents.filter((event) => {
        const daysUntil = getDaysUntil(event.date);
        return typeof daysUntil === "number" && daysUntil >= 0;
      }),
    [classEvents],
  );

  const pastEvents = useMemo(
    () =>
      classEvents
        .filter((event) => {
          const daysUntil = getDaysUntil(event.date);
          return typeof daysUntil === "number" && daysUntil < 0;
        })
        .slice(-5)
        .reverse(),
    [classEvents],
  );

  const eventTypeOptions = [
    { value: "Class" as const, label: classDetailDictionary.eventTypeClass },
    {
      value: "Assignment Due" as const,
      label: classDetailDictionary.eventTypeAssignmentDue,
    },
    { value: "Exam" as const, label: classDetailDictionary.eventTypeExam },
    { value: "Event" as const, label: classDetailDictionary.eventTypeEvent },
  ];

  const resetForm = () => {
    setEditingEvent(null);
    setFormData(EMPTY_EVENT_FORM);
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

    const payload = {
      ...formData,
      classId,
      color: EVENT_COLORS[formData.type],
    };

    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, payload);
      notifySuccess(classDetailDictionary.eventUpdatedSuccess);
    } else {
      addCalendarEvent(payload);
      notifySuccess(classDetailDictionary.eventCreatedSuccess);
    }

    handleDialogOpenChange(false);
  };

  const handleEdit = (eventItem: CalendarEvent) => {
    setEditingEvent(eventItem);
    setFormData({
      title: eventItem.title,
      description: eventItem.description,
      date: eventItem.date,
      time: eventItem.time,
      type: eventItem.type,
    });
    setDialogOpen(true);
  };

  const handleDelete = (eventId: string) => {
    if (!window.confirm(classDetailDictionary.eventDeleteConfirm)) {
      return;
    }

    deleteCalendarEvent(eventId);
    notifySuccess(classDetailDictionary.eventDeletedSuccess);
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

  const getEventTypeLabel = (eventType: CalendarEvent["type"]) => {
    if (eventType === "Class") {
      return classDetailDictionary.eventTypeClass;
    }

    if (eventType === "Assignment Due") {
      return classDetailDictionary.eventTypeAssignmentDue;
    }

    if (eventType === "Exam") {
      return classDetailDictionary.eventTypeExam;
    }

    return classDetailDictionary.eventTypeEvent;
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
          {upcomingEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-app-border px-4 py-8 text-center text-app-text-muted">
              <CalendarIcon className="mx-auto mb-3 h-12 w-12" />
              {classDetailDictionary.noUpcomingEvents}
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((eventItem) => {
                const relativeDateLabel = renderRelativeDateLabel(
                  eventItem.date,
                );

                return (
                  <article
                    key={eventItem.id}
                    className="rounded-xl border border-app-border bg-app-surface-2 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-(--color-text-inverse)"
                        style={{ backgroundColor: eventItem.color }}
                      >
                        <CalendarIcon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-app-text">
                            {eventItem.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className="border-app-border bg-app-surface text-xs text-app-text-muted"
                          >
                            {getEventTypeLabel(eventItem.type)}
                          </Badge>
                        </div>

                        <p className="text-sm text-app-text-muted">
                          {eventItem.description}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-app-text-soft">
                          <span className="inline-flex items-center gap-1">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {new Date(eventItem.date).toLocaleDateString(
                              localeTag,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {eventItem.time}
                          </span>
                          {relativeDateLabel ? (
                            <span>{relativeDateLabel}</span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <Button
                          variant="outline"
                          className="h-9 w-9 px-0"
                          onClick={() => handleEdit(eventItem)}
                          aria-label={
                            classDetailDictionary.editEventDialogTitle
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="h-9 w-9 px-0 text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)]"
                          onClick={() => handleDelete(eventItem.id)}
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
          {pastEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-app-border px-4 py-8 text-center text-app-text-muted">
              <CalendarIcon className="mx-auto mb-3 h-12 w-12" />
              {classDetailDictionary.noPastEvents}
            </div>
          ) : (
            <div className="space-y-3">
              {pastEvents.map((eventItem) => (
                <article
                  key={eventItem.id}
                  className="rounded-xl border border-app-border bg-app-surface-2 p-4 opacity-75"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-(--color-text-inverse)"
                      style={{ backgroundColor: eventItem.color }}
                    >
                      <CalendarIcon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-app-text">
                          {eventItem.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className="border-app-border bg-app-surface text-xs text-app-text-muted"
                        >
                          {getEventTypeLabel(eventItem.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-app-text-muted">
                        {eventItem.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-app-text-soft">
                        <span className="inline-flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {new Date(eventItem.date).toLocaleDateString(
                            localeTag,
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {eventItem.time}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="h-9 w-9 shrink-0 px-0 text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)]"
                      onClick={() => handleDelete(eventItem.id)}
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
              {editingEvent
                ? classDetailDictionary.editEventDialogTitle
                : classDetailDictionary.addEventDialogTitle}
            </DialogTitle>
            <DialogDescription>
              {editingEvent
                ? classDetailDictionary.editEventDialogDescription
                : classDetailDictionary.addEventDialogDescription}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="event-title" className="text-app-text">
                  {classDetailDictionary.eventTitleLabel}
                </Label>
                <Input
                  id="event-title"
                  value={formData.title}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder={classDetailDictionary.eventTitlePlaceholder}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="event-description" className="text-app-text">
                  {classDetailDictionary.eventDescriptionLabel}
                </Label>
                <Textarea
                  id="event-description"
                  value={formData.description}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  placeholder={
                    classDetailDictionary.eventDescriptionPlaceholder
                  }
                  rows={4}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="event-date" className="text-app-text">
                    {classDetailDictionary.eventDateLabel}
                  </Label>
                  <Input
                    id="event-date"
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
                  <Label htmlFor="event-time" className="text-app-text">
                    {classDetailDictionary.eventTimeLabel}
                  </Label>
                  <Input
                    id="event-time"
                    value={formData.time}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        time: event.target.value,
                      }))
                    }
                    placeholder={classDetailDictionary.eventTimePlaceholder}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="event-type" className="text-app-text">
                  {classDetailDictionary.eventTypeLabel}
                </Label>
                <select
                  id="event-type"
                  value={formData.type}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: event.target.value as CalendarEvent["type"],
                    }))
                  }
                  className="h-10 rounded-md border border-app-border bg-app-surface px-3 text-sm text-app-text outline-none transition-colors focus:border-(--color-primary) focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-primary)_24%,transparent)]"
                >
                  {eventTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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
                {editingEvent
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
