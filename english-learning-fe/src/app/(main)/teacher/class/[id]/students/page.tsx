"use client";

import { useMemo, useState } from "react";
import { Mail, Plus, Search, UserMinus, Users } from "lucide-react";
import { useClassDetail } from "@/components/teacher/class-detail/class-detail-context";
import {
  EMPTY_STUDENT_FORM,
  type StudentFormData,
} from "@/components/teacher/students/types";
import { buildClassStudentMetric } from "@/components/teacher/class-detail/class-detail-utils";
import { Progress } from "@/components/teacher/dashboard/progress";
import { useData } from "@/mock-data/dataContext";
import { useAppSettings } from "@/providers/app-settings-provider";
import { getInitials } from "@/utils/get-initials";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ClassStudentsPage() {
  const { dictionary } = useAppSettings();
  const { assignments } = useData();
  const {
    classId,
    classItem,
    enrolledStudents,
    availableStudents,
    enrollStudents,
    createStudentForClass,
    unenrollStudent,
  } = useClassDetail();
  const classDetailDictionary = dictionary.classDetailPage;
  const studentsDictionary = dictionary.studentsPage;

  const [searchQuery, setSearchQuery] = useState("");
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentFormData, setStudentFormData] =
    useState<StudentFormData>(EMPTY_STUDENT_FORM);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(
    null,
  );

  const classAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.classId === classId),
    [assignments, classId],
  );

  const metricByStudentId = useMemo(() => {
    return new Map(
      enrolledStudents.map((student) => [
        student.studentId,
        buildClassStudentMetric(student.studentId, classAssignments),
      ]),
    );
  }, [classAssignments, enrolledStudents]);

  const filteredStudents = useMemo(
    () =>
      enrolledStudents.filter((student) => {
        const query = searchQuery.toLowerCase();
        return (
          student.fullName.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query)
        );
      }),
    [enrolledStudents, searchQuery],
  );

  const averageProgress = useMemo(() => {
    if (enrolledStudents.length === 0) {
      return 0;
    }

    const total = enrolledStudents.reduce((sum, student) => {
      return sum + (metricByStudentId.get(student.studentId)?.progress ?? 0);
    }, 0);

    return Math.round(total / enrolledStudents.length);
  }, [enrolledStudents, metricByStudentId]);

  const resetDialogForm = () => {
    setStudentFormData(EMPTY_STUDENT_FORM);
    setSelectedStudentIds([]);
  };

  const handleEnrollDialogOpenChange = (open: boolean) => {
    setEnrollDialogOpen(open);
    if (!open) {
      resetDialogForm();
    }
  };

  const handleEnrollStudent = async () => {
    if (selectedStudentIds.length === 0) {
      return;
    }

    setIsEnrolling(true);
    const isSuccess = await enrollStudents(selectedStudentIds);
    setIsEnrolling(false);

    if (isSuccess) {
      handleEnrollDialogOpenChange(false);
    }
  };

  const handleCreateStudent = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setIsCreatingStudent(true);
    const isSuccess = await createStudentForClass(studentFormData);
    setIsCreatingStudent(false);

    if (isSuccess) {
      handleEnrollDialogOpenChange(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((current) => {
      if (current.includes(studentId)) {
        return current.filter((id) => id !== studentId);
      }

      return [...current, studentId];
    });
  };

  const handleUnenrollStudent = async (studentId: string) => {
    const shouldContinue = window.confirm(
      classDetailDictionary.unenrollConfirm,
    );
    if (!shouldContinue) {
      return;
    }

    setRemovingStudentId(studentId);
    await unenrollStudent(studentId);
    setRemovingStudentId(null);
  };

  if (!classItem) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-app-text">
            {classDetailDictionary.studentsTabTitle}
          </h1>
          <p className="text-app-text-muted">
            {classDetailDictionary.studentsTabDescription}
          </p>
        </div>

        <Button
          className="w-auto"
          onClick={() => handleEnrollDialogOpenChange(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {classDetailDictionary.enrollStudent}
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-app-text-soft" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={classDetailDictionary.searchStudentsPlaceholder}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Card className="border-app-border bg-app-surface px-4 py-2">
            <p className="text-sm text-app-text-muted">
              {classDetailDictionary.totalStudents}
            </p>
            <p className="text-2xl font-semibold text-app-text">
              {enrolledStudents.length}
            </p>
          </Card>
          <Card className="border-app-border bg-app-surface px-4 py-2">
            <p className="text-sm text-app-text-muted">
              {classDetailDictionary.averageProgressShort}
            </p>
            <p className="text-2xl font-semibold text-app-text">
              {averageProgress}%
            </p>
          </Card>
        </div>
      </div>

      <Card className="border-app-border bg-app-surface">
        <CardContent className="p-0">
          {filteredStudents.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Users className="mx-auto mb-4 h-16 w-16 text-app-text-soft" />
              <h3 className="mb-2 text-xl font-medium text-app-text">
                {searchQuery
                  ? classDetailDictionary.noStudentsFound
                  : classDetailDictionary.noStudentsInClass}
              </h3>
              <p className="mb-4 text-app-text-muted">
                {searchQuery
                  ? dictionary.studentsPage.tryAdjustingSearch
                  : classDetailDictionary.enrolledStudentsHint}
              </p>
              {!searchQuery ? (
                <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
                  <Button
                    className="w-auto"
                    onClick={() => handleEnrollDialogOpenChange(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {classDetailDictionary.enrollFirstStudent}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="space-y-3 p-4 md:hidden">
                {filteredStudents.map((student) => {
                  const metric = metricByStudentId.get(student.studentId);
                  const progress = metric?.progress ?? 0;
                  const completedProjects = metric?.completedProjects ?? 0;

                  return (
                    <article
                      key={student.studentId}
                      className="space-y-3 rounded-xl border border-app-border bg-app-surface-2 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-sm font-semibold text-(--color-text-inverse)">
                          {getInitials(student.fullName, "S")}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-app-text">
                            {student.fullName}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-sm text-app-text-muted">
                            <Mail className="h-3.5 w-3.5" />
                            <span className="truncate">{student.email}</span>
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="text-app-text-muted">
                            {classDetailDictionary.classStudentTableProgress}
                          </span>
                          <span className="font-medium text-app-text">
                            {progress}%
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <p className="text-sm text-app-text-muted">
                        {classDetailDictionary.completedProjectsLabel}:{" "}
                        {completedProjects}
                      </p>

                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--color-error)_45%,var(--color-border)_55%)] bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)] px-3 text-xs font-semibold uppercase tracking-[0.08em] text-(--color-error) transition-colors hover:bg-[color-mix(in_srgb,var(--color-error-soft)_84%,var(--color-surface)_16%)] disabled:cursor-not-allowed disabled:opacity-70"
                        onClick={() => handleUnenrollStudent(student.studentId)}
                        disabled={removingStudentId === student.studentId}
                      >
                        <UserMinus className="mr-1 h-4 w-4" />
                        {classDetailDictionary.removeStudentAriaLabel}
                      </button>
                    </article>
                  );
                })}
              </div>

              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-app-border">
                      <TableHead className="px-4 text-app-text">
                        {classDetailDictionary.classStudentTableStudent}
                      </TableHead>
                      <TableHead className="px-4 text-app-text">
                        {classDetailDictionary.classStudentTableEmail}
                      </TableHead>
                      <TableHead className="px-4 text-app-text">
                        {classDetailDictionary.classStudentTableProgress}
                      </TableHead>
                      <TableHead className="px-4 text-app-text">
                        {
                          classDetailDictionary.classStudentTableCompletedProjects
                        }
                      </TableHead>
                      <TableHead className="px-4 text-right text-app-text">
                        {classDetailDictionary.classStudentTableActions}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => {
                      const metric = metricByStudentId.get(student.studentId);
                      const progress = metric?.progress ?? 0;
                      const completedProjects = metric?.completedProjects ?? 0;

                      return (
                        <TableRow
                          key={student.studentId}
                          className="border-app-border hover:bg-app-surface-2"
                        >
                          <TableCell className="px-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-sm font-semibold text-(--color-text-inverse)">
                                {getInitials(student.fullName, "S")}
                              </div>
                              <p className="font-medium text-app-text">
                                {student.fullName}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 text-app-text-muted">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5" />
                              {student.email}
                            </div>
                          </TableCell>
                          <TableCell className="px-4">
                            <div className="flex min-w-35 items-center gap-2">
                              <Progress
                                value={progress}
                                className="h-2 flex-1"
                              />
                              <span className="w-10 text-right text-sm text-app-text-muted">
                                {progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-4 font-medium text-app-text">
                            {completedProjects}
                          </TableCell>
                          <TableCell className="px-4 text-right">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--color-error)_45%,var(--color-border)_55%)] bg-[color-mix(in_srgb,var(--color-error-soft)_70%,var(--color-surface)_30%)] text-(--color-error) transition-colors hover:bg-[color-mix(in_srgb,var(--color-error-soft)_84%,var(--color-surface)_16%)] disabled:cursor-not-allowed disabled:opacity-70"
                              onClick={() =>
                                handleUnenrollStudent(student.studentId)
                              }
                              disabled={removingStudentId === student.studentId}
                              aria-label={
                                classDetailDictionary.removeStudentAriaLabel
                              }
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={enrollDialogOpen} onOpenChange={handleEnrollDialogOpenChange}>
        <DialogContent className="max-w-lg border-app-border bg-app-surface">
          <DialogHeader>
            <DialogTitle>{classDetailDictionary.enrollStudent}</DialogTitle>
            <DialogDescription>
              {classDetailDictionary.enrollDialogDescription}
            </DialogDescription>
          </DialogHeader>

          {availableStudents.length > 0 ? (
            <>
              <div className="grid gap-2 py-4">
                <p className="text-sm font-medium text-app-text">
                  {classDetailDictionary.selectStudent}
                </p>
                <div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-app-border bg-app-surface-2 p-2">
                  {availableStudents.map((student) => {
                    const isChecked = selectedStudentIds.includes(
                      student.studentId,
                    );

                    return (
                      <label
                        key={student.studentId}
                        className="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-app-surface"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 rounded border-app-border"
                          checked={isChecked}
                          onChange={() => toggleStudentSelection(student.studentId)}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-app-text">
                            {student.fullName}
                          </p>
                          <p className="text-sm text-app-text-muted">
                            @{student.userName}
                          </p>
                          <p className="text-sm text-app-text-muted">
                            {student.email}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="w-auto"
                  onClick={() => handleEnrollDialogOpenChange(false)}
                  disabled={isEnrolling}
                >
                  {classDetailDictionary.cancel}
                </Button>
                <Button
                  type="button"
                  className="w-auto"
                  onClick={handleEnrollStudent}
                  disabled={isEnrolling || selectedStudentIds.length === 0}
                >
                  {classDetailDictionary.confirmEnroll}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleCreateStudent}>
              <div className="grid gap-4 py-4">
                <div className="rounded-xl border border-dashed border-app-border bg-app-surface-2 px-4 py-3 text-sm text-app-text-muted">
                  <p>{classDetailDictionary.noAvailableStudents}</p>
                  <p className="mt-1">{studentsDictionary.addStudentDescription}</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="class-student-full-name">
                    {studentsDictionary.fullNameLabel}
                  </Label>
                  <Input
                    id="class-student-full-name"
                    value={studentFormData.fullName}
                    onChange={(event) =>
                      setStudentFormData((current) => ({
                        ...current,
                        fullName: event.target.value,
                      }))
                    }
                    placeholder={studentsDictionary.fullNamePlaceholder}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="class-student-username">
                    {studentsDictionary.userNameLabel}
                  </Label>
                  <Input
                    id="class-student-username"
                    value={studentFormData.userName}
                    onChange={(event) =>
                      setStudentFormData((current) => ({
                        ...current,
                        userName: event.target.value,
                      }))
                    }
                    placeholder={studentsDictionary.userNamePlaceholder}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="class-student-email">
                    {studentsDictionary.emailLabel}
                  </Label>
                  <Input
                    id="class-student-email"
                    type="email"
                    value={studentFormData.email}
                    onChange={(event) =>
                      setStudentFormData((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder={studentsDictionary.emailPlaceholder}
                    required
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="w-auto"
                  onClick={() => handleEnrollDialogOpenChange(false)}
                  disabled={isCreatingStudent}
                >
                  {classDetailDictionary.cancel}
                </Button>
                <Button
                  type="submit"
                  className="w-auto"
                  disabled={isCreatingStudent}
                >
                  {studentsDictionary.addStudentSubmit}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
