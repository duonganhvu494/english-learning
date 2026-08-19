import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Building2, Users, Bell, User } from 'lucide-react';
import { toast } from 'sonner';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { getApiErrorMessage, usersApi, workspacesApi } from '@/api';
import type { PlanResponse, UserProfile, WorkspaceDetail, WorkspaceSubscriptionResponse } from '@/types';
import { formatDateTime } from '@/app/utils/format';
import { setCurrentUser, setWorkspaceId } from '@/app/utils/client-storage';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [subscription, setSubscription] = useState<WorkspaceSubscriptionResponse | null>(null);
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    userName: '',
    email: '',
  });
  const [workspaceName, setWorkspaceName] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const me = await usersApi.getMe();
      setCurrentUserState(me);
      setCurrentUser(me);
      setProfileForm({
        fullName: me.fullName,
        userName: me.userName,
        email: me.email,
      });

      const availablePlans = await workspacesApi.getPlans();
      setPlans(availablePlans);

      try {
        const myWorkspace = await workspacesApi.getMyWorkspace();
        setWorkspace(myWorkspace);
        setWorkspaceName(myWorkspace.name);
        setWorkspaceId(myWorkspace.id);

        try {
          const mySubscription = await workspacesApi.getMySubscription();
          setSubscription(mySubscription);
        } catch {
          setSubscription(null);
        }
      } catch {
        setWorkspace(null);
        setSubscription(null);
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải dữ liệu cài đặt'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const activePlan = useMemo(() => {
    if (subscription?.plan) {
      return subscription.plan;
    }
    return plans.find((plan) => plan.code === 'free') || plans[0] || null;
  }, [plans, subscription]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingProfile) {
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await usersApi.updateMe({
        fullName: profileForm.fullName,
        userName: profileForm.userName,
        email: profileForm.email,
      });
      setCurrentUserState(updated);
      setCurrentUser(updated);
      toast.success('Cập nhật profile thành công');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật profile'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim() || isCreatingWorkspace) {
      return;
    }

    setIsCreatingWorkspace(true);
    try {
      const createdWorkspace = await workspacesApi.createWorkspace({
        name: workspaceName.trim(),
      });
      setWorkspaceId(createdWorkspace.id);
      toast.success('Tạo workspace thành công');
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tạo workspace'));
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600 mt-1">Quản lý profile, workspace và gói cước</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Thông tin cá nhân</h3>
              </div>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <Input
                  label="Họ và tên"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, fullName: e.target.value }))}
                  required
                />
                <Input
                  label="Username"
                  value={profileForm.userName}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, userName: e.target.value }))}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                  required
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSavingProfile || isLoading}>
                    {isSavingProfile ? 'Đang lưu...' : 'Lưu profile'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Gói cước hiện tại</h3>
              </div>
            </CardHeader>
            <CardBody>
              {!workspace && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Bạn chưa có workspace. Tạo workspace để bắt đầu.</p>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Tên trung tâm"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                    />
                    <Button onClick={handleCreateWorkspace} disabled={isCreatingWorkspace}>
                      {isCreatingWorkspace ? 'Đang tạo...' : 'Tạo trung tâm'}
                    </Button>
                  </div>
                </div>
              )}

              {workspace && (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-2xl font-bold text-gray-900">{activePlan?.name || 'N/A'}</h4>
                        <Badge variant="success">Đang hoạt động</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Giá: {activePlan?.monthlyPriceCents !== null && activePlan?.monthlyPriceCents !== undefined
                          ? `${(activePlan.monthlyPriceCents / 100).toLocaleString('vi-VN')} VND / thang`
                          : 'Liên hệ'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Kỳ tiếp theo: {subscription ? formatDateTime(subscription.startedAt) : 'Chưa có subscription detail'}
                      </p>
                    </div>
                    <Button variant="outline">Nâng cấp gói</Button>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h5 className="font-medium text-gray-900 mb-3">Tính năng gói đang chọn</h5>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {(activePlan?.features || []).map((feature) => (
                        <li key={feature.featureKey} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                          <span>{feature.featureKey}: {feature.valueString ?? feature.valueNumber ?? String(feature.valueBoolean)}</span>
                        </li>
                      ))}
                      {(activePlan?.features || []).length === 0 && (
                        <li className="text-gray-500">Không có thông tin feature</li>
                      )}
                    </ul>
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Thông tin trung tâm</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Tên trung tâm</p>
                <p className="font-medium text-gray-900">{workspace?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Mã trung tâm</p>
                <p className="font-medium text-gray-900 font-mono break-all">{workspace?.id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Người quản lý</p>
                <p className="font-medium text-gray-900">{workspace?.owner?.fullName || currentUser?.fullName || '-'}</p>
              </div>
              {workspace && (
                <Button variant="outline" className="w-full" onClick={() => toast.info('Thông tin workspace đã được đồng bộ từ API')}>
                  Đồng bộ lại
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Sử dụng</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Học viên</p>
                  <p className="text-sm font-medium text-gray-900">{workspace?.studentCount ?? 0}</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Lớp học</p>
                  <p className="text-sm font-medium text-gray-900">{workspace?.classCount ?? 0}</p>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Thông báo</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Email thông báo</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Nhắc nhở bài tập</span>
                <input type="checkbox" defaultChecked className="rounded" />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Báo cáo tuần</span>
                <input type="checkbox" className="rounded" />
              </label>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}



