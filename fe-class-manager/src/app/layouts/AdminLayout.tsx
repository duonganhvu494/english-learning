import { Outlet, Link, useLocation } from 'react-router';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  CreditCard,
  Settings,
  Search,
  Plus,
  Bell,
  ChevronDown,
  Building2,
  LogOut,
  Moon,
  User
} from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout() {
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Tổng quan', path: '/admin/dashboard' },
    { icon: BookOpen, label: 'Lớp học', path: '/admin/classes' },
    { icon: Users, label: 'Học viên', path: '/admin/students' },
    { icon: FileText, label: 'Tài liệu', path: '/admin/materials' },
    { icon: CreditCard, label: 'Thanh toán', path: '/admin/billing' },
    { icon: Settings, label: 'Cài đặt', path: '/admin/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-blue-600">EnglishClass</h1>
          <div className="mt-4 p-2 rounded-lg border border-gray-200 flex items-center justify-between cursor-pointer hover:bg-gray-50">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">Trung tâm A</span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <nav className="flex-1 p-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
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

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p className="font-medium">Gói Pro</p>
            <p className="mt-1">Hạn sử dụng: 30/12/2026</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Tạo mới
                <ChevronDown className="w-4 h-4" />
              </button>
              {showCreateMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Tạo lớp học</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Thêm học viên</button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Tạo buổi học</button>
                </div>
              )}
            </div>

            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">GV</span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Hồ sơ
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                    <Moon className="w-4 h-4" />
                    Chế độ tối
                  </button>
                  <hr className="my-2" />
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600">
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
