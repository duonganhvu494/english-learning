import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Download,
  FileText,
  Plus,
  Upload,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import Button from "@/app/components/ui/Button";
import Card, {
  CardBody,
  CardHeader,
} from "@/app/components/ui/Card";
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
  resolveApiUrl,
  sessionsApi,
} from "@/api";
import type {
  AssignmentResponse,
  AttendanceItem,
  AttendanceStatusInput,
  AttendanceStatusValue,
  LectureResponse,
  SessionResponse,
} from "@/types";
import {
  formatDateTime,
  toIsoFromLocalDateTime,
} from "@/app/utils/format";
import CreateAssignmentModal, {
  type CreateAssignmentFormValue,
} from "@/app//pages/admin/assignments/CreateAssignmentModal";

type ActiveTab =
  | "attendance"
  | "assignments"
  | "materials";

type AttendanceViewStatus =
  | "UNMARKED"
  | "PRESENT"
  | "ABSENT"
  | "LATE";

type MarkedAttendanceViewStatus = Exclude<
  AttendanceViewStatus,
  "UNMARKED"
>;

interface SessionMaterialItem {
  key: string;
  lectureTitle: string;
  title: string;
  fileName: string;
  downloadUrl: string;
}

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

function getAttendanceStatusLabel(
  status: AttendanceViewStatus,
): string {
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

function getAttendanceStatusColor(
  status: AttendanceViewStatus,
): string {
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

  const [activeTab, setActiveTab] =
    useState<ActiveTab>("attendance");
  const [showAssignmentModal, setShowAssignmentModal] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAssignment, setIsSavingAssignment] =
    useState(false);

  const [sessionInfo, setSessionInfo] =
    useState<SessionResponse | null>(null);
  const [attendanceItems, setAttendanceItems] = useState<
    AttendanceItem[]
  >([]);
  const [assignments, setAssignments] = useState<
    AssignmentResponse[]
  >([]);
  const [lectures, setLectures] = useState<
    LectureResponse[]
  >([]);

  const loadData = async () => {
    if (!sessionId) {
      return;
    }

    setIsLoading(true);

    try {
      const [
        session,
        attendances,
        sessionAssignments,
        sessionLectures,
      ] = await Promise.all([
        sessionsApi.getSession(sessionId),
        attendancesApi.getSessionAttendances(sessionId),
        assignmentsApi.listSessionAssignments(sessionId),
        lecturesApi.listSessionLectures(sessionId),
      ]);

      setSessionInfo(session);
      setAttendanceItems(attendances.attendances);
      setAssignments(sessionAssignments);
      setLectures(sessionLectures);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tải chi tiết buổi học",
        ),
      );
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

  const sessionMaterials = useMemo(() => {
    const items: SessionMaterialItem[] = [];

    lectures.forEach((lecture) => {
      lecture.materials.forEach((material) => {
        items.push({
          key: `${lecture.id}-${material.id}`,
          lectureTitle: lecture.title,
          title: material.fileName,
          fileName: material.fileName,
          downloadUrl: material.downloadUrl,
        });
      });
    });

    return items;
  }, [lectures]);

  const handleAttendanceChange = async (
    studentId: string,
    status: MarkedAttendanceViewStatus,
  ) => {
    if (!sessionId) {
      return;
    }

    try {
      await attendancesApi.updateAttendance(
        sessionId,
        studentId,
        {
          status: fromViewStatus(status),
        },
      );

      setAttendanceItems((prev) =>
        prev.map((item) =>
          item.studentId === studentId
            ? {
                ...item,
                status:
                  status.toLowerCase() as AttendanceStatusValue,
              }
            : item,
        ),
      );

      toast.success("Cập nhật điểm danh thành công");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể cập nhật điểm danh",
        ),
      );
    }
  };

  const handleAddAssignment = async (
    formData: CreateAssignmentFormValue,
  ) => {
    if (!sessionId || isSavingAssignment) {
      return;
    }

    setIsSavingAssignment(true);

    try {
      await assignmentsApi.createAssignment(sessionId, {
        title: formData.title,
        description:
          formData.description.trim() || undefined,
        timeStart: toIsoFromLocalDateTime(
          formData.timeStart,
        ),
        timeEnd: toIsoFromLocalDateTime(formData.timeEnd),
        type: formData.type,
        materialIds: formData.materialIds,
      });

      toast.success("Tạo bài tập thành công");
      setShowAssignmentModal(false);
      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tạo bài tập"),
      );
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const tabs: Array<{
    id: ActiveTab;
    label: string;
    icon: typeof UserCheck;
  }> = [
    {
      id: "attendance",
      label: "Điểm danh",
      icon: UserCheck,
    },
    {
      id: "assignments",
      label: "Bài tập",
      icon: FileText,
    },
    {
      id: "materials",
      label: "Tài liệu",
      icon: Upload,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
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

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {sessionInfo?.topic || "Chi tiết buổi học"}
          </h1>
          <p className="text-gray-600 mt-1">
            {sessionInfo
              ? `${formatDateTime(
                  sessionInfo.timeStart,
                )} - ${formatDateTime(
                  sessionInfo.timeEnd,
                )}`
              : "-"}
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

      {activeTab === "attendance" && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">
              Điểm danh học viên
            </h3>
          </CardHeader>

          <CardBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!isLoading &&
                  attendanceView.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center py-8 text-sm text-gray-500"
                      >
                        Chưa có dữ liệu điểm danh
                      </TableCell>
                    </TableRow>
                  )}

                {attendanceView.map((attendance) => (
                  <TableRow key={attendance.studentId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {attendance.fullName.charAt(0)}
                          </span>
                        </div>

                        <span className="font-medium">
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
                        {getAttendanceStatusLabel(
                          attendance.viewStatus,
                        )}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            handleAttendanceChange(
                              attendance.studentId,
                              "PRESENT",
                            )
                          }
                          className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          Có mặt
                        </button>

                        <button
                          onClick={() =>
                            handleAttendanceChange(
                              attendance.studentId,
                              "LATE",
                            )
                          }
                          className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          Trễ
                        </button>

                        <button
                          onClick={() =>
                            handleAttendanceChange(
                              attendance.studentId,
                              "ABSENT",
                            )
                          }
                          className="px-3 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
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
      )}

      {activeTab === "assignments" && (
        <Card>
          <CardHeader className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900">
              Bài tập
            </h3>

            <Button
              size="sm"
              onClick={() => setShowAssignmentModal(true)}
            >
              <Plus className="w-4 h-4" />
              Tạo bài tập
            </Button>
          </CardHeader>

          <CardBody>
            <div className="space-y-3">
              {!isLoading && assignments.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500 border rounded-lg">
                  Chưa có bài tập nào
                </div>
              )}

              {assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/admin/assignments/${assignment.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {assignment.title}
                        </h4>

                        <Badge
                          variant={
                            assignment.type === "quiz"
                              ? "info"
                              : "default"
                          }
                        >
                          {assignment.type === "quiz"
                            ? "Trắc nghiệm"
                            : "Bài tập thường"}
                        </Badge>

                        <Badge
                          variant={getAssignmentStatusVariant(
                            assignment.status,
                          )}
                        >
                          {getAssignmentStatusLabel(
                            assignment.status,
                          )}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">
                        Hạn nộp:{" "}
                        {formatDateTime(assignment.timeEnd)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === "materials" && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="font-semibold text-gray-900">
                Tài liệu buổi học
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Các tài liệu được gắn vào bài giảng của
                buổi học này.
              </p>
            </div>
          </CardHeader>

          <CardBody>
            {sessionMaterials.length === 0 ? (
              <div className="text-sm text-gray-500 py-6 text-center">
                Buổi học chưa có tài liệu.
              </div>
            ) : (
              <div className="space-y-2">
                {sessionMaterials.map((material) => (
                  <div
                    key={material.key}
                    className="flex items-center justify-between gap-4 p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {material.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {material.fileName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Bài giảng: {material.lectureTitle}
                      </p>
                    </div>

                    <a
                      href={resolveApiUrl(
                        material.downloadUrl,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <Download className="w-4 h-4" />
                        Tải xuống
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      <CreateAssignmentModal
        isOpen={showAssignmentModal}
        isSaving={isSavingAssignment}
        onClose={() => setShowAssignmentModal(false)}
        onSubmit={handleAddAssignment}
      />
    </div>
  );
}