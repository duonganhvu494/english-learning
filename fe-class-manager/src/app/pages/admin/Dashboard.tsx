import { Users, BookOpen, DollarSign, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function Dashboard() {
  const stats = [
    {
      icon: Users,
      label: 'Tổng học viên',
      value: '248',
      change: '+12%',
      changeType: 'increase',
    },
    {
      icon: BookOpen,
      label: 'Lớp hoạt động',
      value: '12',
      change: '+2',
      changeType: 'increase',
    },
    {
      icon: DollarSign,
      label: 'Doanh thu tháng',
      value: '45.2M',
      change: '+8%',
      changeType: 'increase',
    },
    {
      icon: CheckCircle,
      label: 'Bài cần chấm',
      value: '24',
      change: '-6',
      changeType: 'decrease',
    },
  ];

  const revenueData = [
    { month: 'T1', revenue: 32 },
    { month: 'T2', revenue: 35 },
    { month: 'T3', revenue: 38 },
    { month: 'T4', revenue: 42 },
    { month: 'T5', revenue: 45 },
    { month: 'T6', revenue: 48 },
  ];

  const attendanceData = [
    { day: 'T2', rate: 92 },
    { day: 'T3', rate: 88 },
    { day: 'T4', rate: 95 },
    { day: 'T5', rate: 90 },
    { day: 'T6', rate: 87 },
    { day: 'T7', rate: 85 },
  ];

  const todaySchedule = [
    { time: '08:00 - 10:00', class: 'IELTS Foundation 01', topic: 'Reading Skills', room: 'Phòng A1' },
    { time: '10:30 - 12:30', class: 'TOEIC Advanced', topic: 'Listening Practice', room: 'Phòng B2' },
    { time: '14:00 - 16:00', class: 'Business English', topic: 'Presentation Skills', room: 'Phòng A2' },
  ];

  const pendingTasks = [
    { task: 'Chấm bài tập Unit 5 - IELTS Foundation 01', count: 8, urgent: true },
    { task: 'Chấm bài tập Listening - TOEIC Advanced', count: 12, urgent: false },
    { task: 'Cập nhật điểm danh tuần này', count: 4, urgent: true },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600 mt-1">Chào mừng trở lại! Đây là báo cáo hoạt động của trung tâm</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm mt-1 ${
                      stat.changeType === 'increase' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {stat.change} so với tháng trước
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Doanh thu 6 tháng gần nhất</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">Tỉ lệ điểm danh tuần này</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Today's Schedule & Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Lịch dạy hôm nay</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200">
              {todaySchedule.map((item, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.class}</p>
                      <p className="text-sm text-gray-600 mt-1">{item.topic}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.room}</p>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Công việc cần làm</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200">
              {pendingTasks.map((item, index) => (
                <div key={index} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-900">{item.task}</p>
                        {item.urgent && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Gấp
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="ml-4 text-sm font-medium text-blue-600">{item.count} bài</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
