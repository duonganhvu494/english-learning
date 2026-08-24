import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, BookOpen, Mail } from "lucide-react";
import { toast } from "sonner";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

import { authApi, getApiErrorMessage } from "@/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const [emailError, setEmailError] = useState("");

  const [isSubmitted, setIsSubmitted] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = () => {
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setEmailError("Vui lòng nhập email");

      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      setEmailError("Email không đúng định dạng");

      return false;
    }

    setEmailError("");

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    if (!validateEmail()) {
      return;
    }

    const normalizedEmail = email.trim();

    setIsLoading(true);

    try {
      await authApi.forgotPassword({
        email: normalizedEmail,
      });

      setEmail(normalizedEmail);
      setIsSubmitted(true);

      toast.success("Đã gửi OTP đặt lại mật khẩu (nếu email tồn tại)");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể gửi OTP đặt lại mật khẩu"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (isLoading) {
      return;
    }

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      return;
    }

    setIsLoading(true);

    try {
      await authApi.forgotPassword({
        email: normalizedEmail,
      });

      toast.success("Đã gửi lại OTP đặt lại mật khẩu");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể gửi lại OTP"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);

    if (emailError) {
      setEmailError("");
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <BookOpen className="w-8 h-8 text-blue-600" />

              <h1 className="text-3xl font-bold text-blue-600">EnglishClass</h1>
            </div>

            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900">
              Kiểm tra email
            </h2>

            <p className="text-gray-600 mt-2">
              Hệ thống đã xử lý yêu cầu đặt lại mật khẩu cho email
            </p>

            <p className="text-sm font-medium text-blue-600 mt-1">{email}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Nhập mã OTP nhận được để đặt lại mật khẩu.
              </p>
            </div>

            <Link
              to={`/reset-password?email=${encodeURIComponent(email)}`}
              className="block"
            >
              <Button className="w-full">Đi đến trang đặt lại mật khẩu</Button>
            </Link>

            <p className="text-sm text-gray-600 text-center">
              Chưa nhận OTP?{" "}
              <button
                type="button"
                onClick={() => void handleResendOtp()}
                disabled={isLoading}
                className="text-blue-600 hover:underline font-medium disabled:opacity-60"
              >
                {isLoading ? "Đang gửi..." : "Gửi lại"}
              </button>
            </p>

            <Link to="/login" className="block">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4" />
                Quay lại đăng nhập
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />

            <h1 className="text-3xl font-bold text-blue-600">EnglishClass</h1>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900">
            Quên mật khẩu?
          </h2>

          <p className="text-gray-600 mt-2">
            Nhập email để nhận OTP đặt lại mật khẩu
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="email@example.com"
              value={email}
              onChange={handleEmailChange}
              error={emailError}
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Đang gửi..." : "Gửi OTP"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
