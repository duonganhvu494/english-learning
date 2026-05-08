import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Check,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { authApi, getApiErrorMessage, notificationsApi, usersApi } from '@/api';
import type { NotificationItem, UserProfile } from '@/types';
import { clearAuthStorage, setCurrentUser } from '@/app/utils/client-storage';

export default function StudentLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);

  const menuItems = useMemo(
    () => [
      { icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/student/dashboard' },
    ],
    [],
  );

  const refreshNotifications = async () => {
    try {
      const [countResult, notificationItems] = await Promise.all([
        notificationsApi.getUnreadCount(),
        notificationsApi.listMyNotifications({ limit: 5 }),
      ]);
      setUnreadCount(countResult.unreadCount);
      setNotifications(notificationItems);
    } catch {
      // Optional for student screen.
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const me = await usersApi.getMe();
        setCurrentUser(me);
        setCurrentUserState(me);
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Phiên đăng nhập hết hạn'));
        clearAuthStorage();
        navigate('/login');
        return;
      }

      await refreshNotifications();
    };

    void bootstrap();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      clearAuthStorage();
    } finally {
      navigate('/login');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      await refreshNotifications();
      toast.success('Đã đánh dấu đã đọc tất cả thông báo');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật thông báo'));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">EnglishClass</h1>
          <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-sm font-medium text-blue-900">Học viên</p>
            <p className="text-xs text-blue-600 mt-1 truncate">{currentUser?.fullName || 'Student'}</p>
          </div>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Cổng học viên</h2>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications((value) => !value);
                  void refreshNotifications();
                }}
                className="relative p-2 hover:bg-gray-100 rounded-lg"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <p className="font-medium text-sm">Thông báo</p>
                    <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                      Đánh dấu đã đọc
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 && (
                      <p className="px-4 py-6 text-sm text-gray-500 text-center">Không có thông báo</p>
                    )}
                    {notifications.map((item) => (
                      <div key={item.id} className="px-4 py-3 border-b last:border-b-0 border-gray-100">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{item.body}</p>
                          </div>
                          {item.isRead ? (
                            <Check className="w-4 h-4 text-green-600 mt-0.5" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu((value) => !value)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {(currentUser?.fullName || 'S').charAt(0).toUpperCase()}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser?.fullName || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{currentUser?.email || ''}</p>
                  </div>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Hồ sơ của tôi
                  </button>
                  <hr className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}



