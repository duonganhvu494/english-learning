import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Download, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Modal, { ModalBody, ModalFooter } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { assignmentsApi, getApiErrorMessage, resolveApiUrl, submissionsApi } from '@/api';
import type { AssignmentResponse, SubmissionResponse } from '@/types';
import { formatDateTime } from '@/app/utils/format';

export default function SubmissionsPage() {
  const { assignmentId } = useParams();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignmentInfo, setAssignmentInfo] = useState<AssignmentResponse | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionResponse[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionResponse | null>(null);
  const [reviewData, setReviewData] = useState({
    score: '',
    feedback: '',
  });

  const loadData = async () => {
    if (!assignmentId) {
      return;
    }

    setIsLoading(true);
    try {
      const [assignment, submissionItems] = await Promise.all([
        assignmentsApi.getAssignment(assignmentId),
        submissionsApi.listAssignmentSubmissions(assignmentId),
      ]);
      setAssignmentInfo(assignment);
      setSubmissions(submissionItems);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải danh sách bài nộp'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [assignmentId]);

  const stats = useMemo(() => {
    const total = submissions.length;
    const submitted = submissions.filter((item) => item.submitted).length;
    const graded = submissions.filter((item) => item.submitted && item.score !== null).length;
    const pending = submitted - graded;
    return { total, submitted, graded, pending };
  }, [submissions]);

  const handleReview = async (submission: SubmissionResponse) => {
    if (!assignmentId || !submission.submitted) {
      return;
    }

    try {
      const latestSubmission = await submissionsApi.getStudentSubmission(
        assignmentId,
        submission.studentId,
      );
      setSelectedSubmission(latestSubmission);
      setReviewData({
        score: latestSubmission.score?.toString() || '',
        feedback: latestSubmission.feedback || '',
      });
      setShowReviewModal(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải chi tiết bài nộp'));
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId || !selectedSubmission || isSubmitting) {
      return;
    }

    const parsedScore = reviewData.score.trim() ? Number(reviewData.score) : undefined;
    if (parsedScore !== undefined && Number.isNaN(parsedScore)) {
      toast.error('Diem khong hop le');
      return;
    }

    setIsSubmitting(true);
    try {
      await submissionsApi.reviewSubmission(assignmentId, selectedSubmission.studentId, {
        score: parsedScore,
        feedback: reviewData.feedback.trim() || undefined,
      });
      toast.success('Lưu điểm thanh cong');
      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewData({ score: '', feedback: '' });
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu điểm'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (submission: SubmissionResponse) => {
    if (!submission.submitted) {
      return <Badge variant="danger">Chưa nộp</Badge>;
    }
    if (submission.score !== null) {
      return <Badge variant="success">Da cham</Badge>;
    }
    return <Badge variant="warning">Cho cham</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={assignmentInfo ? `/admin/sessions/${assignmentInfo.sessionId}` : '/admin/classes'}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Cham diem bai tap</h1>
          <p className="text-gray-600 mt-1">
            {assignmentInfo?.title || 'Assignment'} • Class {assignmentInfo?.classId || '-'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">Tong so bai</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">Da nop</p>
            <p className="text-2xl font-bold text-green-600">{stats.submitted}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">Cho cham</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">Da cham</p>
            <p className="text-2xl font-bold text-blue-600">{stats.graded}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Danh sách bài nộp</h3>
        </CardHeader>
        <CardBody>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Học viên</TableHead>
                <TableHead>Thoi gian nop</TableHead>
                <TableHead>Trang thai</TableHead>
                <TableHead>Diem</TableHead>
                <TableHead>Thao tac</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && submissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="text-center py-8 text-sm text-gray-500">Không có dữ liệu bài nộp</div>
                  </TableCell>
                </TableRow>
              )}
              {submissions.map((submission) => (
                <TableRow key={submission.studentId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {(submission.studentName || 'U').charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{submission.studentName || submission.studentId}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {submission.submittedAt ? (
                      formatDateTime(submission.submittedAt)
                    ) : (
                      <span className="text-gray-400">Chưa nộp</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(submission)}</TableCell>
                  <TableCell>
                    {submission.score !== null ? (
                      <span className="font-semibold text-blue-600">{submission.score}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {submission.material?.downloadUrl && (
                        <>
                          <a
                            href={resolveApiUrl(submission.material.downloadUrl)}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Eye className="w-3 h-3" />
                            Xem
                          </a>
                          <a
                            href={resolveApiUrl(submission.material.downloadUrl)}
                            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="w-3 h-3" />
                            Tai
                          </a>
                        </>
                      )}
                      {submission.submitted && (
                        <button
                          onClick={() => handleReview(submission)}
                          className="text-sm text-green-600 hover:underline"
                        >
                          {submission.score !== null ? 'Sua diem' : 'Cham diem'}
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Cham diem bai nop"
        size="lg"
      >
        <form onSubmit={handleSubmitReview}>
          <ModalBody className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Học viên: <span className="font-medium text-gray-900">{selectedSubmission?.studentName}</span>
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">Bai lam cua hoc vien</p>
                {selectedSubmission?.material?.downloadUrl && (
                  <a href={resolveApiUrl(selectedSubmission.material.downloadUrl)} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="w-3 h-3" />
                      Tai xuong
                    </Button>
                  </a>
                )}
              </div>
              <p className="text-sm text-gray-600">
                File: {selectedSubmission?.material?.fileName || 'Không có file'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Nop luc: {selectedSubmission?.submittedAt ? formatDateTime(selectedSubmission.submittedAt) : '-'}
              </p>
            </div>

            <Input
              label="Diem so"
              type="number"
              name="score"
              placeholder="Nhập điểm"
              min="0"
              max="10"
              step="0.1"
              value={reviewData.score}
              onChange={(e) => setReviewData({ ...reviewData, score: e.target.value })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét</label>
              <textarea
                name="feedback"
                placeholder="Nhận xét về bài làm của học viên..."
                value={reviewData.feedback}
                onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={6}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)} type="button">
              Huy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu điểm'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}


