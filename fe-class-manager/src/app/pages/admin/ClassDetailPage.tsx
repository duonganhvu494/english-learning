import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Plus, Users, Calendar, FileText, UserPlus, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Modal, { ModalBody, ModalFooter } from '../../components/ui/Modal';
import Input from '../../components/ui/Input';

export default function ClassDetailPage() {
  const { classId } = useParams();
  const [activeTab, setActiveTab] = useState<'info' | 'students' | 'sessions'>('info');
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [sessionFormData, setSessionFormData] = useState({
    topic: '',
    timeStart: '',
    timeEnd: '',
  });

  const classInfo = {
    id: classId,
    className: 'IELTS Foundation 01',
    description: 'Lớp học IELTS cơ bản dành cho người mới bắt đầu',
    teacher: 'Nguyễn Thị Lan',
    schedule: 'Thứ 2, 4, 6 - 08:00-10:00',
    room: 'Phòng A1',
    startDate: '01/01/2026',
    endDate: '30/06/2026',
    status: 'active',
  };

  const students = [
    { id: '1', fullName: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', role: 'student', joinDate: '01/01/2026' },
    { id: '2', fullName: 'Trần Thị B', email: 'tranthib@gmail.com', role: 'student', joinDate: '01/01/2026' },
    { id: '3', fullName: 'Lê Văn C', email: 'levanc@gmail.com', role: 'student', joinDate: '05/01/2026' },
  ];

  const sessions = [
    { id: '1', topic: 'Introduction to IELTS', date: '02/01/2026', time: '08:00-10:00', status: 'completed' },
    { id: '2', topic: 'Reading Skills - Part 1', date: '04/01/2026', time: '08:00-10:00', status: 'completed' },
    { id: '3', topic: 'Listening Skills - Part 1', date: '06/01/2026', time: '08:00-10:00', status: 'upcoming' },
    { id: '4', topic: 'Writing Task 1', date: '09/01/2026', time: '08:00-10:00', status: 'upcoming' },
  ];

  const handleAddSession = (e: React.FormEvent) => {
    e.preventDefault();
    setShowAddSessionModal(false);
    setSessionFormData({ topic: '', timeStart: '', timeEnd: '' });
  };

  const tabs = [
    { id: 'info', label: 'Thông tin', icon: FileText },
    { id: 'students', label: 'Học viên', icon: Users },
    { id: 'sessions', label: 'Buổi học', icon: Calendar },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/classes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{classInfo.className}</h1>
          <p className="text-gray-600 mt-1">{classInfo.description}</p>
        </div>
        <Badge variant="success">Đang diễn ra</Badge>
      </div>

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

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Thông tin cơ bản</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Giáo viên phụ trách</p>
                <p className="font-medium text-gray-900">{classInfo.teacher}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lịch học</p>
                <p className="font-medium text-gray-900">{classInfo.schedule}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phòng học</p>
                <p className="font-medium text-gray-900">{classInfo.room}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                  <p className="font-medium text-gray-900">{classInfo.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày kết thúc</p>
                  <p className="font-medium text-gray-900">{classInfo.endDate}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Thống kê</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tổng học viên</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Tổng buổi học</p>
                    <p className="text-2xl font-bold text-gray-900">36</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Đã hoàn thành</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {activeTab === 'students' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Danh sách học viên</h3>
            <Button size="sm">
              <UserPlus className="w-4 h-4" />
              Thêm học viên
            </Button>
          </CardHeader>
          <CardBody>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học viên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Ngày tham gia</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {student.fullName.charAt(0)}
                          </span>
                        </div>
                        <span className="font-medium">{student.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Badge variant="default">Học viên</Badge>
                    </TableCell>
                    <TableCell>{student.joinDate}</TableCell>
                    <TableCell>
                      <button className="text-sm text-red-600 hover:underline">Xóa</button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {activeTab === 'sessions' && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Lịch sử buổi học</h3>
            <Button size="sm" onClick={() => setShowAddSessionModal(true)}>
              <Plus className="w-4 h-4" />
              Tạo buổi học
            </Button>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  to={`/admin/sessions/${session.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{session.topic}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {session.date} • {session.time}
                      </p>
                    </div>
                    <Badge variant={session.status === 'completed' ? 'success' : 'warning'}>
                      {session.status === 'completed' ? 'Đã hoàn thành' : 'Sắp diễn ra'}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <Modal isOpen={showAddSessionModal} onClose={() => setShowAddSessionModal(false)} title="Tạo buổi học mới">
        <form onSubmit={handleAddSession}>
          <ModalBody className="space-y-4">
            <Input
              label="Chủ đề buổi học"
              name="topic"
              placeholder="Ví dụ: Reading Skills - Part 1"
              value={sessionFormData.topic}
              onChange={(e) => setSessionFormData({ ...sessionFormData, topic: e.target.value })}
              required
            />
            <Input
              label="Thời gian bắt đầu"
              type="datetime-local"
              name="timeStart"
              value={sessionFormData.timeStart}
              onChange={(e) => setSessionFormData({ ...sessionFormData, timeStart: e.target.value })}
              required
            />
            <Input
              label="Thời gian kết thúc"
              type="datetime-local"
              name="timeEnd"
              value={sessionFormData.timeEnd}
              onChange={(e) => setSessionFormData({ ...sessionFormData, timeEnd: e.target.value })}
              required
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowAddSessionModal(false)} type="button">
              Hủy
            </Button>
            <Button type="submit">Tạo buổi học</Button>
          </ModalFooter>
        </form>
      </Modal>
    </div>
  );
}
