import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Upload, FileText, Download, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { assignmentsApi, getApiErrorMessage, resolveApiUrl, submissionsApi } from '@/api';
import type { AssignmentResponse, SubmissionResponse } from '@/types';
import { formatDateTime } from '@/app/utils/format';

export default function StudentAssignment() {
  const { assignmentId } = useParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignmentInfo, setAssignmentInfo] = useState<AssignmentResponse | null>(null);
  const [submission, setSubmission] = useState<SubmissionResponse | null>(null);

  const loadData = async () => {
    if (!assignmentId) {
      return;
    }

    setIsLoading(true);
    try {
      const [assignment, mySubmission] = await Promise.all([
        assignmentsApi.getAssignment(assignmentId),
        submissionsApi.getMySubmission(assignmentId),
      ]);
      setAssignmentInfo(assignment);
      setSubmission(mySubmission);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải thông tin bài tập'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [assignmentId]);

  const submissionStatus = useMemo(() => {
    if (!submission?.submitted) {
      return 'not_submitted';
    }
    if (submission.score !== null) {
      return 'graded';
    }
    return 'submitted';
  }, [submission]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentId || !selectedFile || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadSession = await submissionsApi.initMyUpload(assignmentId, {
        fileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        size: selectedFile.size,
      });
      toast.success(`Khoi tao upload thanh cong. UploadId: ${uploadSession.uploadId}`);
      setSelectedFile(null);
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể khởi tạo upload bài nộp'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/student/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{assignmentInfo?.title || 'Assignment'}</h1>
          <p className="text-gray-600 mt-1">Class {assignmentInfo?.classId || '-'}</p>
        </div>
        {submissionStatus === 'not_submitted' && <Badge variant="danger">Chưa nộp</Badge>}
        {submissionStatus === 'submitted' && <Badge variant="warning">Cho cham</Badge>}
        {submissionStatus === 'graded' && <Badge variant="success">Da cham</Badge>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Thong tin bai tap</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Mô tả</p>
                <p className="text-gray-900">{assignmentInfo?.description || 'Không có mô tả'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Loai</p>
                  <p className="font-medium text-gray-900">{assignmentInfo?.type || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trang thai</p>
                  <p className="font-medium text-gray-900">{assignmentInfo?.status || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mo luc</p>
                  <p className="font-medium text-gray-900">{formatDateTime(assignmentInfo?.timeStart)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hạn nộp</p>
                  <p className="font-medium text-red-600">{formatDateTime(assignmentInfo?.timeEnd)}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Tài liệu đính kèm</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {(assignmentInfo?.materials || []).length === 0 && (
                  <div className="text-sm text-gray-500">Không có tài liệu đính kèm</div>
                )}
                {(assignmentInfo?.materials || []).map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{material.fileName}</p>
                        <p className="text-sm text-gray-600">{material.mimeType}</p>
                      </div>
                    </div>
                    <a href={resolveApiUrl(material.downloadUrl)} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {submissionStatus === 'graded' && (
            <Card>
              <CardHeader className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Ket qua</h3>
              </CardHeader>
              <CardBody>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg mb-4">
                  <p className="text-5xl font-bold text-green-600 mb-2">
                    {submission?.score}
                  </p>
                  <p className="text-sm text-gray-600">Diem cua ban</p>
                </div>

                {submission?.feedback && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">Nhận xét của giáo viên</p>
                    <p className="text-sm text-gray-700 italic">"{submission.feedback}"</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Nop bai</h3>
            </CardHeader>
            <CardBody>
              {submissionStatus === 'not_submitted' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tai len bai lam</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                        accept=".pdf,.doc,.docx"
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {selectedFile ? selectedFile.name : 'Keo tha file hoac click de chon'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX</p>
                      </label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={!selectedFile || isSubmitting || isLoading}>
                    <Upload className="w-4 h-4" />
                    {isSubmitting ? 'Đang khởi tạo upload...' : 'Khởi tạo nộp bài'}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Trang hien tai dang dung endpoint upload-init. Luong upload day du co the duoc bo sung sau.
                  </p>
                </form>
              )}

              {submissionStatus !== 'not_submitted' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <p className="font-medium text-blue-900">Đã có bài nộp</p>
                    </div>
                    <p className="text-sm text-blue-700">Nop luc: {formatDateTime(submission?.submittedAt)}</p>
                    <p className="text-sm text-blue-700">File: {submission?.material?.fileName || '-'}</p>
                  </div>

                  {submission?.material?.downloadUrl && (
                    <a href={resolveApiUrl(submission.material.downloadUrl)} target="_blank" rel="noreferrer">
                      <Button variant="outline" className="w-full">
                        <Download className="w-4 h-4" />
                        Tai bai nop
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}


