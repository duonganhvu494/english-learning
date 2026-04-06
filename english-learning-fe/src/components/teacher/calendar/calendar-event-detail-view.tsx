"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Calendar as CalendarIcon,
  Clock,
  Edit,
  Link2,
  Trash2,
  Users,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { Dictionary } from "@/i18n/types";
import type { ClassSession } from "@/types/session";

type CalendarEventDetailViewProps = {
  classId: string;
  className: string;
  enrolledStudentCount: number;
  event: ClassSession;
  localeTag: string;
  classDetailDictionary: Dictionary["classDetailPage"];
  deleteLabel: string;
  isPast: boolean;
  daysUntil: number | null;
  formData: {
    topic: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  isEditDialogOpen: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onOpenEdit: () => void;
  onDelete: () => void;
  onSendReminder: () => void;
  onCopyLink: () => void;
  onEditDialogOpenChange: (open: boolean) => void;
  onFormChange: (patch: {
    topic?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
  }) => void;
  onSubmitEdit: (event: FormEvent<HTMLFormElement>) => void;
};

const EVENT_COLOR = "#3B82F6";

export function CalendarEventDetailView({
  classId,
  className,
  enrolledStudentCount,
  event,
  localeTag,
  classDetailDictionary,
  deleteLabel,
  isPast,
  daysUntil,
  formData,
  isEditDialogOpen,
  isSubmitting,
  onBack,
  onOpenEdit,
  onDelete,
  onSendReminder,
  onCopyLink,
  onEditDialogOpenChange,
  onFormChange,
  onSubmitEdit,
}: CalendarEventDetailViewProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="outline" className="w-auto" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {classDetailDictionary.calendarTitle}
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-lg text-(--color-text-inverse)"
            style={{ backgroundColor: EVENT_COLOR }}
          >
            <CalendarIcon className="h-8 w-8" />
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-semibold text-app-text">{event.topic}</h1>
              {isPast ? (
                <Badge variant="outline">
                  {classDetailDictionary.pastEventLabel}
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-app-text-muted">
              <Badge variant="secondary">{classDetailDictionary.eventTypeClass}</Badge>
              <span>{className}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onOpenEdit}>
            <Edit className="mr-2 h-4 w-4" />
            {classDetailDictionary.editEventDialogTitle}
          </Button>
          <Button
            variant="outline"
            className="text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_75%,var(--color-surface)_25%)]"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleteLabel}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-app-border bg-app-surface">
            <CardHeader>
              <CardTitle>{classDetailDictionary.eventDetailsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium text-app-text">
                  {classDetailDictionary.eventDescriptionLabel}
                </h3>
                <p className="text-app-text-muted">{classDetailDictionary.noDescription}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="mt-0.5 h-5 w-5 text-app-text-soft" />
                  <div>
                    <p className="mb-1 text-sm text-app-text-muted">
                      {classDetailDictionary.eventDateLabel}
                    </p>
                    <p className="font-medium text-app-text">
                      {new Date(event.timeStart).toLocaleDateString(localeTag, {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 text-app-text-soft" />
                  <div>
                    <p className="mb-1 text-sm text-app-text-muted">
                      {classDetailDictionary.eventTimeLabel}
                    </p>
                    <p className="font-medium text-app-text">
                      {new Date(event.timeStart).toLocaleTimeString(localeTag, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" - "}
                      {new Date(event.timeEnd).toLocaleTimeString(localeTag, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {!isPast && typeof daysUntil === "number" ? (
                <div className="rounded-lg border border-[color-mix(in_srgb,var(--color-info)_30%,var(--color-border)_70%)] bg-[color-mix(in_srgb,var(--color-info-soft)_75%,var(--color-surface)_25%)] p-4">
                  <p className="text-sm text-(--color-info)">
                    {daysUntil === 0
                      ? classDetailDictionary.todayLabel
                      : daysUntil === 1
                        ? classDetailDictionary.tomorrowLabel
                        : classDetailDictionary.inDaysLabel.replace(
                            "{days}",
                            String(daysUntil),
                          )}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-app-border bg-app-surface">
            <CardHeader>
              <CardTitle>{classDetailDictionary.classInformationTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-app-text-soft" />
                <div>
                  <p className="text-sm text-app-text-muted">
                    {classDetailDictionary.studentsLabel}
                  </p>
                  <p className="font-medium text-app-text">
                    {enrolledStudentCount} {classDetailDictionary.enrolledLabel}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-sm text-app-text-muted">
                  {classDetailDictionary.quickActionsTitle}
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="outline" size="sm" className="justify-start" onClick={onSendReminder}>
                    <Bell className="mr-2 h-4 w-4" />
                    {classDetailDictionary.sendReminder}
                  </Button>
                  <Button variant="outline" size="sm" className="justify-start" onClick={onCopyLink}>
                    <Link2 className="mr-2 h-4 w-4" />
                    {classDetailDictionary.copyEventLink}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-app-border bg-app-surface">
            <CardHeader>
              <CardTitle>{classDetailDictionary.quickLinksTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/teacher/class/${classId}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  {classDetailDictionary.viewClass}
                </Button>
              </Link>
              <Link href={`/teacher/class/${classId}/calendar`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {classDetailDictionary.allEvents}
                </Button>
              </Link>
              <Link href={`/teacher/class/${classId}/students`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  {classDetailDictionary.viewStudents} ({enrolledStudentCount})
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-app-border bg-app-surface">
            <CardHeader>
              <CardTitle>{classDetailDictionary.eventTypeTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${EVENT_COLOR}20` }}
                >
                  <div className="h-6 w-6 rounded-full" style={{ backgroundColor: EVENT_COLOR }} />
                </div>
                <div>
                  <p className="font-medium text-app-text">{classDetailDictionary.eventTypeClass}</p>
                  <p className="text-sm text-app-text-muted">
                    {classDetailDictionary.regularClassSession}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={onEditDialogOpenChange}>
        <DialogContent className="max-w-md border-app-border bg-app-surface">
          <DialogHeader>
            <DialogTitle>{classDetailDictionary.editEventDialogTitle}</DialogTitle>
            <DialogDescription>{classDetailDictionary.editEventDialogDescription}</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmitEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="topic">{classDetailDictionary.eventTitleLabel}</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(event) => onFormChange({ topic: event.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="date">{classDetailDictionary.eventDateLabel}</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(event) => onFormChange({ date: event.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start">{classDetailDictionary.sessionStartTimeLabel}</Label>
                  <Input
                    id="start"
                    type="time"
                    value={formData.startTime}
                    onChange={(event) => onFormChange({ startTime: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="end">{classDetailDictionary.sessionEndTimeLabel}</Label>
                <Input
                  id="end"
                  type="time"
                  value={formData.endTime}
                  onChange={(event) => onFormChange({ endTime: event.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onEditDialogOpenChange(false)}
                disabled={isSubmitting}
              >
                {classDetailDictionary.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {classDetailDictionary.editEventDialogTitle}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
