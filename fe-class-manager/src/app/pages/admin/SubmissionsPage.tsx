import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Download, Eye } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Modal, { ModalBody, ModalFooter } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function SubmissionsPage() {
  const { assignmentId } = useParams();
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [reviewData, setReviewData] = useState({
    score: '',
    feedback: '',
  });

  const assignmentInfo = {
    id: assignmentId,
    title: 'Bài tập Reading Comprehension',
    class: 'IELTS Foundation 01',
    timeEnd: '10/01/2026 23:59',
  };

  const submissions = [
    {
      studentId: '1',
      studentName: 'Nguyễn Văn A',
      submittedAt: '08/01/2026 14:30',
      status: 'graded',
      score: 8.5,
      fileUrl: 'submission1.pdf',
    },
    {
      studentId: '2',
      studentName: 'Trần Thị B',
      submittedAt: '09/01/2026 10:15',
      status: 'submitted',
      score: null,
      fileUrl: 'submission2.pdf',
    },
    {
      studentId: '3',
      studentName: 'Lê Văn C',
      submittedAt: '10/01/2026 08:45',
      status: 'submitted',
      score: null,
      fileUrl: 'submission3.pdf',
    },
    {
      studentId: '4',
      studentName: 'Phạm Thị D',
      submittedAt: null,
      status: 'not_submitted',
      score: null,
      fileUrl: null,
    },
  ];

  const handleReview = (submission: any) => {
    setSelectedSubmission(submission);
    setReviewData({
      score: submission.score?.toString() || '',
      feedback: '',
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    setShowReviewModal(false);
    setSelectedSubmission(null);
    setReviewData({ score: '', feedback: '' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return <Badge variant="success">Đã chấm</Badge>;
      case 'submitted':
        return <Badge variant="warning">Chờ chấm</Badge>;
      case 'not_submitted':
        return <Badge variant="danger">Chưa nộp</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/sessions/1">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Chấm điểm bài tập</h1>
          <p className="text-gray-600 mt-1">
            {assignmentInfo.title} • {assignmentInfo.class}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">Tổng số bài</p>
            <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">Đã nộp</p>
            <p className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status !== 'not_submitted').length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">Chờ chấm</p>
            <p className="text-2xl font-bold text-yellow-600">
              {submissions.filter(s => s.status === 'submitted').length}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-1">Đã chấm</p>
            <p className="text-2xl font-bold text-blue-600">
              {submissions.filter(s => s.status === 'graded').length}
            </p>
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
                <TableHead>Thời gian nộp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Điểm</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.studentId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {submission.studentName.charAt(0)}
                        </span>
                      </div>
                      <span className="font-medium">{submission.studentName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {submission.submittedAt || <span className="text-gray-400">Chưa nộp</span>}
                  </TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>
                    {submission.score !== null ? (
                      <span className="font-semibold text-blue-600">{submission.score}/10</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {submission.fileUrl && (
                        <>
                          <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Xem
                          </button>
                          <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            Tải
                          </button>
                        </>
                      )}
                      {submission.status !== 'not_submitted' && (
                        <button
                          onClick={() => handleReview(submission)}
                          className="text-sm text-green-600 hover:underline"
                        >
                          {submission.status === 'graded' ? 'Sửa điểm' : 'Chấm điểm'}
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
        title="Chấm điểm bài nộp"
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
                <p className="text-sm font-medium text-gray-700">Bài làm của học viên</p>
                <Button variant="outline" size="sm">
                  <Download className="w-3 h-3" />
                  Tải xuống
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                File: {selectedSubmission?.fileUrl}
              </p>
            </div>

            <Input
              label="Điểm số (0-10)"
              type="number"
              name="score"
              placeholder="Nhập điểm"
              min="0"
              max="10"
              step="0.1"
              value={reviewData.score}
              onChange={(e) => setReviewData({ ...reviewData, score: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nhận xét
              </label>
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
              Hủy
            </Button>
            <Button type="submit">Lưu điểm</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
