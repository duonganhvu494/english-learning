import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  FileText,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import Button from "@/app/components/ui/Button";
import Card, {
  CardBody,
  CardHeader,
} from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";

import {
  assignmentsApi,
  attendancesApi,
  classesApi,
  getApiErrorMessage,
  lecturesApi,
  resolveApiUrl,
  sessionsApi,
} from "@/api";

import type {
  AttendanceStatusValue,
  ClassResponse,
  LectureResponse,
  SessionResponse,
} from "@/types";

import { formatDateTime } from "@/app/utils/format";

type SessionAttendance = {
  sessionId: string;
  status: AttendanceStatusValue | null;
};

type ClassroomMaterial = {
  id: string;
  lectureTitle: string;
  fileName: string;
  size: number | null;
  downloadUrl: string;
};

type SessionViewStatus =
  | "upcoming"
  | "ongoing"
  | "completed";

function getSessionStatus(
  session: SessionResponse,
): SessionViewStatus {
  const now = Date.now();

  const start = new Date(
    session.timeStart,
  ).getTime();

  const end = new Date(
    session.timeEnd,
  ).getTime();

  if (now < start) {
    return "upcoming";
  }

  if (now <= end) {
    return "ongoing";
  }

  return "completed";
}

function sessionStatusLabel(
  status: SessionViewStatus,
) {
  if (status === "upcoming") {
    return "Sắp diễn ra";
  }

  if (status === "ongoing") {
    return "Đang diễn ra";
  }

  return "Đã hoàn thành";
}

function sessionStatusVariant(
  status: SessionViewStatus,
): "info" | "success" | "default" {
  if (status === "upcoming") {
    return "info";
  }

  if (status === "ongoing") {
    return "success";
  }

  return "default";
}

function attendanceLabel(
  status: AttendanceStatusValue | null,
) {
  if (status === "present") {
    return "Có mặt";
  }

  if (status === "late") {
    return "Đi trễ";
  }

  if (status === "absent") {
    return "Vắng mặt";
  }

  return "Chưa điểm danh";
}

function attendanceVariant(
  status: AttendanceStatusValue | null,
): "success" | "warning" | "danger" | "default" {
  if (status === "present") {
    return "success";
  }

  if (status === "late") {
    return "warning";
  }

  if (status === "absent") {
    return "danger";
  }

  return "default";
}

