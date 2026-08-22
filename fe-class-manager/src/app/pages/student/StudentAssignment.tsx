import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileQuestion,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import Button from "@/app/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";

import {
  assignmentsApi,
  classesApi,
  getApiErrorMessage,
  resolveApiUrl,
  submissionsApi,
} from "@/api";

import type {
  AssignmentResponse,
  ClassResponse,
  SubmissionResponse,
} from "@/types";

import { formatDateTime } from "@/app/utils/format";

import StudentQuiz from "@/app/pages/student/components/StudentQuiz";
import StudentManualSubmission from "@/app/pages/student/components/StudentManualSubmission";

type SubmissionViewStatus = "not_submitted" | "submitted" | "graded";

function assignmentTypeLabel(
  type: AssignmentResponse["type"] | undefined,
): string {
  if (type === "quiz") {
    return "Trắc nghiệm";
  }

  if (type === "manual") {
    return "Bài tập nộp tệp";
  }

  return "Bài tập";
}

function assignmentStatusLabel(status: string | undefined): string {
  const normalized = status?.toLowerCase();

  if (normalized === "upcoming") {
    return "Chưa mở";
  }

  if (normalized === "open") {
    return "Đang mở";
  }

  if (normalized === "closed") {
    return "Đã đóng";
  }

  return "Không xác định";
}

function assignmentStatusVariant(
  status: string | undefined,
): "info" | "success" | "default" {
  const normalized = status?.toLowerCase();

  if (normalized === "upcoming") {
    return "info";
  }

  if (normalized === "open") {
    return "success";
  }

  return "default";
}

function submissionStatusLabel(status: SubmissionViewStatus): string {
  if (status === "graded") {
    return "Đã chấm";
  }

  if (status === "submitted") {
    return "Đã nộp";
  }

  return "Chưa nộp";
}

function submissionStatusVariant(
  status: SubmissionViewStatus,
): "success" | "warning" | "danger" {
  if (status === "graded") {
    return "success";
  }

  if (status === "submitted") {
    return "warning";
  }

  return "danger";
}

