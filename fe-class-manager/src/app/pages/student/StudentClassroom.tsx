import { useParams } from 'react-router';
import { Calendar, Users, FileText, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function StudentClassroom() {
  const { classId } = useParams();

  const classInfo = {
    id: classId,
    className: 'IELTS Foundation 01',
    description: 'Lớp học IELTS cơ bản dành cho người mới bắt đầu',
    teacher: 'Nguyễn Thị Lan',
    schedule: 'Thứ 2, 4, 6 - 08:00-10:00',
    room: 'Phòng A1',
  };

  const recentSessions = [
    {
      id: '1',
      topic: 'Introduction to IELTS',
      date: '02/05/2026',
      time: '08:00-10:00',
      status: 'completed',
      attendance: 'present',
    },
    {
      id: '2',
      topic: 'Reading Skills - Part 1',
      date: '04/05/2026',
      time: '08:00-10:00',
      status: 'completed',
      attendance: 'present',
    },
    {
      id: '3',
      topic: 'Listening Skills - Part 1',
      date: '06/05/2026',
      time: '08:00-10:00',
      status: 'upcoming',
      attendance: null,
    },
  ];

  const materials = [
    {
      id: '1',
      sessionTopic: 'Introduction to IELTS',
      name: 'Slide bài giảng.pdf',
      size: '2.5 MB',
      date: '02/05/2026',
    },
    {
      id: '2',
      sessionTopic: 'Reading Skills - Part 1',
      name: 'Bài tập thực hành.docx',
      size: '1.2 MB',
      date: '04/05/2026',
    },
    {
      id: '3',
      sessionTopic: 'Reading Skills - Part 1',
      name: 'Đáp án và giải thích.pdf',
      size: '800 KB',
      date: '04/05/2026',
    },
  ];

  const attendanceStats = {
    present: 18,
    late: 1,
    absent: 1,
    total: 20,
  };

  const getAttendanceIcon = (attendance: string | null) => {
    if (attendance === 'present') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (attendance === 'late') return <Clock className="w-4 h-4 text-yellow-600" />;
    if (attendance === 'absent') return <XCircle className="w-4 h-4 text-red-600" />;
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{classInfo.className}</h1>
        <p className="text-gray-600 mt-1">{classInfo.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-gray-900">Thông tin lớp học</h3>
            </CardHeader>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Giáo viên</p>
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
              <div>
                <p className="text-sm text-gray-600">Sĩ số lớp</p>
                <p className="font-medium text-gray-900">24 học viên</p>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Lịch sử buổi học</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{session.topic}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {session.date} • {session.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.attendance && getAttendanceIcon(session.attendance)}
                        <Badge variant={session.status === 'completed' ? 'success' : 'warning'}>
                          {session.status === 'completed' ? 'Đã học' : 'Sắp tới'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Tài liệu học tập</h3>
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
                        <p className="text-sm text-gray-600">
                          {material.sessionTopic} • {material.size}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Điểm danh của tôi</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-4xl font-bold text-blue-600 mb-1">
                  {Math.round((attendanceStats.present / attendanceStats.total) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Tỷ lệ điểm danh</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Có mặt</span>
                  </div>
                  <span className="font-semibold text-gray-900">{attendanceStats.present} buổi</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-700">Đi trễ</span>
                  </div>
                  <span className="font-semibold text-gray-900">{attendanceStats.late} buổi</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm text-gray-700">Vắng mặt</span>
                  </div>
                  <span className="font-semibold text-gray-900">{attendanceStats.absent} buổi</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
