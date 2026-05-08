import { useEffect, useMemo, useState } from 'react';
import { Users, BookOpen, DollarSign, CheckCircle, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { classesApi, getApiErrorMessage, notificationsApi, sessionsApi, workspacesApi } from '@/api';
import type { ClassResponse, NotificationItem, SessionResponse, WorkspaceDetail } from '@/types';
import { formatDateTime } from '@/app/utils/format';
import { resolveWorkspaceId } from '@/app/utils/workspace';

export default function Dashboard() {
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const workspaceId = await resolveWorkspaceId();
        const [workspaceDetail, classList, inbox] = await Promise.all([
          workspacesApi.getMyWorkspace(),
          classesApi.listWorkspaceClasses(workspaceId),
          notificationsApi.listMyNotifications({ limit: 10 }),
        ]);

        setWorkspace(workspaceDetail);
        setClasses(classList);
        setNotifications(inbox);

        if (classList.length > 0) {
          const classSessions = await sessionsApi.listClassSessions(classList[0].id);
          setSessions(classSessions);
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Không thể tải dashboard'));
      }
    };

    void bootstrap();
  }, []);

  const stats = useMemo(
    () => [
      {
        icon: Users,
        label: 'Tổng học viên',
        value: String(workspace?.studentCount ?? 0),
        change: '-',
        changeType: 'increase',
      },
      {
        icon: BookOpen,
        label: 'Lớp hoạt động',
        value: String(workspace?.classCount ?? classes.length),
        change: '-',
        changeType: 'increase',
      },
      {
        icon: DollarSign,
        label: 'Gói cước',
        value: workspace ? 'Active' : 'N/A',
        change: '-',
        changeType: 'increase',
      },
      {
        icon: CheckCircle,
        label: 'Thông báo chưa đọc',
        value: String(notifications.filter((item) => !item.isRead).length),
        change: '-',
        changeType: 'decrease',
      },
    ],
    [classes.length, notifications, workspace],
  );

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

  const todaySchedule = sessions.slice(0, 5).map((session) => ({
    id: session.id,
    title: session.topic,
    time: `${formatDateTime(session.timeStart)} - ${formatDateTime(session.timeEnd)}`,
    classId: session.classId,
  }));

  const pendingTasks = notifications
    .filter((item) => !item.isRead)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      task: item.title,
      detail: item.body,
    }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600 mt-1">Báo cáo hoạt động của trung tâm</p>
      </div>

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
                      {stat.change}
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
            <h3 className="font-semibold text-gray-900">Tỷ lệ điểm danh tuần này</h3>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Lịch dạy gần nhất</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200">
              {todaySchedule.length === 0 && (
                <div className="p-4 text-sm text-gray-500">Chưa có buổi học nào</div>
              )}
              {todaySchedule.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600 mt-1">Class: {item.classId}</p>
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
            <h3 className="font-semibold text-gray-900">Thông báo cần xử lý</h3>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200">
              {pendingTasks.length === 0 && (
                <div className="p-4 text-sm text-gray-500">Không có thông báo chưa đọc</div>
              )}
              {pendingTasks.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">{item.task}</p>
                  <p className="text-xs text-gray-600 mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}



