import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Upload, FileText, Download, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function StudentAssignment() {
  const { assignmentId } = useParams();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const assignmentInfo = {
    id: assignmentId,
    title: 'Bài tập Reading Comprehension',
    description: 'Hoàn thành các câu hỏi reading từ Unit 3, tập trung vào kỹ năng skimming và scanning. Đọc kỹ đoạn văn và trả lời đầy đủ các câu hỏi.',
    className: 'IELTS Foundation 01',
    teacher: 'Nguyễn Thị Lan',
    timeStart: '05/05/2026 00:00',
    timeEnd: '10/05/2026 23:59',
    type: 'MANUAL',
    maxScore: 10,
  };

  const materials = [
    { id: '1', name: 'Đề bài - Reading Unit 3.pdf', size: '1.5 MB' },
    { id: '2', name: 'Hướng dẫn làm bài.docx', size: '500 KB' },
  ];

  const submission = {
    status: 'not_submitted',
    submittedAt: null,
    fileName: null,
    score: null,
    feedback: null,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    alert('Bài tập đã được nộp thành công!');
  };

  const daysLeft = 5;
  const hoursLeft = 14;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/student/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{assignmentInfo.title}</h1>
          <p className="text-gray-600 mt-1">{assignmentInfo.className}</p>
        </div>
        {submission.status === 'not_submitted' && (
          <Badge variant="danger">Chưa nộp</Badge>
        )}
        {submission.status === 'submitted' && (
          <Badge variant="warning">Chờ chấm</Badge>
        )}
        {submission.status === 'graded' && (
          <Badge variant="success">Đã chấm</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Thông tin bài tập</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Mô tả</p>
                <p className="text-gray-900">{assignmentInfo.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Giáo viên</p>
                  <p className="font-medium text-gray-900">{assignmentInfo.teacher}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Điểm tối đa</p>
                  <p className="font-medium text-gray-900">{assignmentInfo.maxScore} điểm</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mở lúc</p>
                  <p className="font-medium text-gray-900">{assignmentInfo.timeStart}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hạn nộp</p>
                  <p className="font-medium text-red-600">{assignmentInfo.timeEnd}</p>
                </div>
              </div>

              {submission.status === 'not_submitted' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-600 font-bold">!</span>
                    </div>
                    <div>
                      <p className="font-medium text-yellow-900">Thời gian còn lại</p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Còn {daysLeft} ngày {hoursLeft} giờ để nộp bài
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Tài liệu đính kèm</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {materials.map((material) => (
                  <div
                    key={material.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{material.name}</p>
                        <p className="text-sm text-gray-600">{material.size}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {submission.status === 'graded' && (
            <Card>
              <CardHeader className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Kết quả</h3>
              </CardHeader>
              <CardBody>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg mb-4">
                  <p className="text-5xl font-bold text-green-600 mb-2">
                    {submission.score}
                    <span className="text-2xl text-gray-600">/{assignmentInfo.maxScore}</span>
                  </p>
                  <p className="text-sm text-gray-600">Điểm của bạn</p>
                </div>

                {submission.feedback && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 mb-2">Nhận xét của giáo viên</p>
                    <p className="text-sm text-gray-700 italic">&quot;{submission.feedback}&quot;</p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        <div>
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Nộp bài</h3>
            </CardHeader>
            <CardBody>
              {submission.status === 'not_submitted' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tải lên bài làm
                    </label>
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
                          {selectedFile ? selectedFile.name : 'Kéo thả file hoặc click để chọn'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, DOC, DOCX (Tối đa 10MB)
                        </p>
                      </label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={!selectedFile}>
                    <Upload className="w-4 h-4" />
                    Nộp bài
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Sau khi nộp bài, bạn có thể nộp lại để cập nhật bài làm
                  </p>
                </form>
              )}

              {submission.status === 'submitted' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      <p className="font-medium text-blue-900">Đã nộp bài</p>
                    </div>
                    <p className="text-sm text-blue-700">
                      Nộp lúc: {submission.submittedAt}
                    </p>
                    <p className="text-sm text-blue-700">
                      File: {submission.fileName}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4" />
                    Tải bài nộp
                  </Button>

                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4" />
                    Nộp lại
                  </Button>
                </div>
              )}

              {submission.status === 'graded' && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="font-medium text-green-900">Đã chấm điểm</p>
                    </div>
                    <p className="text-sm text-green-700">
                      Nộp lúc: {submission.submittedAt}
                    </p>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Download className="w-4 h-4" />
                    Tải bài nộp
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
