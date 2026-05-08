import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BookOpen, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authApi, getApiErrorMessage } from '@/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: searchParams.get('email') ?? '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordRequirements = useMemo(
    () => [
      { text: 'Tối thiểu 6 ký tự', met: formData.newPassword.length >= 6 },
      { text: 'Có chữ hoa', met: /[A-Z]/.test(formData.newPassword) },
      { text: 'Có chữ thường', met: /[a-z]/.test(formData.newPassword) },
      { text: 'Có số', met: /\d/.test(formData.newPassword) },
    ],
    [formData.newPassword],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }

    setError('');
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }

    if (formData.otp.trim().length !== 6) {
      setError('OTP phải gồm đúng 6 ký tự');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.resetPassword({
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        newPassword: formData.newPassword,
      });
      toast.success('Đặt lại mật khẩu thành công');
      navigate('/login');
    } catch (error) {
      setError(getApiErrorMessage(error, 'Không thể đặt lại mật khẩu'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-blue-600">EnglishClass</h1>
          </div>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Đặt lại mật khẩu</h2>
          <p className="text-gray-600 mt-2">Nhập email, OTP và mật khẩu mới</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="teacher@example.com"
              required
            />

            <Input
              label="OTP"
              type="text"
              value={formData.otp}
              onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
              placeholder="123456"
              maxLength={6}
              required
            />

            <Input
              label="Mật khẩu mới"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Nhập mật khẩu mới"
              required
            />

            {formData.newPassword && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Yêu cầu mật khẩu:</p>
                <ul className="space-y-1">
                  {passwordRequirements.map((req) => (
                    <li key={req.text} className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          req.met ? 'bg-green-100' : 'bg-gray-200'
                        }`}
                      >
                        {req.met && <Check className="w-3 h-3 text-green-600" />}
                      </div>
                      <span className={req.met ? 'text-green-600' : 'text-gray-600'}>
                        {req.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Nhập lại mật khẩu mới"
              error={error}
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
