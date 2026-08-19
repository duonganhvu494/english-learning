import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
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
    if (!assignmentId || !assignment || isDeleting) {
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
      await assignmentsApi.deleteAssignment(assignmentId);
      toast.success("Đã xóa bài tập");
      navigate(`/admin/sessions/${assignment.sessionId}`);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể xóa bài tập"),
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

  const isQuiz = assignment.type === "quiz";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start gap-4">
        <Link to={`/admin/sessions/${assignment.sessionId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {assignment.title}
            </h1>

            <Badge variant={isQuiz ? "info" : "default"}>
              {isQuiz ? "Trắc nghiệm" : "Bài tập thường"}
            </Badge>

            <Badge variant={getStatusVariant(assignment.status)}>
              {getStatusLabel(assignment.status)}
            </Badge>
          </div>

          <p className="text-gray-600 mt-2">
            {assignment.description || "Không có mô tả"}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => void handleDelete()}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
          {isDeleting ? "Đang xóa..." : "Xóa"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">
            Thông tin bài tập
          </h3>
        </CardHeader>

        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">
              Thời gian mở
            </p>
            <p className="font-medium text-gray-900">
              {formatDateTime(assignment.timeStart)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">
              Hạn nộp
            </p>
            <p className="font-medium text-gray-900">
              {formatDateTime(assignment.timeEnd)}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">
            Tài liệu đính kèm
          </h3>
        </CardHeader>

        <CardBody>
          {assignment.materials.length === 0 ? (
            <div className="text-sm text-gray-500 py-4">
              Bài tập chưa có tài liệu đính kèm.
            </div>
          ) : (
            <div className="space-y-2">
              {assignment.materials.map((material) => (
                <div
                  key={material.id}
                  className="flex items-center justify-between gap-4 p-3 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0" />

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {material.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {material.fileName}
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

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">
            Quản lý
          </h3>
        </CardHeader>

        <CardBody>
          {isQuiz ? (
            <div className="flex flex-wrap gap-3">
              <Link
                to={`/admin/assignments/${assignment.id}/quiz`}
              >
                <Button>
                  <ListChecks className="w-4 h-4" />
                  Quản lý câu hỏi
                </Button>
              </Link>

              <Link
                to={`/admin/assignments/${assignment.id}/quiz/attempts`}
              >
                <Button variant="outline">
                  <ClipboardCheck className="w-4 h-4" />
                  Xem kết quả
                </Button>
              </Link>
            </div>
          ) : (
            <Link
              to={`/admin/assignments/${assignment.id}/submissions`}
            >
              <Button>
                <ClipboardCheck className="w-4 h-4" />
                Xem và chấm bài nộp
              </Button>
            </Link>
          )}
        </CardBody>
      </Card>
    </div>
  );
}