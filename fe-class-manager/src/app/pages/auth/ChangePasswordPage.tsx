import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { BookOpen, Check, Lock } from "lucide-react";
import { toast } from "sonner";

import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";

import { authApi, getApiErrorMessage } from "@/api";

import { getCurrentUser, setCurrentUser } from "@/app/utils/client-storage";

type ChangePasswordErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const user = getCurrentUser();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<ChangePasswordErrors>({});

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

  const clearError = (field: keyof ChangePasswordErrors) => {
    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      return {
        ...previous,
        [field]: undefined,
      };
    });
  };

  const validateForm = () => {
    const nextErrors: ChangePasswordErrors = {};

    if (!formData.currentPassword) {
      nextErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
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
    } else if (
      formData.currentPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      nextErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
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
      const updatedUser = await authApi.changePassword({
        currentPassword: formData.currentPassword,

        newPassword: formData.newPassword,
      });

      setCurrentUser(updatedUser);

      toast.success("Đổi mật khẩu thành công");

      navigate(
        updatedUser.role === "student"
          ? "/student/classes"
          : "/admin/dashboard",
        {
          replace: true,
        },
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể đổi mật khẩu"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    navigate("/login", {
      replace: true,
    });

    return null;
  }

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

          <h2 className="text-2xl font-semibold text-gray-900">Đổi mật khẩu</h2>

          <p className="text-gray-600 mt-2">
            Đây là lần đăng nhập đầu tiên. Vui lòng thay đổi mật khẩu tạm trước
            khi tiếp tục.
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              error={errors.currentPassword}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  currentPassword: e.target.value,
                });

                clearError("currentPassword");

                if (errors.newPassword) {
                  clearError("newPassword");
                }
              }}
              placeholder="Nhập mật khẩu tạm"
              required
            />

            <Input
              label="Mật khẩu mới"
              type="password"
              name="newPassword"
              value={formData.newPassword}
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
              placeholder="Nhập mật khẩu mới"
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
              error={errors.confirmPassword}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                });

                clearError("confirmPassword");
              }}
              placeholder="Nhập lại mật khẩu mới"
              required
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
