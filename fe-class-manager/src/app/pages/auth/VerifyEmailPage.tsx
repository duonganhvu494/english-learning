import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { BookOpen, Mail } from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { authApi, getApiErrorMessage } from '@/api';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpCode = useMemo(() => otp.join(''), [otp]);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    const normalized = value.slice(0, 1).replace(/\D/g, '');
    const nextOtp = [...otp];
    nextOtp[index] = normalized;
    setOtp(nextOtp);

    if (normalized && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) {
      return;
    }

    const nextOtp = pasted.split('').concat(Array(6 - pasted.length).fill(''));
    setOtp(nextOtp);
    inputRefs.current[Math.min(5, pasted.length)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || otpCode.length !== 6 || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.verifyEmailOtp({
        email: email.trim(),
        otp: otpCode,
      });
      toast.success('Xác minh email thành công');
      navigate('/login');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể xác minh email'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim() || isResending || countdown > 0) {
      return;
    }

    setIsResending(true);
    try {
      await authApi.resendEmailOtp({ email: email.trim() });
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      toast.success('Đã gửi lại mã OTP');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể gửi lại OTP'));
    } finally {
      setIsResending(false);
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
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Xác minh email</h2>
          <p className="text-gray-600 mt-2">Nhập email và mã OTP 6 chữ số đã nhận</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teacher@example.com"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 text-center mb-3">
                Mã OTP
              </label>
              <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-11 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || otpCode.length !== 6}>
              {isSubmitting ? 'Đang xác minh...' : 'Xác minh'}
            </Button>

            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-600">
                  Gửi lại mã sau <span className="font-medium text-blue-600">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={isResending || !email.trim()}
                  className="text-sm text-blue-600 hover:underline font-medium disabled:opacity-60"
                >
                  {isResending ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Nhập sai email?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">
                Đăng ký lại
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
