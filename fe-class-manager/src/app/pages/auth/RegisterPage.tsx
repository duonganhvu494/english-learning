import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BookOpen } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    userName: '',
    email: '',
    password: '',
    workspaceName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-600">EnglishClass</h1>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Tạo tài khoản</h2>
          <p className="text-gray-600 mt-2">Bắt đầu dùng thử miễn phí 14 ngày</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Họ và tên"
              type="text"
              name="fullName"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              required
            />

            <Input
              label="Tên đăng nhập"
              type="text"
              name="userName"
              placeholder="nguyenvana"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Mật khẩu"
              type="password"
              name="password"
              placeholder="Tối thiểu 6 ký tự"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
            />

            <Input
              label="Tên trung tâm"
              type="text"
              name="workspaceName"
              placeholder="Trung tâm Tiếng Anh ABC"
              value={formData.workspaceName}
              onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
              required
            />

            <Button type="submit" className="w-full">
              Đăng ký
            </Button>

            <p className="text-xs text-gray-500 text-center">
              Bằng việc đăng ký, bạn đồng ý với{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Điều khoản dịch vụ
              </a>{' '}
              và{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Chính sách bảo mật
              </a>
            </p>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
