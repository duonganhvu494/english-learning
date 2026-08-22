import { useEffect, useState } from "react";
import {
  Building2,
  Mail,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import Button from "@/app/components/ui/Button";
import Card, { CardBody } from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import Input from "@/app/components/ui/Input";

import {
  getApiErrorMessage,
  usersApi,
  workspacesApi,
} from "@/api";

import type {
  UserProfile,
  WorkspaceDetail,
} from "@/types";

import {
  setCurrentUser,
  setWorkspaceId,
} from "@/app/utils/client-storage";

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);

  const [currentUser, setCurrentUserState] =
    useState<UserProfile | null>(null);

  const [workspace, setWorkspace] =
    useState<WorkspaceDetail | null>(null);

  // Profile
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    userName: "",
  });

  const [isSavingProfile, setIsSavingProfile] =
    useState(false);

  // Email
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [isRequestingEmail, setIsRequestingEmail] =
    useState(false);

  const [isVerifyingEmail, setIsVerifyingEmail] =
    useState(false);

  // Workspace
  const [workspaceName, setWorkspaceName] = useState("");

  const [isCreatingWorkspace, setIsCreatingWorkspace] =
    useState(false);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const me = await usersApi.getMe();

      setCurrentUserState(me);
      setCurrentUser(me);

      setProfileForm({
        fullName: me.fullName,
        userName: me.userName,
      });

      setEmail(me.email);

      try {
        const myWorkspace =
          await workspacesApi.getMyWorkspace();

        setWorkspace(myWorkspace);
        setWorkspaceName(myWorkspace.name);
        setWorkspaceId(myWorkspace.id);
      } catch {
        setWorkspace(null);
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tải thông tin cài đặt",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // =========================================================
  // PROFILE
  // =========================================================

  const handleSaveProfile = async (
    event: React.FormEvent,
  ) => {
    event.preventDefault();

    if (isSavingProfile) {
      return;
    }

    setIsSavingProfile(true);

    try {
      const updated = await usersApi.updateMe({
        fullName: profileForm.fullName.trim(),
        userName: profileForm.userName.trim(),
      });

      setCurrentUserState(updated);
      setCurrentUser(updated);

      setProfileForm({
        fullName: updated.fullName,
        userName: updated.userName,
      });

      toast.success("Cập nhật thông tin thành công");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể cập nhật thông tin",
        ),
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  // =========================================================
  // EMAIL
  // =========================================================

  const handleRequestEmailChange = async () => {
    if (!currentUser || isRequestingEmail) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      toast.error("Vui lòng nhập email mới");
      return;
    }

    if (
      normalizedEmail ===
      currentUser.email.toLowerCase()
    ) {
      toast.info("Đây đã là email hiện tại của bạn");
      return;
    }

    setIsRequestingEmail(true);

    try {
      await usersApi.updateMe({
        email: normalizedEmail,
      });

      setPendingEmail(normalizedEmail);
      setOtp("");

      toast.success(
        `Mã xác thực đã được gửi đến ${normalizedEmail}`,
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể gửi mã xác thực",
        ),
      );
    } finally {
      setIsRequestingEmail(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (
      !pendingEmail ||
      otp.length !== 6 ||
      isVerifyingEmail
    ) {
      return;
    }

    setIsVerifyingEmail(true);

    try {
      const updated =
        await usersApi.verifyEmailChangeOtp({
          otp,
        });

      setCurrentUserState(updated);
      setCurrentUser(updated);

      setEmail(updated.email);
      setPendingEmail("");
      setOtp("");

      toast.success("Đổi email thành công");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Mã xác thực không chính xác",
        ),
      );
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (!pendingEmail || isRequestingEmail) {
      return;
    }

    setIsRequestingEmail(true);

    try {
      await usersApi.updateMe({
        email: pendingEmail,
      });

      setOtp("");

      toast.success("Đã gửi lại mã xác thực");
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể gửi lại mã xác thực",
        ),
      );
    } finally {
      setIsRequestingEmail(false);
    }
  };

  const handleCancelEmailChange = () => {
    setPendingEmail("");
    setOtp("");
    setEmail(currentUser?.email ?? "");
  };

  // =========================================================
  // WORKSPACE
  // =========================================================

  const handleCreateWorkspace = async () => {
    const normalizedName = workspaceName.trim();

    if (!normalizedName || isCreatingWorkspace) {
      return;
    }

    setIsCreatingWorkspace(true);

    try {
      const created =
        await workspacesApi.createWorkspace({
          name: normalizedName,
        });

      setWorkspaceId(created.id);

      toast.success("Tạo trung tâm thành công");

      await loadData();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          "Không thể tạo trung tâm",
        ),
      );
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          Đang tải cài đặt...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Cài đặt
        </h1>

        <p className="text-gray-600 mt-1">
          Quản lý thông tin tài khoản và workspace.
        </p>
      </div>

      {/* ================================================= */}
      {/* ACCOUNT */}
      {/* ================================================= */}

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Tài khoản
          </h2>

          <p className="text-sm text-gray-600 mt-1">
            Cập nhật thông tin cá nhân của bạn.
          </p>
        </div>

        <Card>
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-blue-600" />
              </div>

              <form
                onSubmit={handleSaveProfile}
                className="flex-1 space-y-4"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Thông tin cá nhân
                  </h3>

                  <p className="text-sm text-gray-600 mt-1">
                    Thay đổi tên hiển thị và username.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Họ và tên"
                    value={profileForm.fullName}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        fullName: event.target.value,
                      }))
                    }
                    required
                  />

                  <Input
                    label="Username"
                    value={profileForm.userName}
                    onChange={(event) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        userName: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isSavingProfile}
                  >
                    {isSavingProfile
                      ? "Đang lưu..."
                      : "Lưu thay đổi"}
                  </Button>
                </div>
              </form>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ================================================= */}
      {/* EMAIL */}
      {/* ================================================= */}

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Email
          </h2>

          <p className="text-sm text-gray-600 mt-1">
            Email mới cần được xác thực trước khi thay thế
            email hiện tại.
          </p>
        </div>

        <Card>
          <CardBody>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-green-600" />
              </div>

              <div className="flex-1 min-w-0">
                {!pendingEmail ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Địa chỉ email
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">
                          {currentUser?.email}
                        </span>

                        <Badge variant="success">
                          Đã xác thực
                        </Badge>
                      </div>
                    </div>

                    <div className="max-w-xl">
                      <Input
                        label="Email mới"
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder="example@gmail.com"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="button"
                        disabled={isRequestingEmail}
                        onClick={handleRequestEmailChange}
                      >
                        {isRequestingEmail
                          ? "Đang gửi..."
                          : "Gửi mã xác thực"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          Xác thực email mới
                        </h3>

                        <Badge variant="warning">
                          Chờ xác thực
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mt-1">
                        Mã xác thực đã được gửi đến{" "}
                        <strong>{pendingEmail}</strong>.
                      </p>
                    </div>

                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex gap-3">
                        <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

                        <div>
                          <p className="font-medium text-blue-900">
                            Kiểm tra email của bạn
                          </p>

                          <p className="text-sm text-blue-800 mt-1">
                            Nhập mã OTP gồm 6 chữ số để xác
                            nhận địa chỉ email mới.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="max-w-sm">
                      <Input
                        label="Mã OTP"
                        value={otp}
                        maxLength={6}
                        onChange={(event) =>
                          setOtp(
                            event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          )
                        }
                        placeholder="Nhập 6 chữ số"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isRequestingEmail}
                        onClick={handleResendEmailOtp}
                      >
                        {isRequestingEmail
                          ? "Đang gửi..."
                          : "Gửi lại mã"}
                      </Button>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCancelEmailChange}
                        >
                          Hủy
                        </Button>

                        <Button
                          type="button"
                          disabled={
                            otp.length !== 6 ||
                            isVerifyingEmail
                          }
                          onClick={handleVerifyEmail}
                        >
                          {isVerifyingEmail
                            ? "Đang xác thực..."
                            : "Xác thực"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ================================================= */}
      {/* WORKSPACE */}
      {/* ================================================= */}

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Workspace
          </h2>

          <p className="text-sm text-gray-600 mt-1">
            Thông tin trung tâm và mức sử dụng hiện tại.
          </p>
        </div>

        {!workspace ? (
          <Card>
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-yellow-600" />
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Chưa có workspace
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      Tạo trung tâm để bắt đầu quản lý lớp
                      học và học viên.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Tên trung tâm"
                        value={workspaceName}
                        onChange={(event) =>
                          setWorkspaceName(
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <Button
                      type="button"
                      disabled={isCreatingWorkspace}
                      onClick={handleCreateWorkspace}
                    >
                      {isCreatingWorkspace
                        ? "Đang tạo..."
                        : "Tạo trung tâm"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">
                      Trung tâm
                    </p>

                    <p className="text-lg font-bold text-gray-900 mt-1 truncate">
                      {workspace.name}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">
                      Học viên
                    </p>

                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {workspace.studentCount ?? 0}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-yellow-600" />
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">
                      Lớp học
                    </p>

                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {workspace.classCount ?? 0}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}