import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, UserCheck, FileText, Upload, Plus, Download } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Modal, { ModalBody, ModalFooter } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export default function SessionDetailPage() {
  const { sessionId } = useParams();
  const [activeTab, setActiveTab] = useState<'attendance' | 'assignments' | 'materials'>('attendance');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [assignmentFormData, setAssignmentFormData] = useState({
    title: '',
    description: '',
    timeStart: '',
    timeEnd: '',
    type: 'MANUAL',
  });

  const sessionInfo = {
    id: sessionId,
    topic: 'Reading Skills - Part 1',
    class: 'IELTS Foundation 01',
    date: '04/01/2026',
    time: '08:00-10:00',
    room: 'Phòng A1',
    teacher: 'Nguyễn Thị Lan',
  };

  const [attendances, setAttendances] = useState([
    { studentId: '1', fullName: 'Nguyễn Văn A', status: 'PRESENT' as AttendanceStatus },
    { studentId: '2', fullName: 'Trần Thị B', status: 'PRESENT' as AttendanceStatus },
    { studentId: '3', fullName: 'Lê Văn C', status: 'LATE' as AttendanceStatus },
    { studentId: '4', fullName: 'Phạm Thị D', status: 'ABSENT' as AttendanceStatus },
  ]);

  const assignments = [
    {
      id: '1',
      title: 'Bài tập Reading Comprehension',
      type: 'MANUAL',
      timeEnd: '10/01/2026 23:59',
      submissions: 18,
      total: 24,
    },
    {
      id: '2',
      title: 'Quiz - Vocabulary Unit 1',
      type: 'QUIZ',
      timeEnd: '08/01/2026 23:59',
      submissions: 22,
      total: 24,
    },
  ];

  const materials = [
    { id: '1', name: 'Slide bài giảng.pdf', size: '2.5 MB', uploadDate: '04/01/2026' },
    { id: '2', name: 'Bài tập thực hành.docx', size: '1.2 MB', uploadDate: '04/01/2026' },
  ];

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendances(prev =>
      prev.map(att => att.studentId === studentId ? { ...att, status } : att)
    );
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAssignmentModal(false);
    setAssignmentFormData({
      title: '',
      description: '',
      timeStart: '',
      timeEnd: '',
      type: 'MANUAL',
    });
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT': return 'bg-green-100 text-green-700 border-green-300';
      case 'ABSENT': return 'bg-red-100 text-red-700 border-red-300';
      case 'LATE': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    }
  };

  const getStatusLabel = (status: AttendanceStatus) => {
    switch (status) {
      case 'PRESENT': return 'Có mặt';
      case 'ABSENT': return 'Vắng';
      case 'LATE': return 'Trễ';
    }
  };

  const tabs = [
    { id: 'attendance', label: 'Điểm danh', icon: UserCheck },
    { id: 'assignments', label: 'Bài tập', icon: FileText },
    { id: 'materials', label: 'Tài liệu', icon: Upload },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/classes/1">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{sessionInfo.topic}</h1>
          <p className="text-gray-600 mt-1">
            {sessionInfo.class} • {sessionInfo.date} • {sessionInfo.time}
          </p>
        </div>
      </div>

      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Lớp học</p>
            <p className="font-medium text-gray-900">{sessionInfo.class}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Giáo viên</p>
            <p className="font-medium text-gray-900">{sessionInfo.teacher}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Phòng học</p>
            <p className="font-medium text-gray-900">{sessionInfo.room}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Thời gian</p>
            <p className="font-medium text-gray-900">{sessionInfo.time}</p>
          </div>
        </CardBody>
      </Card>

      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium text-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Điểm danh học viên</h3>
          </CardHeader>
          <CardBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendances.map((attendance) => (
                  <TableRow key={attendance.studentId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {attendance.fullName.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium">{attendance.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(attendance.status)}`}>
                        {getStatusLabel(attendance.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAttendanceChange(attendance.studentId, 'PRESENT')}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            attendance.status === 'PRESENT'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Có mặt
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(attendance.studentId, 'LATE')}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            attendance.status === 'LATE'
                              ? 'bg-yellow-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Trễ
                        </button>
                        <button
                          onClick={() => handleAttendanceChange(attendance.studentId, 'ABSENT')}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            attendance.status === 'ABSENT'
                              ? 'bg-red-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Vắng
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-6 flex justify-end">
              <Button>Lưu điểm danh</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'assignments' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Bài tập</h3>
            <Button size="sm" onClick={() => setShowAssignmentModal(true)}>
              <Plus className="w-4 h-4" />
              Tạo bài tập
            </Button>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/admin/assignments/${assignment.id}/submissions`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        <Badge variant={assignment.type === 'QUIZ' ? 'info' : 'default'}>
                          {assignment.type === 'QUIZ' ? 'Trắc nghiệm' : 'Bài tập'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Hạn nộp: {assignment.timeEnd} • Đã nộp: {assignment.submissions}/{assignment.total}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-blue-600">
                        {Math.round((assignment.submissions / assignment.total) * 100)}%
                      </div>
                      <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
                        <div
                          className="h-2 bg-blue-600 rounded-full"
                          style={{ width: `${(assignment.submissions / assignment.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'materials' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Tài liệu buổi học</h3>
            <Button size="sm">
              <Upload className="w-4 h-4" />
              Tải lên tài liệu
            </Button>
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
                      <p className="text-sm text-gray-600">{material.size} • {material.uploadDate}</p>
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
      )}

      <Modal isOpen={showAssignmentModal} onClose={() => setShowAssignmentModal(false)} title="Tạo bài tập mới" size="lg">
        <form onSubmit={handleAddAssignment}>
          <ModalBody className="space-y-4">
            <Input
              label="Tiêu đề bài tập"
              name="title"
              placeholder="Ví dụ: Bài tập Reading Comprehension"
              value={assignmentFormData.title}
              onChange={(e) => setAssignmentFormData({ ...assignmentFormData, title: e.target.value })}
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                name="description"
                placeholder="Mô tả chi tiết bài tập"
                value={assignmentFormData.description}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại bài tập
              </label>
              <select
                name="type"
                value={assignmentFormData.type}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MANUAL">Bài tập thường</option>
                <option value="QUIZ">Trắc nghiệm</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Thời gian mở"
                type="datetime-local"
                name="timeStart"
                value={assignmentFormData.timeStart}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, timeStart: e.target.value })}
                required
              />
              <Input
                label="Hạn nộp"
                type="datetime-local"
                name="timeEnd"
                value={assignmentFormData.timeEnd}
                onChange={(e) => setAssignmentFormData({ ...assignmentFormData, timeEnd: e.target.value })}
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAssignmentModal(false)} type="button">
              Hủy
            </Button>
            <Button type="submit">Tạo bài tập</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
