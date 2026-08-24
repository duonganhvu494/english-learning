import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import Button from "../../../components/ui/Button";
import Card, { CardBody, CardHeader } from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/Table";

import {
  classesApi,
  getApiErrorMessage,
  sessionsApi,
  workspacesApi,
} from "@/api";

import type {
  ClassResponse,
  ClassStudentListItem,
  SessionResponse,
  WorkspaceStudentListItem,
} from "@/types";

import {
  formatDateTime,
  toIsoFromLocalDateTime,
} from "@/app/utils/format";

import { resolveWorkspaceId } from "@/app/utils/workspace";

import AddSessionModal, {
  type AddSessionFormValue,
} from "./AddSessionModal";

import AddStudentsModal from "./AddStudentsModal";

type SessionDisplayStatus =
  | "upcoming"
  | "ongoing"
  | "completed";

function getSessionDisplayStatus(
  timeStart: string,
  timeEnd: string,
): SessionDisplayStatus {
  const now = Date.now();
  const start = new Date(timeStart).getTime();
  const end = new Date(timeEnd).getTime();

  if (now < start) {
    return "upcoming";
  }

  if (now > end) {
    return "completed";
  }

  return "ongoing";
}

function getSessionStatusLabel(
  status: SessionDisplayStatus,
): string {
  switch (status) {
    case "upcoming":
      return "Sắp diễn ra";
    case "ongoing":
      return "Đang diễn ra";
    case "completed":
      return "Đã xong";
  }
}

function getSessionStatusVariant(
  status: SessionDisplayStatus,
): "warning" | "info" | "success" {
  switch (status) {
    case "upcoming":
      return "warning";
    case "ongoing":
      return "info";
    case "completed":
      return "success";
  }
}

function getClassRoleLabel(
  roleName: string | null | undefined,
): string {
  if (!roleName || roleName.toLowerCase() === "student") {
    return "Học viên";
  }

  return roleName;
}

// Monday
function getStartOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);

  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
  }).format(date);
}

function formatDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);

  const formatter = new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

