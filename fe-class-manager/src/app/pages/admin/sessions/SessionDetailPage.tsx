import { useEffect, useMemo, useState } from "react";

import { Link, useParams } from "react-router";

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import { toast } from "sonner";

import Button from "@/app/components/ui/Button";

import Card, { CardBody, CardHeader } from "@/app/components/ui/Card";

import Badge from "@/app/components/ui/Badge";

import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/Table";

import {
  assignmentsApi,
  attendancesApi,
  getApiErrorMessage,
  lecturesApi,
  materialsApi,
  resolveApiUrl,
  sessionsApi,
} from "@/api";

import type {
  AssignmentResponse,
  AttendanceItem,
  AttendanceStatusInput,
  AttendanceStatusValue,
  LectureResponse,
  MaterialResponse,
  SessionResponse,
} from "@/types";

import { formatDateTime, toIsoFromLocalDateTime } from "@/app/utils/format";

import { resolveWorkspaceId } from "@/app/utils/workspace";

import CreateAssignmentModal, {
  type CreateAssignmentFormValue,
} from "@/app/pages/admin/assignments/CreateAssignmentModal";

import LectureModal, { type LectureFormValue } from "./LectureModal";

type AttendanceViewStatus = "UNMARKED" | "PRESENT" | "ABSENT" | "LATE";

type MarkedAttendanceViewStatus = Exclude<AttendanceViewStatus, "UNMARKED">;

function toViewStatus(
  value: AttendanceStatusValue | null,
): AttendanceViewStatus {
  switch (value) {
    case "present":
      return "PRESENT";

    case "absent":
      return "ABSENT";

    case "late":
      return "LATE";

    default:
      return "UNMARKED";
  }
}

function fromViewStatus(
  value: MarkedAttendanceViewStatus,
): AttendanceStatusInput {
  return value;
}

function getAttendanceStatusLabel(status: AttendanceViewStatus): string {
  switch (status) {
    case "PRESENT":
      return "Có mặt";

    case "ABSENT":
      return "Vắng";

    case "LATE":
      return "Trễ";

    case "UNMARKED":
      return "Chưa điểm danh";
  }
}

function getAttendanceStatusColor(status: AttendanceViewStatus): string {
  switch (status) {
    case "PRESENT":
      return "bg-green-100 text-green-700 border-green-300";

    case "ABSENT":
      return "bg-red-100 text-red-700 border-red-300";

    case "LATE":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";

    case "UNMARKED":
      return "bg-gray-100 text-gray-700 border-gray-300";
  }
}

function getAssignmentStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "upcoming":
      return "Chưa mở";

    case "open":
      return "Đang mở";

    case "closed":
      return "Đã đóng";

    default:
      return status;
  }
}

function getAssignmentStatusVariant(
  status: string,
): "default" | "warning" | "success" | "info" {
  switch (status.toLowerCase()) {
    case "upcoming":
      return "warning";

    case "open":
      return "success";

    case "closed":
      return "default";

    default:
      return "info";
  }
}

