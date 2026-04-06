"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, Calendar, FileText, Trash2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/i18n/types";
import type { SessionAssignment } from "@/types/assignment";
import {
  getRowStatusLabel,
  getRowStatusVariant,
  type SubmissionRow,
} from "@/components/teacher/assignments/use-assignment-data";

type AssignmentDetailViewProps = {
  classId: string;
  assignmentId: string;
  assignment: SessionAssignment;
  className: string;
  localeTag: string;
  dictionary: Dictionary;
  classDetailDictionary: Dictionary["classDetailPage"];
  rows: SubmissionRow[];
  totalStudents: number;
  submittedCount: number;
  gradedCount: number;
  averageScore: number;
  isDeleting: boolean;
  onBack: () => void;
  onDelete: () => void;
  onOpenGrade: (row: SubmissionRow) => void;
  gradeDialogOpen: boolean;
  onGradeDialogOpenChange: (open: boolean) => void;
  gradeForm: {
    studentName: string;
    grade: string;
    feedback: string;
  };
  onGradeChange: (patch: { grade?: string; feedback?: string }) => void;
  isSavingGrade: boolean;
  onSaveGrade: (event: FormEvent<HTMLFormElement>) => void;
};

function getAssignmentStatusLabel(
  status: SessionAssignment["status"],
  classDetailDictionary: Dictionary["classDetailPage"],
) {
  if (status === "open") {
    return classDetailDictionary.assignmentStatusOpen;
  }
  if (status === "upcoming") {
    return classDetailDictionary.assignmentStatusUpcoming;
  }
  return classDetailDictionary.assignmentStatusClosed;
}

export function AssignmentDetailView({
  classId,
  assignmentId,
  assignment,
  className,
  localeTag,
  dictionary,
  classDetailDictionary,
  rows,
  totalStudents,
  submittedCount,
  gradedCount,
  averageScore,
  isDeleting,
  onBack,
  onDelete,
  onOpenGrade,
  gradeDialogOpen,
  onGradeDialogOpenChange,
  gradeForm,
  onGradeChange,
  isSavingGrade,
  onSaveGrade,
}: AssignmentDetailViewProps) {
  return (
    <div className="space-y-6">
      <Button variant="outline" className="w-auto" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        {classDetailDictionary.assignmentsTitle}
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-semibold text-app-text">
            {assignment.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">
              {assignment.type === "quiz"
                ? classDetailDictionary.assignmentTypeQuiz
                : classDetailDictionary.assignmentTypeManual}
            </Badge>
            <Badge variant="outline">
              {getAssignmentStatusLabel(assignment.status, classDetailDictionary)}
            </Badge>
            <span className="text-sm text-app-text-muted">{className}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/teacher/class/${classId}/assignments/${assignmentId}/dashboard`}
          >
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              {classDetailDictionary.assignmentDetailDashboardButton}
            </Button>
          </Link>
          <Button
            variant="outline"
            className="text-(--color-error) hover:bg-[color-mix(in_srgb,var(--color-error-soft)_75%,var(--color-surface)_25%)]"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {dictionary.classesPage.deleteClass}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {classDetailDictionary.totalStudents}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-app-text">{totalStudents}</p>
          </CardContent>
        </Card>
        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {classDetailDictionary.assignmentDetailSubmitted}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-app-text">{submittedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{classDetailDictionary.gradedLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-app-text">{gradedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-app-border bg-app-surface">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              {classDetailDictionary.assignmentDashboardAverageScore}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-app-text">
              {Number.isFinite(averageScore)
                ? averageScore.toFixed(1) + "%"
                : classDetailDictionary.notAvailableLabel}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="submissions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="submissions">
            {classDetailDictionary.assignmentDetailSubmissionsTab}
          </TabsTrigger>
          <TabsTrigger value="details">
            {classDetailDictionary.assignmentDetailDetailsTab}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <Card className="border-app-border bg-app-surface">
            <CardHeader>
              <CardTitle>
                {classDetailDictionary.assignmentDetailStudentSubmissions}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{dictionary.studentsPage.tableStudent}</TableHead>
                    <TableHead>{dictionary.studentsPage.tableStatus}</TableHead>
                    <TableHead>
                      {classDetailDictionary.assignmentDetailSubmittedAt}
                    </TableHead>
                    <TableHead>{classDetailDictionary.assignmentDetailScore}</TableHead>
                    <TableHead className="text-right">
                      {dictionary.studentsPage.tableActions}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.studentId}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-app-text">{row.studentName}</p>
                          <p className="text-xs text-app-text-muted">{row.studentEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRowStatusVariant(row.status)}>
                          {getRowStatusLabel(row.status, classDetailDictionary)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.submittedAt
                          ? new Date(row.submittedAt).toLocaleString(localeTag)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {row.score !== null
                          ? row.score + (row.maxScore ? " / " + row.maxScore : "")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {assignment.type === "manual" && row.status !== "not_submitted" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenGrade(row)}
                          >
                            {classDetailDictionary.assignmentDetailGradeAction}
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card className="border-app-border bg-app-surface">
            <CardHeader>
              <CardTitle>{classDetailDictionary.assignmentDetailInfoTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-app-text-muted">
              <p className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {assignment.description || classDetailDictionary.notAvailableLabel}
              </p>
              <p className="inline-flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(assignment.timeStart).toLocaleString(localeTag)}
                {" - "}
                {new Date(assignment.timeEnd).toLocaleString(localeTag)}
              </p>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wide text-app-text-soft">
                  {classDetailDictionary.submissionProgress}
                </p>
                <Progress
                  value={totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={gradeDialogOpen} onOpenChange={onGradeDialogOpenChange}>
        <DialogContent className="border-app-border bg-app-surface">
          <DialogHeader>
            <DialogTitle>
              {classDetailDictionary.assignmentDetailGradeDialogTitle}
            </DialogTitle>
            <DialogDescription>{gradeForm.studentName}</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSaveGrade}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="grade">
                  {classDetailDictionary.assignmentDetailGradeLabel}
                </Label>
                <Input
                  id="grade"
                  type="number"
                  value={gradeForm.grade}
                  onChange={(event) => onGradeChange({ grade: event.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedback">
                  {classDetailDictionary.assignmentDetailFeedbackLabel}
                </Label>
                <Textarea
                  id="feedback"
                  value={gradeForm.feedback}
                  onChange={(event) => onGradeChange({ feedback: event.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onGradeDialogOpenChange(false)}
                disabled={isSavingGrade}
              >
                {classDetailDictionary.cancel}
              </Button>
              <Button type="submit" disabled={isSavingGrade}>
                {classDetailDictionary.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
