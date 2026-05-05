import { Calendar, FileText, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

export default function StudentDashboard() {
  const upcomingSessions = [
    {
      id: '1',
      classId: '1',
      className: 'IELTS Foundation 01',
      topic: 'Listening Skills - Part 1',
      date: '06/05/2026',
      time: '08:00-10:00',
      room: 'Phòng A1',
    },
    {
      id: '2',
      classId: '1',
      className: 'IELTS Foundation 01',
      topic: 'Writing Task 1',
      date: '08/05/2026',
      time: '08:00-10:00',
      room: 'Phòng A1',
    },
  ];

  const pendingAssignments = [
    {
      id: '1',
      title: 'Bài tập Reading Comprehension',
      className: 'IELTS Foundation 01',
      dueDate: '10/05/2026',
      dueTime: '23:59',
      status: 'pending',
      urgent: true,
    },
    {
      id: '2',
      title: 'Quiz - Vocabulary Unit 1',
      className: 'IELTS Foundation 01',
      dueDate: '08/05/2026',
      dueTime: '23:59',
      status: 'pending',
      urgent: false,
    },
  ];

  const recentGrades = [
    {
      assignment: 'Bài tập Listening - Unit 2',
      score: 8.5,
      maxScore: 10,
      date: '03/05/2026',
      feedback: 'Bạn làm rất tốt! Cần cải thiện phần nghe số.',
    },
    {
      assignment: 'Quiz - Grammar Test 1',
      score: 9.0,
      maxScore: 10,
      date: '01/05/2026',
      feedback: 'Xuất sắc! Tiếp tục phát huy.',
    },
  ];

  const myClasses = [
    {
      id: '1',
      className: 'IELTS Foundation 01',
      teacher: 'Nguyễn Thị Lan',
      schedule: 'Thứ 2, 4, 6 - 08:00-10:00',
      progress: 40,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Xin chào, Nguyễn Văn A!</h1>
        <p className="text-gray-600 mt-1">Chúc bạn một ngày học tập hiệu quả</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lớp học</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Bài tập chờ nộp</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tỷ lệ điểm danh</p>
                <p className="text-2xl font-bold text-gray-900">95%</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Lịch học sắp tới</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">{session.topic}</h4>
                      <p className="text-sm text-gray-600 mt-1">{session.className}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {session.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {session.time}
                        </span>
                      </div>
                    </div>
                    <Badge variant="info">{session.room}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Bài tập cần làm</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {pendingAssignments.map((assignment) => (
                <Link
                  key={assignment.id}
                  to={`/student/assignment/${assignment.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                        {assignment.urgent && (
                          <Badge variant="danger">Gấp</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{assignment.className}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Hạn nộp: {assignment.dueDate} {assignment.dueTime}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Lớp học của tôi</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {myClasses.map((cls) => (
                <Link
                  key={cls.id}
                  to={`/student/class/${cls.id}`}
                  className="block p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{cls.className}</h4>
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Giáo viên:</span> {cls.teacher}
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="font-medium">Lịch học:</span> {cls.schedule}
                  </p>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-600">Tiến độ học tập</span>
                      <span className="text-xs font-medium text-blue-600">{cls.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-blue-600"
                        style={{ width: `${cls.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Điểm gần đây</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              {recentGrades.map((grade, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{grade.assignment}</h4>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-blue-600">{grade.score}</span>
                      <span className="text-gray-600">/{grade.maxScore}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 italic">&quot;{grade.feedback}&quot;</p>
                  <p className="text-xs text-gray-500 mt-2">{grade.date}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
