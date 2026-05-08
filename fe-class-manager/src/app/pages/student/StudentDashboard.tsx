import { useEffect, useMemo, useState } from 'react';
import { Calendar, CheckCircle, FileText, Bell, BookOpen } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { getApiErrorMessage, notificationsApi, usersApi } from '@/api';
import type { NotificationItem, UserProfile } from '@/types';
import { formatDateTime } from '@/app/utils/format';

function getDataString(
  data: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = data?.[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

export default function StudentDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [me, inbox] = await Promise.all([
        usersApi.getMe(),
        notificationsApi.listMyNotifications({ limit: 20 }),
      ]);
      setUser(me);
      setNotifications(inbox);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải dashboard học viên'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const assignmentNotifications = useMemo(
    () => notifications.filter((item) => item.type.toLowerCase().includes('assignment')),
    [notifications],
  );

  const classLinks = useMemo(() => {
    const classIdSet = new Set<string>();
    notifications.forEach((item) => {
      const classId =
        getDataString(item.data, 'classId') ??
        getDataString(item.data, 'class_id');
      if (classId) {
        classIdSet.add(classId);
      }
    });
    return Array.from(classIdSet);
  }, [notifications]);

  const assignmentLinks = useMemo(() => {
    const assignmentIdSet = new Set<string>();
    notifications.forEach((item) => {
      const assignmentId =
        getDataString(item.data, 'assignmentId') ??
        getDataString(item.data, 'assignment_id');
      if (assignmentId) {
        assignmentIdSet.add(assignmentId);
      }
    });
    return Array.from(assignmentIdSet);
  }, [notifications]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.fullName || 'học viên'}
        </h1>
        <p className="text-gray-600 mt-1">
          Theo dõi thông báo và truy cập nhanh lớp học của bạn
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Thông báo chưa đọc</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
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
                <p className="text-sm text-gray-600">Thông báo bài tập</p>
                <p className="text-2xl font-bold text-gray-900">{assignmentNotifications.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Lớp khả dụng từ dữ liệu</p>
                <p className="text-2xl font-bold text-gray-900">{classLinks.length}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Lớp học truy cập nhanh</h3>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
            ) : classLinks.length === 0 ? (
              <div className="text-sm text-gray-500">
                Chưa có classId trong dữ liệu thông báo. Bạn có thể mở lớp từ link được giáo viên chia sẻ.
              </div>
            ) : (
              <div className="space-y-3">
                {classLinks.map((classId) => (
                  <Link
                    key={classId}
                    to={`/student/class/${classId}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">Lớp {classId.slice(0, 8)}</p>
                    <p className="text-xs text-gray-600 mt-1">classId: {classId}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Bài tập truy cập nhanh</h3>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
            ) : assignmentLinks.length === 0 ? (
              <div className="text-sm text-gray-500">
                Chưa có assignmentId trong dữ liệu thông báo.
              </div>
            ) : (
              <div className="space-y-3">
                {assignmentLinks.map((assignmentId) => (
                  <Link
                    key={assignmentId}
                    to={`/student/assignment/${assignmentId}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <p className="font-medium text-gray-900">Bài tập {assignmentId.slice(0, 8)}</p>
                    <p className="text-xs text-gray-600 mt-1">assignmentId: {assignmentId}</p>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Thông báo gần đây</h3>
          <Badge variant="info">{notifications.length}</Badge>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : notifications.length === 0 ? (
            <div className="text-sm text-gray-500">Chưa có thông báo nào</div>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    {!item.isRead && <Badge variant="warning">Mới</Badge>}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.body}</p>
                  <p className="text-xs text-gray-500 mt-2">{formatDateTime(item.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Lưu ý kỹ thuật</h3>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-gray-600">
            Backend hiện chưa có endpoint “danh sách lớp của học viên”, nên dashboard chỉ tổng hợp dữ
            liệu có thể suy ra từ thông báo và profile.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
