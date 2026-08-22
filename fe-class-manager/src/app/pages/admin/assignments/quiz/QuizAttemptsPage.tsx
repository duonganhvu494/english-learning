import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Eye } from "lucide-react";
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
import { assignmentQuizApi, assignmentsApi, getApiErrorMessage } from "@/api";
import type {
  AssignmentQuizAttemptResponse,
  AssignmentResponse,
} from "@/types";
import { formatDateTime } from "@/app/utils/format";
import QuizAttemptDetailModal from "@/app/pages/admin/assignments/quiz/QuizAttemptDetailModal";

type AttemptViewStatus = "not_started" | "in_progress" | "submitted";

function normalizeAttemptStatus(
  attempt: AssignmentQuizAttemptResponse,
): AttemptViewStatus {
  const normalizedStatus = String(attempt.status ?? "").toLowerCase();

  if (attempt.submittedAt || normalizedStatus === "submitted") {
    return "submitted";
  }

  if (attempt.startedAt || normalizedStatus === "in_progress") {
    return "in_progress";
  }

  return "not_started";
}

function statusBadge(attempt: AssignmentQuizAttemptResponse) {
  const status = normalizeAttemptStatus(attempt);

  if (status === "submitted") {
    return <Badge variant="success">Đã nộp</Badge>;
  }

  if (status === "in_progress") {
    return <Badge variant="warning">Đang làm</Badge>;
  }

  return <Badge variant="default">Chưa bắt đầu</Badge>;
}

export default function QuizAttemptsPage() {
  const { assignmentId } = useParams();

  const [assignment, setAssignment] = useState<AssignmentResponse | null>(null);
  const [attempts, setAttempts] = useState<AssignmentQuizAttemptResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] =
    useState<AssignmentQuizAttemptResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  const loadData = async () => {
    if (!assignmentId) {
      return;
    }

    setIsLoading(true);

    try {
      const [assignmentResult, attemptItems] = await Promise.all([
        assignmentsApi.getAssignment(assignmentId),
        assignmentQuizApi.listAttempts(assignmentId),
      ]);

      setAssignment(assignmentResult);
      setAttempts(attemptItems);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải kết quả trắc nghiệm"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [assignmentId]);

  const stats = useMemo(() => {
    const submitted = attempts.filter(
      (attempt) => normalizeAttemptStatus(attempt) === "submitted",
    ).length;

    const inProgress = attempts.filter(
      (attempt) => normalizeAttemptStatus(attempt) === "in_progress",
    ).length;

    return {
      total: attempts.length,
      submitted,
      inProgress,
      notStarted: attempts.length - submitted - inProgress,
    };
  }, [attempts]);

  const handleViewAttempt = async (attempt: AssignmentQuizAttemptResponse) => {
    if (!assignmentId) {
      return;
    }

    setShowDetailModal(true);
    setSelectedAttempt(attempt);
    setIsLoadingDetail(true);

    try {
      const detail = await assignmentQuizApi.getAttempt(
        assignmentId,
        attempt.studentId,
      );

      setSelectedAttempt({
        ...detail,
        studentName: detail.studentName ?? attempt.studentName,
        studentEmail: detail.studentEmail ?? attempt.studentEmail,
      });
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể tải chi tiết bài làm"));
    } finally {
      setIsLoadingDetail(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-gray-500">Đang tải kết quả...</div>;
  }
  console.log("attempt", attempts);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={
            assignment
              ? `/admin/assignments/${assignment.id}/quiz`
              : "/admin/classes"
          }
        >
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kết quả trắc nghiệm
          </h1>
          <p className="text-gray-600 mt-1">
            {assignment?.title || "Bài trắc nghiệm"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Tổng học viên</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.total}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Đã nộp</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats.submitted}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Đang làm</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {stats.inProgress}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600">Chưa bắt đầu</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.notStarted}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Danh sách học viên</h3>
        </CardHeader>

        <CardBody>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học viên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Bắt đầu</TableHead>
                <TableHead>Nộp bài</TableHead>
                <TableHead>Kết quả</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {attempts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-sm text-gray-500"
                  >
                    Chưa có học viên trong danh sách kết quả.
                  </TableCell>
                </TableRow>
              )}

              {attempts.map((attempt) => {
                const displayName =
                  attempt.studentName ||
                  attempt.studentEmail ||
                  "Không có thông tin học viên";

                const viewStatus = normalizeAttemptStatus(attempt);

                return (
                  <TableRow key={attempt.studentId}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">
                          {displayName}
                        </p>

                        {attempt.studentName && attempt.studentEmail && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {attempt.studentEmail}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>{statusBadge(attempt)}</TableCell>

                    <TableCell>
                      {attempt.startedAt
                        ? formatDateTime(attempt.startedAt)
                        : "-"}
                    </TableCell>

                    <TableCell>
                      {attempt.submittedAt
                        ? formatDateTime(attempt.submittedAt)
                        : "-"}
                    </TableCell>

                    <TableCell>
                      {attempt.score !== null && attempt.maxScore !== null ? (
                        <div>
                          <p className="font-semibold text-blue-600">
                            {attempt.score}/{attempt.maxScore}
                          </p>
                          <p className="text-xs text-gray-500">
                            {attempt.correctCount}/{attempt.totalQuestions} câu
                            đúng
                          </p>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>

                    <TableCell>
                      {viewStatus === "not_started" ? (
                        <span className="text-sm text-gray-400">-</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void handleViewAttempt(attempt)}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Eye className="w-4 h-4" />
                          Xem chi tiết
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <QuizAttemptDetailModal
        isOpen={showDetailModal}
        attempt={selectedAttempt}
        isLoading={isLoadingDetail}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedAttempt(null);
        }}
      />
    </div>
  );
}