export default function SessionDetailPage() {
  const { sessionId } = useParams();

  const [sessionInfo, setSessionInfo] = useState<SessionResponse | null>(null);

  const [attendanceItems, setAttendanceItems] = useState<AttendanceItem[]>([]);

  const [assignments, setAssignments] = useState<AssignmentResponse[]>([]);

  const [lectures, setLectures] = useState<LectureResponse[]>([]);

  const [workspaceMaterials, setWorkspaceMaterials] = useState<
    MaterialResponse[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);

  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  const [isSavingAssignment, setIsSavingAssignment] = useState(false);

  const [showLectureModal, setShowLectureModal] = useState(false);

  const [editingLecture, setEditingLecture] = useState<LectureResponse | null>(
    null,
  );

  const [isSavingLecture, setIsSavingLecture] = useState(false);

  const [deletingLectureId, setDeletingLectureId] = useState<string | null>(
    null,
  );

  const loadData = async () => {
    if (!sessionId) {
      return;
    }

    setIsLoading(true);

    try {
      const workspaceId = await resolveWorkspaceId();

      const [
        session,
        attendances,
        sessionAssignments,
        sessionLectures,
        materialList,
      ] = await Promise.all([
        sessionsApi.getSession(sessionId),

        attendancesApi.getSessionAttendances(sessionId),

        assignmentsApi.listSessionAssignments(sessionId),

        lecturesApi.listSessionLectures(sessionId),

        materialsApi.listWorkspaceMaterials(workspaceId),
      ]);

      setSessionInfo(session);

      setAttendanceItems(attendances.attendances);

      setAssignments(sessionAssignments);

      setLectures(sessionLectures);

      setWorkspaceMaterials(materialList);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải chi tiết buổi học"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [sessionId]);

  const attendanceView = useMemo(
    () =>
      attendanceItems.map((item) => ({
        ...item,
        viewStatus: toViewStatus(item.status),
      })),
    [attendanceItems],
  );

  const attendanceStats = useMemo(() => {
    const present = attendanceView.filter(
      (item) => item.viewStatus === "PRESENT",
    ).length;

    const late = attendanceView.filter(
      (item) => item.viewStatus === "LATE",
    ).length;

    const absent = attendanceView.filter(
      (item) => item.viewStatus === "ABSENT",
    ).length;

    return {
      total: attendanceView.length,
      present,
      late,
      absent,
    };
  }, [attendanceView]);

  const handleAttendanceChange = async (
    studentId: string,
    status: MarkedAttendanceViewStatus,
  ) => {
    if (!sessionId) {
      return;
    }

    try {
      await attendancesApi.updateAttendance(sessionId, studentId, {
        status: fromViewStatus(status),
      });

      setAttendanceItems((prev) =>
        prev.map((item) =>
          item.studentId === studentId
            ? {
                ...item,
                status: status.toLowerCase() as AttendanceStatusValue,
              }
            : item,
        ),
      );

      toast.success("Cập nhật điểm danh thành công");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật điểm danh"));
    }
  };

  const handleAddAssignment = async (formData: CreateAssignmentFormValue) => {
    if (!sessionId || isSavingAssignment) {
      return;
    }

    setIsSavingAssignment(true);

    try {
      await assignmentsApi.createAssignment(sessionId, {
        title: formData.title,

        description: formData.description.trim() || undefined,

        timeStart: toIsoFromLocalDateTime(formData.timeStart),

        timeEnd: toIsoFromLocalDateTime(formData.timeEnd),

        type: formData.type,

        materialIds: formData.materialIds,
      });

      toast.success("Tạo bài tập thành công");

      setShowAssignmentModal(false);

      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tạo bài tập"));
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const openCreateLecture = () => {
    setEditingLecture(null);
    setShowLectureModal(true);
  };

  const openEditLecture = (lecture: LectureResponse) => {
    setEditingLecture(lecture);
    setShowLectureModal(true);
  };

  const handleSaveLecture = async (formData: LectureFormValue) => {
    if (!sessionId || isSavingLecture) {
      return;
    }

    setIsSavingLecture(true);

    try {
      if (editingLecture) {
        await lecturesApi.updateLecture(editingLecture.id, {
          title: formData.title,

          description: formData.description || undefined,

          materialIds: formData.materialIds,
        });

        toast.success("Cập nhật bài giảng thành công");
      } else {
        await lecturesApi.createLecture(sessionId, {
          title: formData.title,

          description: formData.description || undefined,

          materialIds: formData.materialIds,
        });

        toast.success("Thêm bài giảng thành công");
      }

      setShowLectureModal(false);
      setEditingLecture(null);

      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          editingLecture
            ? "Không thể cập nhật bài giảng"
            : "Không thể thêm bài giảng",
        ),
      );
    } finally {
      setIsSavingLecture(false);
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài giảng này?")) {
      return;
    }

    setDeletingLectureId(lectureId);

    try {
      await lecturesApi.deleteLecture(lectureId);

      setLectures((prev) => prev.filter((lecture) => lecture.id !== lectureId));

      toast.success("Đã xóa bài giảng");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể xóa bài giảng"));
    } finally {
      setDeletingLectureId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">Đang tải buổi học...</div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            to={
              sessionInfo
                ? `/admin/classes/${sessionInfo.classId}`
                : "/admin/classes"
            }
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {sessionInfo?.topic || "Chi tiết buổi học"}
            </h1>

            <p className="text-gray-600 mt-1">
              {sessionInfo
                ? `${formatDateTime(sessionInfo.timeStart)} - ${formatDateTime(
                    sessionInfo.timeEnd,
                  )}`
                : "-"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={openCreateLecture}>
            <BookOpen className="w-4 h-4" />
            Thêm bài giảng
          </Button>

          <Button onClick={() => setShowAssignmentModal(true)}>
            <Plus className="w-4 h-4" />
            Tạo bài tập
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Học viên</p>

            <div className="flex items-center gap-2 mt-1">
              <Users className="w-5 h-5 text-blue-600" />

              <p className="text-2xl font-bold text-gray-900">
                {attendanceStats.total}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Có mặt</p>

            <div className="flex items-center gap-2 mt-1">
              <CheckCircle2 className="w-5 h-5 text-green-600" />

              <p className="text-2xl font-bold text-gray-900">
                {attendanceStats.present}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Bài tập</p>

            <div className="flex items-center gap-2 mt-1">
              <ClipboardList className="w-5 h-5 text-blue-600" />

              <p className="text-2xl font-bold text-gray-900">
                {assignments.length}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Bài giảng</p>

            <div className="flex items-center gap-2 mt-1">
              <BookOpen className="w-5 h-5 text-purple-600" />

              <p className="text-2xl font-bold text-gray-900">
                {lectures.length}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <h3 className="font-semibold text-gray-900">Điểm danh học viên</h3>

            <p className="text-sm text-gray-500 mt-1">
              {attendanceStats.present} có mặt · {attendanceStats.late} trễ ·{" "}
              {attendanceStats.absent} vắng
            </p>
          </div>
        </CardHeader>

        <CardBody>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học viên</TableHead>

                <TableHead>Trạng thái</TableHead>

                <TableHead className="text-right">Điểm danh</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {attendanceView.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-10 text-sm text-gray-500"
                  >
                    Chưa có dữ liệu điểm danh
                  </TableCell>
                </TableRow>
              )}

              {attendanceView.map((attendance) => (
                <TableRow key={attendance.studentId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {attendance.fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <span className="font-medium text-gray-900">
                        {attendance.fullName}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getAttendanceStatusColor(
                        attendance.viewStatus,
                      )}`}
                    >
                      {getAttendanceStatusLabel(attendance.viewStatus)}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleAttendanceChange(
                            attendance.studentId,
                            "PRESENT",
                          )
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          attendance.viewStatus === "PRESENT"
                            ? "bg-green-100 border-green-300 text-green-700"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Có mặt
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleAttendanceChange(attendance.studentId, "LATE")
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          attendance.viewStatus === "LATE"
                            ? "bg-yellow-100 border-yellow-300 text-yellow-700"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Trễ
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleAttendanceChange(attendance.studentId, "ABSENT")
                        }
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                          attendance.viewStatus === "ABSENT"
                            ? "bg-red-100 border-red-300 text-red-700"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Vắng
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">Bài giảng</h3>

            <p className="text-sm text-gray-500 mt-1">
              Nội dung và tài liệu giảng dạy trong buổi học
            </p>
          </div>

          <Button size="sm" onClick={openCreateLecture}>
            <Plus className="w-4 h-4" />
            Thêm bài giảng
          </Button>
        </CardHeader>

        <CardBody>
          {lectures.length === 0 ? (
            <div className="py-10 text-center">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />

              <p className="text-sm text-gray-500 mt-3">
                Chưa có bài giảng nào trong buổi học
              </p>

              <Button size="sm" className="mt-4" onClick={openCreateLecture}>
                <Plus className="w-4 h-4" />
                Thêm bài giảng
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lectures.map((lecture) => (
                <div key={lecture.id} className="py-5 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                        <BookOpen className="w-5 h-5 text-purple-600" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {lecture.code && (
                            <Badge variant="info">{lecture.code}</Badge>
                          )}

                          <h4 className="font-medium text-gray-900">
                            {lecture.title}
                          </h4>
                        </div>

                        {lecture.description && (
                          <p className="text-sm text-gray-500 mt-1">
                            {lecture.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditLecture(lecture)}
                      >
                        <Pencil className="w-4 h-4" />
                        Sửa
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={deletingLectureId === lecture.id}
                        onClick={() => void handleDeleteLecture(lecture.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="ml-13 mt-4">
                    {lecture.materials.length === 0 ? (
                      <div className="border border-dashed border-gray-200 rounded-lg py-5 px-4 text-sm text-gray-500">
                        Chưa có tài liệu đính kèm
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {lecture.materials.map((material) => (
                          <div
                            key={material.id}
                            className="flex items-center gap-3 px-4 py-3"
                          >
                            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-gray-600" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {material.title}
                              </p>

                              <p className="text-xs text-gray-500 truncate">
                                {material.fileName}
                              </p>
                            </div>

                            <a
                              href={resolveApiUrl(material.downloadUrl)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                                Tải xuống
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-900">Bài tập</h3>

            <p className="text-sm text-gray-500 mt-1">
              {assignments.length} bài tập trong buổi học
            </p>
          </div>

          <Button size="sm" onClick={() => setShowAssignmentModal(true)}>
            <Plus className="w-4 h-4" />
            Tạo bài tập
          </Button>
        </CardHeader>

        <CardBody>
          {assignments.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />

              <p className="text-sm text-gray-500 mt-3">Chưa có bài tập nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/admin/assignments/${assignment.id}`}
                  className="flex items-center justify-between gap-4 py-4 hover:bg-gray-50 -mx-3 px-3 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {assignment.title}
                        </p>

                        <Badge
                          variant={
                            assignment.type === "quiz" ? "info" : "default"
                          }
                        >
                          {assignment.type === "quiz"
                            ? "Trắc nghiệm"
                            : "Bài tập thường"}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-500 mt-1">
                        Hạn nộp: {formatDateTime(assignment.timeEnd)}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={getAssignmentStatusVariant(assignment.status)}
                  >
                    {getAssignmentStatusLabel(assignment.status)}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <CreateAssignmentModal
        isOpen={showAssignmentModal}
        isSaving={isSavingAssignment}
        onClose={() => setShowAssignmentModal(false)}
        onSubmit={handleAddAssignment}
      />

      <LectureModal
        isOpen={showLectureModal}
        isSaving={isSavingLecture}
        materials={workspaceMaterials}
        lecture={editingLecture}
        onClose={() => {
          setShowLectureModal(false);
          setEditingLecture(null);
        }}
        onSubmit={handleSaveLecture}
      />
    </div>
  );
}