export default function StudentAssignment() {
  const { assignmentId } = useParams();

  const [assignmentInfo, setAssignmentInfo] =
    useState<AssignmentResponse | null>(null);

  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);

  const [classes, setClasses] = useState<ClassResponse[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!assignmentId) {
      return;
    }

    setIsLoading(true);

    try {
      const assignment = await assignmentsApi.getAssignment(assignmentId);

      setAssignmentInfo(assignment);

      const classPromise = classesApi
        .listMyClasses()
        .catch(() => [] as ClassResponse[]);

      if (assignment.type === "manual") {
        const [classItems, mySubmission] = await Promise.all([
          classPromise,

          submissionsApi.getMySubmission(assignmentId),
        ]);

        setClasses(classItems);
        setSubmission(mySubmission);
      } else {
        const classItems = await classPromise;

        setClasses(classItems);
        setSubmission(null);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải thông tin bài tập"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [assignmentId]);

  const submissionStatus = useMemo<SubmissionViewStatus>(() => {
    if (!submission?.submitted) {
      return "not_submitted";
    }

    if (submission.score !== null && submission.score !== undefined) {
      return "graded";
    }

    return "submitted";
  }, [submission]);

  const className = useMemo(() => {
    if (!assignmentInfo) {
      return null;
    }

    return (
      classes.find((item) => item.id === assignmentInfo.classId)?.className ??
      null
    );
  }, [assignmentInfo, classes]);

  if (isLoading && !assignmentInfo) {
    return (
      <div className="p-6">
        <div className="py-16 text-center text-sm text-gray-500">
          Đang tải bài tập...
        </div>
      </div>
    );
  }

  if (!assignmentInfo || !assignmentId) {
    return (
      <div className="p-6">
        <Card>
          <CardBody className="py-14 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto" />

            <h3 className="font-medium text-gray-800 mt-3">
              Không tìm thấy bài tập
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Bài tập không tồn tại hoặc bạn không có quyền truy cập.
            </p>

            <Link to="/student/assignments" className="inline-block mt-5">
              <Button variant="outline">Quay lại danh sách</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const isQuiz = assignmentInfo.type === "quiz";

  const materials = assignmentInfo.materials ?? [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-3">
        <Link to="/student/assignments">
          <Button variant="ghost" size="sm" title="Quay lại">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {assignmentInfo.title}
            </h1>

            <Badge variant={assignmentStatusVariant(assignmentInfo.status)}>
              {assignmentStatusLabel(assignmentInfo.status)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-gray-500">
            {className && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />

                {className}
              </span>
            )}

            <span className="flex items-center gap-1.5">
              {isQuiz ? (
                <FileQuestion className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}

              {assignmentTypeLabel(assignmentInfo.type)}
            </span>
          </div>
        </div>

        {!isQuiz && (
          <Badge variant={submissionStatusVariant(submissionStatus)}>
            {submissionStatusLabel(submissionStatus)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Thông tin bài tập</h3>
            </CardHeader>

            <CardBody className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Mô tả</p>

                <p className="text-gray-700 whitespace-pre-wrap leading-6">
                  {assignmentInfo.description ||
                    "Giáo viên chưa thêm mô tả cho bài tập này."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-500">
                    {isQuiz ? (
                      <FileQuestion className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}

                    <span className="text-sm">Hình thức</span>
                  </div>

                  <p className="font-medium text-gray-900 mt-2">
                    {assignmentTypeLabel(assignmentInfo.type)}
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-2 text-gray-500">
                    <CalendarDays className="w-4 h-4" />

                    <span className="text-sm">Mở từ</span>
                  </div>

                  <p className="font-medium text-gray-900 mt-2">
                    {formatDateTime(assignmentInfo.timeStart)}
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-xl">
                  <div className="flex items-center gap-2 text-red-500">
                    <Clock3 className="w-4 h-4" />

                    <span className="text-sm">Hạn nộp</span>
                  </div>

                  <p className="font-medium text-red-700 mt-2">
                    {formatDateTime(assignmentInfo.timeEnd)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />

                <div>
                  <h3 className="font-semibold text-gray-900">
                    Tài liệu đính kèm
                  </h3>

                  <p className="text-sm text-gray-500 mt-0.5">
                    Tài liệu giáo viên cung cấp cho bài tập này.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardBody>
              {materials.length === 0 ? (
                <div className="py-9 text-center">
                  <FileText className="w-9 h-9 text-gray-300 mx-auto" />

                  <p className="text-sm text-gray-500 mt-3">
                    Không có tài liệu đính kèm
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((material) => (
                    <div
                      key={material.id}
                      className="flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>

                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {material.fileName}
                          </p>

                          <p className="text-sm text-gray-500 mt-0.5">
                            Tài liệu bài tập
                          </p>
                        </div>
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
            </CardBody>
          </Card>

          {!isQuiz && submissionStatus === "graded" && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />

                  <h3 className="font-semibold text-gray-900">
                    Kết quả bài làm
                  </h3>
                </div>
              </CardHeader>

              <CardBody className="space-y-4">
                <div className="text-center p-6 bg-green-50 rounded-xl">
                  <p className="text-sm text-gray-600">Điểm của bạn</p>

                  <p className="text-5xl font-bold text-green-600 mt-2">
                    {submission?.score}
                  </p>
                </div>

                {submission?.feedback && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-sm font-medium text-gray-900">
                      Nhận xét của giáo viên
                    </p>

                    <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">
                      {submission.feedback}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {isQuiz ? (
            <StudentQuiz
              assignmentId={assignmentId}
              assignmentStatus={assignmentInfo.status}
            />
          ) : (
            <StudentManualSubmission
              assignmentId={assignmentId}
              assignmentStatus={assignmentInfo.status}
              submission={submission}
              onUploaded={loadData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
