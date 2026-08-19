import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Download, Eye } from "lucide-react";
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
  getApiErrorMessage,
  resolveApiUrl,
  submissionsApi,
} from "@/api";
import type {
  AssignmentResponse,
  SubmissionResponse,
} from "@/types";
import { formatDateTime } from "@/app/utils/format";
import ReviewSubmissionModal, {
  type ReviewSubmissionFormValue,
} from "@/app/pages/admin/submissions/ReviewSubmissionModal";

export default function SubmissionsPage() {
  const { assignmentId } = useParams();

  const [showReviewModal, setShowReviewModal] =
    useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assignmentInfo, setAssignmentInfo] =
    useState<AssignmentResponse | null>(null);
  const [submissions, setSubmissions] = useState<
    SubmissionResponse[]
  >([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionResponse | null>(null);

  const loadData = async () => {
    if (!assignmentId) {
      return;
    }

    setIsLoading(true);

    try {
      const [assignment, submissionItems] =
        await Promise.all([
          assignmentsApi.getAssignment(assignmentId),
          submissionsApi.listAssignmentSubmissions(
            assignmentId,
          ),
        ]);

      setAssignmentInfo(assignment);
      setSubmissions(submissionItems);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tải danh sách bài nộp",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [assignmentId]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const submitted = submissions.filter(
      (item) => item.submitted,
    ).length;
    const graded = submissions.filter(
      (item) =>
        item.submitted && item.score !== null,
    ).length;

    return {
      total,
      submitted,
      graded,
      pending: submitted - graded,
    };
  }, [submissions]);

  const handleReview = async (
    submission: SubmissionResponse,
  ) => {
    if (!assignmentId || !submission.submitted) {
      return;
    }

    try {
      const latestSubmission =
        await submissionsApi.getStudentSubmission(
          assignmentId,
          submission.studentId,
        );

      setSelectedSubmission(latestSubmission);
      setShowReviewModal(true);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tải chi tiết bài nộp",
        ),
      );
    }
  };

  const handleSubmitReview = async (
    reviewData: ReviewSubmissionFormValue,
  ) => {
    if (
      !assignmentId ||
      !selectedSubmission ||
      isSubmitting
    ) {
      return;
    }

    const parsedScore = reviewData.score.trim()
      ? Number(reviewData.score)
      : undefined;

    if (
      parsedScore !== undefined &&
      Number.isNaN(parsedScore)
    ) {
      toast.error("Điểm không hợp lệ");
      return;
    }

    setIsSubmitting(true);

    try {
      await submissionsApi.reviewSubmission(
        assignmentId,
        selectedSubmission.studentId,
        {
          score: parsedScore,
          feedback:
            reviewData.feedback.trim() || undefined,
        },
      );

      toast.success("Lưu điểm thành công");
      setShowReviewModal(false);
      setSelectedSubmission(null);
      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể lưu điểm"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (
    submission: SubmissionResponse,
  ) => {
    if (!submission.submitted) {
      return <Badge variant="danger">Chưa nộp</Badge>;
    }

    if (submission.score !== null) {
      return <Badge variant="success">Đã chấm</Badge>;
    }

    return <Badge variant="warning">Chờ chấm</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          to={
            assignmentInfo
              ? `/admin/sessions/${assignmentInfo.sessionId}`
              : "/admin/classes"
          }
        >
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Chấm điểm bài tập
          </h1>

          <p className="text-gray-600 mt-1">
            {assignmentInfo?.title || "Bài tập"}
            {assignmentInfo?.timeEnd
              ? ` • Hạn nộp: ${formatDateTime(
                  assignmentInfo.timeEnd,
                )}`
              : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">
              Tổng số bài
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.total}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">
              Đã nộp
            </p>
            <p className="text-2xl font-bold text-green-600">
              {stats.submitted}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">
              Chờ chấm
            </p>
            <p className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">
              Đã chấm
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {stats.graded}
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">
            Danh sách bài nộp
          </h3>
        </CardHeader>

        <CardBody>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học viên</TableHead>
                <TableHead>Thời gian nộp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!isLoading &&
                submissions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-sm text-gray-500"
                    >
                      Không có dữ liệu bài nộp
                    </TableCell>
                  </TableRow>
                )}

              {submissions.map((submission) => {
                const studentName =
                  submission.studentName || "Học viên";

                return (
                  <TableRow key={submission.studentId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {studentName.charAt(0)}
                          </span>
                        </div>

                        <span className="font-medium">
                          {studentName}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {submission.submittedAt ? (
                        formatDateTime(
                          submission.submittedAt,
                        )
                      ) : (
                        <span className="text-gray-400">
                          Chưa nộp
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(submission)}
                    </TableCell>

                    <TableCell>
                      {submission.score !== null ? (
                        <span className="font-semibold text-blue-600">
                          {submission.score}
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          -
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {submission.material
                          ?.downloadUrl && (
                          <>
                            <a
                              href={resolveApiUrl(
                                submission.material
                                  .downloadUrl,
                              )}
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Eye className="w-3 h-3" />
                              Xem
                            </a>

                            <a
                              href={resolveApiUrl(
                                submission.material
                                  .downloadUrl,
                              )}
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <Download className="w-3 h-3" />
                              Tải
                            </a>
                          </>
                        )}

                        {submission.submitted && (
                          <button
                            onClick={() =>
                              handleReview(submission)
                            }
                            className="text-sm text-green-600 hover:underline"
                          >
                            {submission.score !== null
                              ? "Sửa điểm"
                              : "Chấm điểm"}
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <ReviewSubmissionModal
        isOpen={showReviewModal}
        isSubmitting={isSubmitting}
        submission={selectedSubmission}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedSubmission(null);
        }}
        onSubmit={handleSubmitReview}
      />
    </div>
  );
}