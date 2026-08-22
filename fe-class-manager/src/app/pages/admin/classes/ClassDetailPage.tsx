import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Plus,
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

type ActiveTab = "info" | "students" | "sessions";
type SessionDisplayStatus = "upcoming" | "ongoing" | "completed";

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

function getSessionStatusLabel(status: SessionDisplayStatus): string {
  switch (status) {
    case "upcoming":
      return "Sắp diễn ra";
    case "ongoing":
      return "Đang diễn ra";
    case "completed":
      return "Đã hoàn thành";
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
  if (!roleName) {
    return "Học viên";
  }

  if (roleName.toLowerCase() === "student") {
    return "Học viên";
  }

  return roleName;
}

export default function ClassDetailPage() {
  const { classId } = useParams();

  const [activeTab, setActiveTab] = useState<ActiveTab>("info");
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [isSavingStudents, setIsSavingStudents] = useState(false);

  const [classInfo, setClassInfo] = useState<ClassResponse | null>(null);
  const [students, setStudents] = useState<ClassStudentListItem[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [workspaceStudents, setWorkspaceStudents] = useState<
    WorkspaceStudentListItem[]
  >([]);

  const loadData = async () => {
    if (!classId) {
      return;
    }

    setIsLoading(true);

    try {
      const workspaceId = await resolveWorkspaceId();

      const [
        classList,
        roster,
        classSessions,
        workspaceStudentList,
      ] = await Promise.all([
        classesApi.listWorkspaceClasses(workspaceId),
        classesApi.getClassStudents(classId),
        sessionsApi.listClassSessions(classId),
        workspacesApi.listWorkspaceStudents(workspaceId),
      ]);

      setClassInfo(
        classList.find((item) => item.id === classId) ?? null,
      );
      setStudents(roster.students);
      setSessions(classSessions);
      setWorkspaceStudents(workspaceStudentList);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải chi tiết lớp học"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [classId]);

  const sessionStats = useMemo(() => {
    const completed = sessions.filter(
      (session) =>
        getSessionDisplayStatus(
          session.timeStart,
          session.timeEnd,
        ) === "completed",
    ).length;

    return {
      total: sessions.length,
      completed,
    };
  }, [sessions]);

  const availableStudents = useMemo(
    () =>
      workspaceStudents.filter(
        (workspaceStudent) =>
          !students.some(
            (student) =>
              student.studentId === workspaceStudent.studentId,
          ),
      ),
    [workspaceStudents, students],
  );

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
        timeStart: toIsoFromLocalDateTime(formData.timeStart),
        timeEnd: toIsoFromLocalDateTime(formData.timeEnd),
      });

      toast.success("Tạo buổi học thành công");
      setShowAddSessionModal(false);
      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tạo buổi học"),
      );
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleAddStudents = async (studentIds: string[]) => {
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

  const handleResetRole = async (studentId: string) => {
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

      toast.success("Đã đặt lại vai trò mặc định");
      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể cập nhật vai trò"),
      );
    }
  };

  const tabs: Array<{
    id: ActiveTab;
    label: string;
    icon: typeof FileText;
  }> = [
    { id: "info", label: "Thông tin", icon: FileText },
    { id: "students", label: "Học viên", icon: Users },
    { id: "sessions", label: "Buổi học", icon: Calendar },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/classes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {classInfo?.className || "Chi tiết lớp học"}
          </h1>
          <p className="text-gray-600 mt-1">
            {classInfo?.description || "Không có mô tả"}
          </p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">
                Thông tin cơ bản
              </h3>
            </CardHeader>

            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Tên lớp</p>
                <p className="font-medium text-gray-900">
                  {classInfo?.className || "-"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Mô tả</p>
                <p className="font-medium text-gray-900">
                  {classInfo?.description || "-"}
                </p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">
                Thống kê
              </h3>
            </CardHeader>

            <CardBody className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Tổng học viên
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {students.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Tổng buổi học
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sessionStats.total}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">
                      Đã hoàn thành
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {sessionStats.completed}
                    </p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === "students" && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Danh sách học viên
            </h3>

            <Button
              size="sm"
              onClick={() => setShowAddStudentsModal(true)}
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
                  <TableHead>Vai trò hiện tại</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!isLoading && students.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-8 text-sm text-gray-500"
                    >
                      Lớp chưa có học viên
                    </TableCell>
                  </TableRow>
                )}

                {students.map((student) => (
                  <TableRow key={student.studentId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {student.fullName.charAt(0)}
                          </span>
                        </div>

                        <span className="font-medium">
                          {student.fullName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>{student.email}</TableCell>

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
                      <button
                        onClick={() =>
                          handleResetRole(student.studentId)
                        }
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Đặt lại vai trò mặc định
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {activeTab === "sessions" && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              Danh sách buổi học
            </h3>

            <Button
              size="sm"
              onClick={() => setShowAddSessionModal(true)}
            >
              <Plus className="w-4 h-4" />
              Tạo buổi học
            </Button>
          </CardHeader>

          <CardBody>
            <div className="space-y-3">
              {!isLoading && sessions.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500 border rounded-lg">
                  Chưa có buổi học nào
                </div>
              )}

              {sessions.map((session) => {
                const status = getSessionDisplayStatus(
                  session.timeStart,
                  session.timeEnd,
                );

                return (
                  <Link
                    key={session.id}
                    to={`/admin/sessions/${session.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {session.topic}
                        </h4>

                        <p className="text-sm text-gray-600 mt-1">
                          {formatDateTime(session.timeStart)}
                          {" - "}
                          {formatDateTime(session.timeEnd)}
                        </p>
                      </div>

                      <Badge
                        variant={getSessionStatusVariant(status)}
                      >
                        {getSessionStatusLabel(status)}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      <AddSessionModal
        isOpen={showAddSessionModal}
        isSaving={isSavingSession}
        onClose={() => setShowAddSessionModal(false)}
        onSubmit={handleAddSession}
      />

      <AddStudentsModal
        isOpen={showAddStudentsModal}
        students={availableStudents}
        isSaving={isSavingStudents}
        onClose={() => setShowAddStudentsModal(false)}
        onSubmit={handleAddStudents}
      />
    </div>
  );
}