import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarClock,
  ClipboardCheck,
  Download,
  FileText,
  ListChecks,
  Trash2,
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
  getApiErrorMessage,
  resolveApiUrl,
} from "@/api";

import type { AssignmentResponse } from "@/types";
import { formatDateTime } from "@/app/utils/format";

function getStatusLabel(status: string): string {
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

function getStatusVariant(
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

export default function AssignmentDetailPage() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();

  const [assignment, setAssignment] =
    useState<AssignmentResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAssignment = async () => {
    if (!assignmentId) {
      return;
    }

    setIsLoading(true);

    try {
      const result =
        await assignmentsApi.getAssignment(assignmentId);

      setAssignment(result);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tải chi tiết bài tập",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadAssignment();
  }, [assignmentId]);

  const handleDelete = async () => {
    if (
      !assignmentId ||
      !assignment ||
      isDeleting
    ) {
      return;
    }

    if (
      !confirm(
        `Bạn có chắc chắn muốn xóa bài tập "${assignment.title}"?`,
      )
    ) {
      return;
    }

    setIsDeleting(true);

    try {
      await assignmentsApi.deleteAssignment(
        assignmentId,
      );

      toast.success("Đã xóa bài tập");

      navigate(
        `/admin/sessions/${assignment.sessionId}`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể xóa bài tập",
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Đang tải bài tập...
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6 text-sm text-gray-500">
        Không tìm thấy bài tập.
      </div>
    );
  }

  const isQuiz =
    assignment.type.toLowerCase() === "quiz";

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          <Link
            to={`/admin/sessions/${assignment.sessionId}`}
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {assignment.title}
              </h1>

              <Badge
                variant={
                  isQuiz ? "info" : "default"
                }
              >
                {isQuiz
                  ? "Trắc nghiệm"
                  : "Bài tập thường"}
              </Badge>

              <Badge
                variant={getStatusVariant(
                  assignment.status,
                )}
              >
                {getStatusLabel(
                  assignment.status,
                )}
              </Badge>
            </div>

            <p className="text-gray-600 mt-2">
              {assignment.description ||
                "Không có mô tả"}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          disabled={isDeleting}
          onClick={() => void handleDelete()}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
          {isDeleting ? "Đang xóa..." : "Xóa bài tập"}
        </Button>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">
              Loại bài tập
            </p>

            <div className="flex items-center gap-2 mt-2">
              <FileText className="w-5 h-5 text-blue-600" />

              <p className="font-semibold text-gray-900">
                {isQuiz
                  ? "Trắc nghiệm"
                  : "Bài tập thường"}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">
              Trạng thái
            </p>

            <div className="mt-2">
              <Badge
                variant={getStatusVariant(
                  assignment.status,
                )}
              >
                {getStatusLabel(
                  assignment.status,
                )}
              </Badge>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">
              Thời gian mở
            </p>

            <div className="flex items-center gap-2 mt-2">
              <CalendarClock className="w-5 h-5 text-blue-600 shrink-0" />

              <p className="text-sm font-medium text-gray-900">
                {formatDateTime(
                  assignment.timeStart,
                )}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">
              Hạn nộp
            </p>

            <div className="flex items-center gap-2 mt-2">
              <CalendarClock className="w-5 h-5 text-orange-500 shrink-0" />

              <p className="text-sm font-medium text-gray-900">
                {formatDateTime(
                  assignment.timeEnd,
                )}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* MATERIALS */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <h3 className="font-semibold text-gray-900">
                Tài liệu đính kèm
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {assignment.materials.length} tài liệu
              </p>
            </div>
          </CardHeader>

          <CardBody>
            {assignment.materials.length === 0 ? (
              <div className="py-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto" />

                <p className="text-sm text-gray-500 mt-3">
                  Bài tập chưa có tài liệu đính kèm
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {assignment.materials.map(
                  (material) => (
                    <div
                      key={material.id}
                      className="flex items-center gap-4 py-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {material.title}
                        </p>

                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {material.fileName}
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
                  ),
                )}
              </div>
            )}
          </CardBody>
        </Card>

        {/* MANAGEMENT */}
        <Card>
          <CardHeader>
            <div>
              <h3 className="font-semibold text-gray-900">
                Quản lý
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Các thao tác với bài tập
              </p>
            </div>
          </CardHeader>

          <CardBody>
            {isQuiz ? (
              <div className="space-y-3">
                <Link
                  className="block"
                  to={`/admin/assignments/${assignment.id}/quiz`}
                >
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <ListChecks className="w-5 h-5 text-blue-600" />
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        Quản lý câu hỏi
                      </p>

                      <p className="text-sm text-gray-500 mt-0.5">
                        Thêm, sửa và xóa câu hỏi
                      </p>
                    </div>
                  </button>
                </Link>

                <Link
                  className="block"
                  to={`/admin/assignments/${assignment.id}/quiz/attempts`}
                >
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                      <ClipboardCheck className="w-5 h-5 text-green-600" />
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        Xem kết quả
                      </p>

                      <p className="text-sm text-gray-500 mt-0.5">
                        Theo dõi kết quả học viên
                      </p>
                    </div>
                  </button>
                </Link>
              </div>
            ) : (
              <Link
                className="block"
                to={`/admin/assignments/${assignment.id}/submissions`}
              >
                <button
                  type="button"
                  className="w-full flex items-center gap-3 p-4 border border-gray-200 rounded-lg text-left hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-5 h-5 text-green-600" />
                  </div>

                  <div>
                    <p className="font-medium text-gray-900">
                      Bài nộp
                    </p>

                    <p className="text-sm text-gray-500 mt-0.5">
                      Xem và chấm bài học viên
                    </p>
                  </div>
                </button>
              </Link>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}