function attendanceIcon(
  status: AttendanceStatusValue | null,
) {
  if (status === "present") {
    return (
      <CheckCircle2 className="w-4 h-4 text-green-600" />
    );
  }

  if (status === "late") {
    return (
      <Clock3 className="w-4 h-4 text-yellow-600" />
    );
  }

  if (status === "absent") {
    return (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  }

  return null;
}

function formatFileSize(
  size: number | null,
): string {
  if (!size || size <= 0) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    1024 /
    1024
  ).toFixed(1)} MB`;
}

export default function StudentClassroom() {
  const { classId } = useParams();

  const [isLoading, setIsLoading] =
    useState(true);

  const [classInfo, setClassInfo] =
    useState<ClassResponse | null>(null);

  const [sessions, setSessions] =
    useState<SessionResponse[]>([]);

  const [attendances, setAttendances] =
    useState<SessionAttendance[]>([]);

  const [
    lecturesBySession,
    setLecturesBySession,
  ] = useState<
    Record<string, LectureResponse[]>
  >({});

  const [assignmentCount, setAssignmentCount] =
    useState(0);

  const loadData = async () => {
    if (!classId) {
      return;
    }

    setIsLoading(true);

    try {
      const [myClasses, sessionList] =
        await Promise.all([
          classesApi.listMyClasses(),
          sessionsApi.listClassSessions(
            classId,
          ),
        ]);

      const currentClass =
        myClasses.find(
          (item) => item.id === classId,
        ) ?? null;

      setClassInfo(currentClass);

      const sortedSessions = [
        ...sessionList,
      ].sort(
        (a, b) =>
          new Date(
            b.timeStart,
          ).getTime() -
          new Date(
            a.timeStart,
          ).getTime(),
      );

      setSessions(sortedSessions);

      const sessionData =
        await Promise.all(
          sortedSessions.map(
            async (session) => {
              const [
                attendance,
                lectures,
                assignments,
              ] = await Promise.all([
                attendancesApi
                  .getMyAttendance(
                    session.id,
                  )
                  .catch(() => null),

                lecturesApi
                  .listSessionLectures(
                    session.id,
                  )
                  .catch(
                    () =>
                      [] as LectureResponse[],
                  ),

                assignmentsApi
                  .listSessionAssignments(
                    session.id,
                  )
                  .catch(() => []),
              ]);

              return {
                session,
                attendance,
                lectures,
                assignments,
              };
            },
          ),
        );

      setAttendances(
        sessionData.map((item) => ({
          sessionId: item.session.id,
          status:
            item.attendance?.status ??
            null,
        })),
      );

      const lectureMap: Record<
        string,
        LectureResponse[]
      > = {};

      let totalAssignments = 0;

      sessionData.forEach((item) => {
        lectureMap[item.session.id] =
          item.lectures;

        totalAssignments +=
          item.assignments.length;
      });

      setLecturesBySession(lectureMap);
      setAssignmentCount(
        totalAssignments,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tải thông tin lớp học",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [classId]);

  const attendanceMap = useMemo(
    () =>
      new Map(
        attendances.map((item) => [
          item.sessionId,
          item.status,
        ]),
      ),
    [attendances],
  );

  const attendanceStats = useMemo(() => {
    const present = attendances.filter(
      (item) =>
        item.status === "present",
    ).length;

    const late = attendances.filter(
      (item) =>
        item.status === "late",
    ).length;

    const absent = attendances.filter(
      (item) =>
        item.status === "absent",
    ).length;

    const recorded =
      present + late + absent;

    const rate =
      recorded > 0
        ? Math.round(
            ((present + late) /
              recorded) *
              100,
          )
        : 0;

    return {
      present,
      late,
      absent,
      recorded,
      rate,
    };
  }, [attendances]);

  const materials = useMemo(() => {
    const map = new Map<
      string,
      ClassroomMaterial
    >();

    Object.values(
      lecturesBySession,
    ).forEach((lectures) => {
      lectures.forEach((lecture) => {
        (lecture.materials ?? []).forEach(
          (material) => {
            if (
              !map.has(material.id)
            ) {
              map.set(material.id, {
                id: material.id,
                lectureTitle:
                  lecture.title ||
                  "Bài giảng",
                fileName:
                  material.fileName,
                size: material.size,
                downloadUrl:
                  material.downloadUrl,
              });
            }
          },
        );
      });
    });

    return Array.from(map.values());
  }, [lecturesBySession]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="py-16 text-center text-sm text-gray-500">
          Đang tải lớp học...
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="py-14 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />

            <p className="font-medium text-gray-700 mt-3">
              Không tìm thấy lớp học
            </p>

            <p className="text-sm text-gray-500 mt-1">
              Bạn có thể đã không còn
              tham gia lớp học này.
            </p>

            <Link
              to="/student/classes"
              className="inline-block mt-5"
            >
              <Button variant="outline">
                Quay lại danh sách lớp
              </Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-3">
        <Link to="/student/classes">
          <Button
            variant="ghost"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {classInfo.className}
          </h1>

          <p className="text-gray-600 mt-1">
            {classInfo.description ||
              "Theo dõi các buổi học, tài liệu và tình hình điểm danh của bạn."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-blue-50 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Buổi học
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {sessions.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-violet-50 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-violet-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Bài tập
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {assignmentCount}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-amber-50 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Tài liệu
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {materials.length}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Tỷ lệ tham gia
                </p>

                <p className="text-xl font-bold text-gray-900">
                  {attendanceStats.rate}%
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <h3 className="font-semibold text-gray-900">
                Các buổi học
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Lịch học và trạng thái điểm
                danh của bạn.
              </p>
            </div>
          </CardHeader>

          <CardBody>
            {sessions.length === 0 ? (
              <div className="py-12 text-center">
                <CalendarDays className="w-10 h-10 text-gray-300 mx-auto" />

                <p className="text-sm text-gray-500 mt-3">
                  Chưa có buổi học nào
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map(
                  (session) => {
                    const attendance =
                      attendanceMap.get(
                        session.id,
                      ) ?? null;

                    const status =
                      getSessionStatus(
                        session,
                      );

                    return (
                      <div
                        key={session.id}
                        className="p-4 border border-gray-200 rounded-xl"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {session.topic ||
                                "Buổi học"}
                            </h4>

                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                              <CalendarDays className="w-4 h-4" />

                              <span>
                                {formatDateTime(
                                  session.timeStart,
                                )}
                              </span>
                            </div>

                            <div className="mt-3">
                              <Badge
                                variant={sessionStatusVariant(
                                  status,
                                )}
                              >
                                {sessionStatusLabel(
                                  status,
                                )}
                              </Badge>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {attendanceIcon(
                              attendance,
                            )}

                            <Badge
                              variant={attendanceVariant(
                                attendance,
                              )}
                            >
                              {attendanceLabel(
                                attendance,
                              )}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">
              Điểm danh của tôi
            </h3>
          </CardHeader>

          <CardBody className="space-y-4">
            <div className="text-center p-5 bg-blue-50 rounded-xl">
              <p className="text-4xl font-bold text-blue-600">
                {attendanceStats.rate}%
              </p>

              <p className="text-sm text-gray-600 mt-1">
                Tỷ lệ tham gia
              </p>

              <p className="text-xs text-gray-500 mt-2">
                {attendanceStats.recorded}{" "}
                buổi đã điểm danh
              </p>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">
                  Có mặt
                </span>
              </div>

              <strong>
                {attendanceStats.present}
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">
                  Đi trễ
                </span>
              </div>

              <strong>
                {attendanceStats.late}
              </strong>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm">
                  Vắng mặt
                </span>
              </div>

              <strong>
                {attendanceStats.absent}
              </strong>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <h3 className="font-semibold text-gray-900">
              Tài liệu học tập
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Các tài liệu giáo viên đã chia
              sẻ trong lớp.
            </p>
          </div>
        </CardHeader>

        <CardBody>
          {materials.length === 0 ? (
            <div className="py-10 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto" />

              <p className="text-sm text-gray-500 mt-3">
                Chưa có tài liệu học tập
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {materials.map(
                (material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {
                            material.fileName
                          }
                        </p>

                        <p className="text-sm text-gray-500 truncate">
                          {
                            material.lectureTitle
                          }

                          {formatFileSize(
                            material.size,
                          )
                            ? ` • ${formatFileSize(
                                material.size,
                              )}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <a
                      href={resolveApiUrl(
                        material.downloadUrl,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      title="Tải tài liệu"
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </a>
                  </div>
                ),
              )}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}