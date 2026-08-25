import { Outlet, Link, useLocation, useNavigate } from "react-router";

import {
  LayoutDashboard,
  Bell,
  ChevronDown,
  LogOut,
  Check,
  Users,
  BookOpen,
  CreditCard,
  Settings,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { authApi, getApiErrorMessage, usersApi } from "@/api";

import type { UserProfile } from "@/types";

import { clearAuthStorage, setCurrentUser } from "@/app/utils/client-storage";

import { useNotifications } from "@/app/providers/NotificationProvider";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);

  const { latestNotifications, unreadCount, markAllRead } = useNotifications();

  const menuItems = useMemo(
    () => [
      {
        icon: LayoutDashboard,
        label: "Dashboard",
        path: "/admin/dashboard",
      },
      {
        icon: Users,
        label: "Học viên",
        path: "/admin/students",
      },
      {
        icon: BookOpen,
        label: "Lớp học",
        path: "/admin/classes",
      },
      {
        icon: CreditCard,
        label: "Billing",
        path: "/admin/billing",
      },
      {
        icon: Settings,
        label: "Settings",
        path: "/admin/settings",
      },
    ],
    [],
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const me = await usersApi.getMe();

        setCurrentUser(me);
        setCurrentUserState(me);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Phiên đăng nhập hết hạn"));

        clearAuthStorage();

        navigate("/login", {
          replace: true,
        });
      }
    };

    void bootstrap();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      clearAuthStorage();
    } finally {
      navigate("/login", {
        replace: true,
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();

      toast.success("Đã đánh dấu tất cả thông báo");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể cập nhật thông báo"));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">
            EnglishClass Admin
          </h1>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              location.pathname === item.path ||
              location.pathname.startsWith(`${item.path}/`);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3
                  px-3 py-2.5
                  rounded-lg mb-1
                  ${
                    active
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <Icon className="w-5 h-5" />

                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header
          className="
            bg-white border-b
            px-6 py-3
            flex items-center
            justify-between
          "
        >
          <h2 className="text-lg font-semibold">Teacher Portal</h2>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications((v) => !v);

                  setShowUserMenu(false);
                }}
                className="
                  relative
                  p-2
                  rounded-lg
                  hover:bg-gray-100
                "
              >
                <Bell className="w-5 h-5" />

                {unreadCount > 0 && (
                  <span
                    className="
                      absolute
                      -top-1
                      -right-1
                      bg-red-500
                      text-white
                      rounded-full
                      text-xs
                      px-1
                    "
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="
                    absolute right-0 mt-2
                    w-96
                    bg-white
                    border
                    rounded-lg
                    shadow-lg
                    z-20
                  "
                >
                  <div
                    className="
                      px-4 py-3
                      border-b
                      flex justify-between
                    "
                  >
                    <span className="font-medium">Thông báo</span>

                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="
                            text-xs
                            text-blue-600
                          "
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {latestNotifications.length === 0 ? (
                      <div
                        className="
                            p-5
                            text-center
                            text-gray-500
                          "
                      >
                        Không có thông báo
                      </div>
                    ) : (
                      latestNotifications.map((item) => (
                        <div
                          key={item.id}
                          className="
                              px-4 py-3
                              border-b
                            "
                        >
                          <div
                            className="
                                flex
                                justify-between
                              "
                          >
                            <div>
                              <p
                                className="
                                    text-sm
                                    font-medium
                                  "
                              >
                                {item.title}
                              </p>

                              <p
                                className="
                                    text-xs
                                    text-gray-600
                                  "
                              >
                                {item.body}
                              </p>
                            </div>

                            {item.isRead ? (
                              <Check
                                className="
                                      w-4 h-4
                                      text-green-600
                                    "
                              />
                            ) : (
                              <span
                                className="
                                      mt-1
                                      w-2 h-2
                                      rounded-full
                                      bg-blue-600
                                    "
                              />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    to="/admin/notifications"
                    className="
                      block
                      text-center
                      py-3
                      border-t
                      text-sm
                      text-blue-600
                    "
                  >
                    Xem tất cả thông báo
                  </Link>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setShowUserMenu((v) => !v);

                  setShowNotifications(false);
                }}
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <div
                  className="
                    w-8 h-8
                    rounded-full
                    bg-blue-600
                    flex
                    items-center
                    justify-center
                  "
                >
                  <span className="text-white">
                    {(currentUser?.fullName || "T").charAt(0).toUpperCase()}
                  </span>
                </div>

                <ChevronDown className="w-4 h-4" />
              </button>

              {showUserMenu && (
                <div
                  className="
                    absolute right-0 mt-2
                    w-56
                    bg-white
                    border
                    rounded-lg
                    shadow-lg
                  "
                >
                  <div className="p-3 border-b">
                    <p className="text-sm font-medium">
                      {currentUser?.fullName || "Teacher"}
                    </p>

                    <p className="text-xs text-gray-500">
                      {currentUser?.email}
                    </p>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="
                      flex
                      gap-2
                      w-full
                      px-4 py-2
                      text-red-600
                    "
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