export default function ClassDetailPage() {
  const { classId } = useParams();

  const [showAddSessionModal, setShowAddSessionModal] =
    useState(false);

  const [showAddStudentsModal, setShowAddStudentsModal] =
    useState(false);

  const [isLoading, setIsLoading] = useState(true);

  const [isSavingSession, setIsSavingSession] =
    useState(false);

  const [isSavingStudents, setIsSavingStudents] =
    useState(false);

  const [removingStudentId, setRemovingStudentId] =
    useState<string | null>(null);

  const [classInfo, setClassInfo] =
    useState<ClassResponse | null>(null);

  const [students, setStudents] = useState<
    ClassStudentListItem[]
  >([]);

  const [sessions, setSessions] = useState<
    SessionResponse[]
  >([]);

  const [workspaceStudents, setWorkspaceStudents] =
    useState<WorkspaceStudentListItem[]>([]);

  const [weekStart, setWeekStart] = useState(() =>
    getStartOfWeek(new Date()),
  );

  const loadData = async () => {
    if (!classId) {
      return;
    }

    setIsLoading(true);

    try {
      const workspaceId = await resolveWorkspaceId();

      const [
        classDetail,
        roster,
        classSessions,
        workspaceStudentList,
      ] = await Promise.all([
        classesApi.getClassDetail(classId),
        classesApi.getClassStudents(classId),
        sessionsApi.listClassSessions(classId),
        workspacesApi.listWorkspaceStudents(workspaceId),
      ]);

      setClassInfo(classDetail);
      setStudents(roster.students);
      setSessions(classSessions);
      setWorkspaceStudents(workspaceStudentList);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tải chi tiết lớp học",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [classId]);

  const availableStudents = useMemo(
    () =>
      workspaceStudents.filter(
        (workspaceStudent) =>
          !students.some(
            (student) =>
              student.studentId ===
              workspaceStudent.studentId,
          ),
      ),
    [workspaceStudents, students],
  );

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        addDays(weekStart, index),
      ),
    [weekStart],
  );

  const sessionStats = useMemo(() => {
    const completed = sessions.filter(
      (session) =>
        getSessionDisplayStatus(
          session.timeStart,
          session.timeEnd,
        ) === "completed",
    ).length;

    const upcoming = sessions.filter(
      (session) =>
        getSessionDisplayStatus(
          session.timeStart,
          session.timeEnd,
        ) === "upcoming",
    ).length;

    return {
      total: sessions.length,
      completed,
      upcoming,
    };
  }, [sessions]);

  const handleAddSession = async (
    formData: AddSessionFormValue,
  ) => {
    if (!classId || isSavingSession) {
      return;
    }

    setIsSavingSession(true);

    try {
      await sessionsApi.createSession(classId, {
        topic: formData.topic,
        timeStart: toIsoFromLocalDateTime(
          formData.timeStart,
        ),
        timeEnd: toIsoFromLocalDateTime(
          formData.timeEnd,
        ),
      });

      toast.success("Tạo buổi học thành công");

      setShowAddSessionModal(false);

      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tạo buổi học",
        ),
      );
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleAddStudents = async (
    studentIds: string[],
  ) => {
    if (
      !classId ||
      studentIds.length === 0 ||
      isSavingStudents
    ) {
      return;
    }

    setIsSavingStudents(true);

    try {
      await classesApi.addClassStudents(classId, {
        studentIds,
      });

      toast.success("Đã thêm học viên vào lớp");

      setShowAddStudentsModal(false);

      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể thêm học viên vào lớp",
        ),
      );
    } finally {
      setIsSavingStudents(false);
    }
  };

  const handleRemoveStudent = async (
    student: ClassStudentListItem,
  ) => {
    if (!classId || removingStudentId) {
      return;
    }

    const confirmed = window.confirm(
      `Xóa ${student.fullName} khỏi lớp này?`,
    );

    if (!confirmed) {
      return;
    }

    setRemovingStudentId(student.studentId);

    try {
      await classesApi.removeStudentFromClass(
        classId,
        student.studentId,
      );

      setStudents((prev) =>
        prev.filter(
          (item) =>
            item.studentId !== student.studentId,
        ),
      );

      toast.success(
        `Đã xóa ${student.fullName} khỏi lớp`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể xóa học viên khỏi lớp",
        ),
      );
    } finally {
      setRemovingStudentId(null);
    }
  };

  const handleResetRole = async (
    studentId: string,
  ) => {
    if (!classId) {
      return;
    }

    try {
      await classesApi.updateClassStudentRole(
        classId,
        studentId,
        {
          roleId: null,
        },
      );

      toast.success(
        "Đã đặt lại vai trò mặc định",
      );

      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể cập nhật vai trò",
        ),
      );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/classes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {classInfo?.className ??
                "Chi tiết lớp học"}
            </h1>

            <p className="text-gray-600 mt-1">
              {classInfo?.description ||
                "Không có mô tả"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setShowAddStudentsModal(true)
            }
          >
            <UserPlus className="w-4 h-4" />
            Thêm học viên
          </Button>

          <Button
            onClick={() =>
              setShowAddSessionModal(true)
            }
          >
            <Plus className="w-4 h-4" />
            Tạo buổi học
          </Button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">
              Học viên
            </p>

            <div className="flex items-center gap-2 mt-1">
              <Users className="w-5 h-5 text-blue-600" />

              <p className="text-2xl font-bold text-gray-900">
                {students.length}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">
              Buổi học
            </p>

            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-5 h-5 text-blue-600" />

              <p className="text-2xl font-bold text-gray-900">
                {sessionStats.total}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">
              Sắp tới
            </p>

            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-5 h-5 text-yellow-600" />

              <p className="text-2xl font-bold text-gray-900">
                {sessionStats.upcoming}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">
              Hoàn thành
            </p>

            <p className="text-2xl font-bold text-gray-900 mt-1">
              {sessionStats.completed}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* CALENDAR */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">
                Lịch học
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {formatWeekRange(weekStart)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setWeekStart((prev) =>
                    addDays(prev, -7),
                  )
                }
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setWeekStart(
                    getStartOfWeek(new Date()),
                  )
                }
              >
                Hôm nay
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setWeekStart((prev) =>
                    addDays(prev, 7),
                  )
                }
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          <div className="overflow-x-auto">
            <div className="grid min-w-[900px] grid-cols-7 border border-gray-200 rounded-lg overflow-hidden">
              {weekDays.map((day) => {
                const daySessions = sessions
                  .filter((session) =>
                    isSameDay(
                      new Date(session.timeStart),
                      day,
                    ),
                  )
                  .sort(
                    (left, right) =>
                      new Date(
                        left.timeStart,
                      ).getTime() -
                      new Date(
                        right.timeStart,
                      ).getTime(),
                  );

                const isToday = isSameDay(
                  day,
                  new Date(),
                );

                return (
                  <div
                    key={day.toISOString()}
                    className="min-h-[280px] border-r border-gray-200 last:border-r-0"
                  >
                    {/* DAY HEADER */}
                    <div
                      className={`border-b border-gray-200 px-3 py-3 text-center ${
                        isToday
                          ? "bg-blue-50"
                          : "bg-gray-50"
                      }`}
                    >
                      <p className="text-xs uppercase text-gray-500">
                        {formatDayLabel(day)}
                      </p>

                      <div
                        className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          isToday
                            ? "bg-blue-600 text-white"
                            : "text-gray-900"
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </div>

                    {/* DAY SESSIONS */}
                    <div className="space-y-2 p-2">
                      {daySessions.length === 0 && (
                        <div className="py-6 text-center text-xs text-gray-400">
                          Không có lịch
                        </div>
                      )}

                      {daySessions.map((session) => {
                        const status =
                          getSessionDisplayStatus(
                            session.timeStart,
                            session.timeEnd,
                          );

                        return (
                          <Link
                            key={session.id}
                            to={`/admin/sessions/${session.id}`}
                            className="block rounded-md border border-blue-200 bg-blue-50 p-2 hover:border-blue-400 hover:bg-blue-100 transition-colors"
                          >
                            <p className="text-xs font-semibold text-blue-900 line-clamp-2">
                              {session.topic}
                            </p>

                            <p className="text-xs text-blue-700 mt-1">
                              {formatTime(
                                session.timeStart,
                              )}
                              {" - "}
                              {formatTime(
                                session.timeEnd,
                              )}
                            </p>

                            <div className="mt-2">
                              <Badge
                                variant={getSessionStatusVariant(
                                  status,
                                )}
                              >
                                {getSessionStatusLabel(
                                  status,
                                )}
                              </Badge>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* STUDENTS */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Học viên
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              {students.length} học viên trong lớp
            </p>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setShowAddStudentsModal(true)
            }
          >
            <UserPlus className="w-4 h-4" />
            Thêm học viên
          </Button>
        </CardHeader>

        <CardBody>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học viên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead className="text-right">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!isLoading &&
                students.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-10 text-center text-sm text-gray-500"
                    >
                      Lớp chưa có học viên
                    </TableCell>
                  </TableRow>
                )}

              {students.map((student) => (
                <TableRow key={student.studentId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {student.fullName
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>

                      <div>
                        <p className="font-medium text-gray-900">
                          {student.fullName}
                        </p>

                        <p className="text-xs text-gray-500">
                          @{student.userName}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {student.email}
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant={
                        student.classRoleName
                          ? "info"
                          : "default"
                      }
                    >
                      {getClassRoleLabel(
                        student.classRoleName,
                      )}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-3">
                      {student.classRoleName &&
                        student.classRoleName.toLowerCase() !==
                          "student" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleResetRole(
                                student.studentId,
                              )
                            }
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Đặt lại vai trò
                          </button>
                        )}

                      <button
                        type="button"
                        title="Xóa khỏi lớp"
                        disabled={
                          removingStudentId ===
                          student.studentId
                        }
                        onClick={() =>
                          handleRemoveStudent(student)
                        }
                        className="text-red-500 hover:text-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <AddSessionModal
        isOpen={showAddSessionModal}
        isSaving={isSavingSession}
        onClose={() =>
          setShowAddSessionModal(false)
        }
        onSubmit={handleAddSession}
      />

      <AddStudentsModal
        isOpen={showAddStudentsModal}
        students={availableStudents}
        isSaving={isSavingStudents}
        onClose={() =>
          setShowAddStudentsModal(false)
        }
        onSubmit={handleAddStudents}
      />
    </div>
  );
}