import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { BookOpen, Check, Lock } from "lucide-react";
import { toast } from "sonner";

import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

import { authApi, getApiErrorMessage } from "@/api";

type ResetPasswordErrors = {
  email?: string;
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    email: searchParams.get("email") ?? "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ResetPasswordErrors>({});

  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = useMemo(
    () => [
      {
        text: "Tối thiểu 6 ký tự",
        met: formData.newPassword.length >= 6,
      },
      {
        text: "Có chữ hoa",
        met: /[A-Z]/.test(formData.newPassword),
      },
      {
        text: "Có chữ thường",
        met: /[a-z]/.test(formData.newPassword),
      },
      {
        text: "Có số",
        met: /\d/.test(formData.newPassword),
      },
    ],
    [formData.newPassword],
  );

  const clearError = (field: keyof ResetPasswordErrors) => {
    setErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const validateForm = () => {
    const nextErrors: ResetPasswordErrors = {};

    const email = formData.email.trim();
    const otp = formData.otp.trim();

    if (!email) {
      nextErrors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Email không đúng định dạng";
    }

    if (!otp) {
      nextErrors.otp = "Vui lòng nhập mã OTP";
    } else if (!/^\d{6}$/.test(otp)) {
      nextErrors.otp = "OTP phải gồm đúng 6 số";
    }

    if (!formData.newPassword) {
      nextErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (formData.newPassword.length < 6) {
      nextErrors.newPassword = "Mật khẩu phải có tối thiểu 6 ký tự";
    } else if (!/[A-Z]/.test(formData.newPassword)) {
      nextErrors.newPassword = "Mật khẩu phải có ít nhất 1 chữ hoa";
    } else if (!/[a-z]/.test(formData.newPassword)) {
      nextErrors.newPassword = "Mật khẩu phải có ít nhất 1 chữ thường";
    } else if (!/\d/.test(formData.newPassword)) {
      nextErrors.newPassword = "Mật khẩu phải có ít nhất 1 chữ số";
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (formData.newPassword !== formData.confirmPassword) {
      nextErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await authApi.resetPassword({
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        newPassword: formData.newPassword,
      });

      toast.success("Đặt lại mật khẩu thành công");

      navigate("/login");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể đặt lại mật khẩu"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />

            <h1 className="text-3xl font-bold text-blue-600">EnglishClass</h1>
          </div>

          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900">
            Đặt lại mật khẩu
          </h2>

          <p className="text-gray-600 mt-2">Nhập email, OTP và mật khẩu mới</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              placeholder="teacher@example.com"
              error={errors.email}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  email: e.target.value,
                });

                clearError("email");
              }}
              required
            />

            <Input
              label="OTP"
              type="text"
              name="otp"
              value={formData.otp}
              placeholder="123456"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              error={errors.otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);

                setFormData({
                  ...formData,
                  otp: value,
                });

                clearError("otp");
              }}
              required
            />

            <Input
              label="Mật khẩu mới"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              placeholder="Nhập mật khẩu mới"
              error={errors.newPassword}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  newPassword: e.target.value,
                });

                clearError("newPassword");

                if (errors.confirmPassword) {
                  clearError("confirmPassword");
                }
              }}
              required
            />

            {formData.newPassword && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">
                  Yêu cầu mật khẩu:
                </p>

                <ul className="space-y-1">
                  {passwordRequirements.map((req) => (
                    <li
                      key={req.text}
                      className="flex items-center gap-2 text-xs"
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          req.met ? "bg-green-100" : "bg-gray-200"
                        }`}
                      >
                        {req.met && (
                          <Check className="w-3 h-3 text-green-600" />
                        )}
                      </div>

                      <span
                        className={req.met ? "text-green-600" : "text-gray-600"}
                      >
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
              name="confirmPassword"
              value={formData.confirmPassword}
              placeholder="Nhập lại mật khẩu mới"
              error={errors.confirmPassword}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                });

                clearError("confirmPassword");
              }}
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
