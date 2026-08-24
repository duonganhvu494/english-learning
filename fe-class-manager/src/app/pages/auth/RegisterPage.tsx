import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

import { authApi, getApiErrorMessage, usersApi, workspacesApi } from "@/api";

import { setCurrentUser, setWorkspaceId } from "@/app/utils/client-storage";

const OTP_LENGTH = 6;

type RegisterErrors = {
  fullName?: string;
  userName?: string;
  email?: string;
  password?: string;
  workspaceName?: string;
  verificationCode?: string;
};

export default function RegisterPage() {
  const navigate = useNavigate();

  const [isRegistering, setIsRegistering] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);

  const [isResending, setIsResending] = useState(false);

  const [pendingRegistrationId, setPendingRegistrationId] = useState("");

  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");

  const [verificationCode, setVerificationCode] = useState("");

  const [resendCountdown, setResendCountdown] = useState(0);

  const [errors, setErrors] = useState<RegisterErrors>({});

  const [formData, setFormData] = useState({
    fullName: "",
    userName: "",
    email: "",
    password: "",
    workspaceName: "",
  });

  const isVerificationStep = Boolean(pendingRegistrationId);

  const normalizedVerificationCode = useMemo(
    () => verificationCode.replace(/\D/g, "").slice(0, OTP_LENGTH),
    [verificationCode],
  );

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = setTimeout(
      () => setResendCountdown((value) => value - 1),
      1000,
    );

    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const clearError = (field: keyof RegisterErrors) => {
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

  const validateRegisterForm = () => {
    const nextErrors: RegisterErrors = {};

    const fullName = formData.fullName.trim();

    const userName = formData.userName.trim();

    const email = formData.email.trim();

    const workspaceName = formData.workspaceName.trim();

    if (!fullName) {
      nextErrors.fullName = "Vui lòng nhập họ và tên";
    }

    if (!userName) {
      nextErrors.userName = "Vui lòng nhập tên đăng nhập";
    }

    if (!email) {
      nextErrors.email = "Vui lòng nhập email";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(email)) {
        nextErrors.email = "Email không đúng định dạng";
      }
    }

    if (!formData.password) {
      nextErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!workspaceName) {
      nextErrors.workspaceName = "Vui lòng nhập tên trung tâm";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const validateVerificationCode = () => {
    if (!normalizedVerificationCode) {
      setErrors((previous) => ({
        ...previous,
        verificationCode: "Vui lòng nhập mã xác thực",
      }));

      return false;
    }

    if (normalizedVerificationCode.length !== OTP_LENGTH) {
      setErrors((previous) => ({
        ...previous,
        verificationCode: "Mã xác thực phải gồm 6 số",
      }));

      return false;
    }

    clearError("verificationCode");

    return true;
  };

  const completeRegistration = async () => {
    const user = await authApi.login({
      identifier: formData.userName.trim(),
      userName: formData.userName.trim(),
      password: formData.password,
    });

    setCurrentUser(user);

    const workspaceName = formData.workspaceName.trim();

    if (workspaceName) {
      const workspace = await workspacesApi.createWorkspace({
        name: workspaceName,
      });

      setWorkspaceId(workspace.id);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isRegistering) {
      return;
    }

    if (!validateRegisterForm()) {
      return;
    }

    setIsRegistering(true);

    try {
      const registerResult = await usersApi.register({
        fullName: formData.fullName.trim(),

        userName: formData.userName.trim(),

        email: formData.email.trim(),

        password: formData.password,
      });

      if (registerResult.emailVerificationRequired) {
        setPendingRegistrationId(registerResult.registrationId);

        setPendingVerificationEmail(
          registerResult.email || formData.email.trim(),
        );

        setVerificationCode("");

        setErrors({});

        setResendCountdown(60);

        toast.success(
          "Đăng ký thành công. Mã xác thực đang được gửi đến email của bạn.",
        );

        return;
      }

      await completeRegistration();

      toast.success("Đăng ký thành công");

      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Đăng ký thất bại"));
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pendingRegistrationId || isVerifying) {
      return;
    }

    if (!validateVerificationCode()) {
      return;
    }

    setIsVerifying(true);

    try {
      await authApi.verifyEmailOtp({
        registrationId: pendingRegistrationId,

        otp: normalizedVerificationCode,
      });

      await completeRegistration();

      toast.success("Xác thực email thành công");

      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Xác thực email thất bại"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingRegistrationId || resendCountdown > 0 || isResending) {
      return;
    }

    setIsResending(true);

    try {
      await authApi.resendEmailOtp({
        registrationId: pendingRegistrationId,
      });

      setResendCountdown(60);

      toast.success("Mã xác thực mới đang được gửi đến email của bạn.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể gửi lại mã xác thực"));
    } finally {
      setIsResending(false);
    }
  };

  const handleRegisterAgain = () => {
    setPendingRegistrationId("");
    setPendingVerificationEmail("");
    setVerificationCode("");
    setResendCountdown(0);
    setErrors({});
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />

            <h1 className="text-3xl font-bold text-blue-600">EnglishClass</h1>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900">
            {isVerificationStep ? "Xác thực email" : "Tạo tài khoản"}
          </h2>

          <p className="text-gray-600 mt-2">
            {isVerificationStep
              ? "Nhập mã xác thực 6 số đã gửi đến email của bạn"
              : "Bắt đầu sử dụng ngay"}
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {isVerificationStep ? (
            <form
              onSubmit={handleVerifySubmit}
              noValidate
              className="space-y-4"
            >
              <Input
                label="Email xác thực"
                type="email"
                value={pendingVerificationEmail}
                disabled
              />

              <Input
                label="Mã xác thực"
                type="text"
                placeholder="Nhập mã 6 số"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={OTP_LENGTH}
                value={verificationCode}
                error={errors.verificationCode}
                onChange={(e) => {
                  setVerificationCode(
                    e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH),
                  );

                  clearError("verificationCode");
                }}
                required
              />

              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying
                  ? "Đang xác thực..."
                  : "Xác thực và hoàn tất đăng ký"}
              </Button>

              <div className="text-center">
                {resendCountdown > 0 ? (
                  <p className="text-sm text-gray-600">
                    Gửi lại mã sau{" "}
                    <span className="font-medium text-blue-600">
                      {resendCountdown}s
                    </span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleResendCode()}
                    disabled={isResending}
                    className="text-sm text-blue-600 hover:underline font-medium disabled:opacity-60"
                  >
                    {isResending ? "Đang gửi..." : "Gửi lại mã xác thực"}
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleRegisterSubmit}
              noValidate
              className="space-y-4"
            >
              <Input
                label="Họ và tên"
                type="text"
                name="fullName"
                placeholder="Nguyen Van A"
                value={formData.fullName}
                error={errors.fullName}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    fullName: e.target.value,
                  });

                  clearError("fullName");
                }}
                required
              />

              <Input
                label="Tên đăng nhập"
                type="text"
                name="userName"
                placeholder="nguyenvana"
                value={formData.userName}
                error={errors.userName}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    userName: e.target.value,
                  });

                  clearError("userName");
                }}
                required
              />

              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
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
                label="Mật khẩu"
                type="password"
                name="password"
                placeholder="Tối thiểu 6 ký tự"
                value={formData.password}
                error={errors.password}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    password: e.target.value,
                  });

                  clearError("password");
                }}
                required
              />

              <Input
                label="Tên trung tâm"
                type="text"
                name="workspaceName"
                placeholder="Trung tâm Tiếng Anh ABC"
                value={formData.workspaceName}
                error={errors.workspaceName}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    workspaceName: e.target.value,
                  });

                  clearError("workspaceName");
                }}
                required
              />

              <Button type="submit" className="w-full" disabled={isRegistering}>
                {isRegistering ? "Đang xử lý..." : "Đăng ký"}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            {isVerificationStep ? (
              <p className="text-sm text-gray-600">
                Sai email?{" "}
                <button
                  type="button"
                  className="text-blue-600 hover:underline font-medium"
                  onClick={handleRegisterAgain}
                >
                  Đăng ký lại
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-600">
                Đã có tài khoản?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Đăng nhập
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
