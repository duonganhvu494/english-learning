import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

import Input from "@/app/components/ui/Input";
import Button from "@/app/components/ui/Button";

import { authApi, getApiErrorMessage } from "@/api";
import { setCurrentUser } from "@/app/utils/client-storage";
import { resolveWorkspaceId } from "@/app/utils/workspace";

export default function LoginPage() {
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    userName: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await authApi.login({
        identifier: formData.userName,
        userName: formData.userName,
        password: formData.password,
      });

      setCurrentUser(user);

      if (user.mustChangePassword) {
        toast.info("Vui lòng đổi mật khẩu trước khi tiếp tục");

        navigate("/change-password", {
          replace: true,
        });

        return;
      }

      if (user.role === "teacher") {
        try {
          await resolveWorkspaceId(true);
        } catch {
        }
      }

      toast.success("Đăng nhập thành công");

      navigate(
        user.role === "student" ? "/student/classes" : "/admin/dashboard",
        {
          replace: true,
        },
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Đăng nhập thất bại"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />

            <h1 className="text-3xl font-bold text-blue-600">
              English Class Manager
            </h1>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900">Đăng nhập</h2>

          <p className="text-gray-600 mt-2">Chào mừng trở lại</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Tên đăng nhập"
              type="text"
              name="userName"
              placeholder="Nhập tên đăng nhập"
              value={formData.userName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  userName: e.target.value,
                })
              }
              required
            />

            <Input
              label="Mật khẩu"
              type="password"
              name="password"
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value,
                })
              }
              required
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-blue-600 hover:underline font-medium"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
