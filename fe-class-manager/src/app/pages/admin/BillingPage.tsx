import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import Button from '../../components/ui/Button';
import Card, { CardBody, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal, { ModalBody, ModalFooter } from '../../components/ui/Modal';
import {
  billingApi,
  getApiErrorMessage,
  workspacesApi,
} from '@/api';
import type {
  BillingSubscriptionResponse,
  PaymentTransactionResponse,
  PlanResponse,
} from '@/types';
import { formatDateTime } from '@/app/utils/format';

function formatCurrency(amountCents: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amountCents / 100);
}

function statusBadgeVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'active' || status === 'paid') {
    return 'success';
  }
  if (status === 'pending' || status === 'pending_activation') {
    return 'warning';
  }
  if (status === 'failed' || status === 'past_due' || status === 'cancelled') {
    return 'danger';
  }
  return 'default';
}

function formatFeature(plan: PlanResponse): string[] {
  if (plan.features.length === 0) {
    return ['Không có thông tin feature'];
  }
  return plan.features.map((feature) => {
    if (feature.valueString && feature.valueString.trim().length > 0) {
      return `${feature.featureKey}: ${feature.valueString}`;
    }
    if (typeof feature.valueNumber === 'number') {
      return `${feature.featureKey}: ${feature.valueNumber}`;
    }
    if (typeof feature.valueBoolean === 'boolean') {
      return `${feature.featureKey}: ${feature.valueBoolean ? 'Có' : 'Không'}`;
    }
    return feature.featureKey;
  });
}

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [subscription, setSubscription] = useState<BillingSubscriptionResponse | null>(null);
  const [latestTransactions, setLatestTransactions] = useState<PaymentTransactionResponse[]>([]);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanResponse | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [availablePlans, currentSubscription] = await Promise.all([
        workspacesApi.getPlans(),
        billingApi.getMySubscription(),
      ]);
      setPlans(availablePlans);
      setSubscription(currentSubscription);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể tải thông tin billing'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const currentPlanId = subscription?.plan.id ?? null;
  const pendingTransaction = latestTransactions.find((item) => item.status === 'pending') ?? null;

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.sortOrder - b.sortOrder),
    [plans],
  );

  const handleOpenUpgrade = (plan: PlanResponse) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await billingApi.startSubscription({
        planCode: selectedPlan.code,
      });
      setSubscription(result.billingSubscription);
      setLatestTransactions((prev) => [result.paymentTransaction, ...prev]);
      setShowUpgradeModal(false);
      toast.success('Khởi tạo gói cước thành công');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể khởi tạo gói cước'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const updated = await billingApi.cancelSubscription();
      setSubscription(updated);
      setShowCancelModal(false);
      toast.success('Đã hẹn hủy gói vào cuối chu kỳ');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể hủy gói cước'));
    } finally {
      setIsSaving(false);
    }
  };

  const handlePayMock = async () => {
    if (!pendingTransaction || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await billingApi.payMockTransaction(pendingTransaction.id);
      setLatestTransactions((prev) =>
        prev.map((item) => (item.id === result.id ? result : item)),
      );
      const freshSubscription = await billingApi.getMySubscription();
      setSubscription(freshSubscription);
      toast.success('Đã mô phỏng thanh toán thành công');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể mô phỏng thanh toán'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleFailMock = async () => {
    if (!pendingTransaction || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const result = await billingApi.failMockTransaction(pendingTransaction.id, {
        failureReason: 'Card declined',
      });
      setLatestTransactions((prev) =>
        prev.map((item) => (item.id === result.id ? result : item)),
      );
      const freshSubscription = await billingApi.getMySubscription();
      setSubscription(freshSubscription);
      toast.success('Đã mô phỏng giao dịch thất bại');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể mô phỏng giao dịch lỗi'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thanh toán và gói cước</h1>
        <p className="text-gray-600 mt-1">Quản lý gói cước và theo dõi trạng thái subscription</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Gói hiện tại</p>
                <p className="text-xl font-bold text-gray-900">{subscription?.plan.name ?? 'Free'}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chi phí/tháng</p>
                <p className="text-xl font-bold text-gray-900">
                  {subscription?.plan.monthlyPriceCents
                    ? formatCurrency(subscription.plan.monthlyPriceCents)
                    : '0 VND'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chu kỳ hiện tại đến</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDateTime(subscription?.currentPeriodEnd)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Thông tin subscription</h3>
            <Badge variant={statusBadgeVariant(subscription?.status ?? 'default')}>
              {subscription?.status ?? 'free'}
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {isLoading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : subscription ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan</p>
                  <p className="font-medium text-gray-900">{subscription.plan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kích hoạt</p>
                  <p className="font-medium text-gray-900">{formatDateTime(subscription.activatedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bắt đầu chu kỳ</p>
                  <p className="font-medium text-gray-900">{formatDateTime(subscription.currentPeriodStart)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Kết thúc chu kỳ</p>
                  <p className="font-medium text-gray-900">{formatDateTime(subscription.currentPeriodEnd)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  disabled={isSaving || subscription.cancelAtPeriodEnd}
                  onClick={() => setShowCancelModal(true)}
                >
                  {subscription.cancelAtPeriodEnd ? 'Đã hẹn hủy' : 'Hủy vào cuối chu kỳ'}
                </Button>
                {pendingTransaction && (
                  <>
                    <Button disabled={isSaving} onClick={() => void handlePayMock()}>
                      Mock thanh toán thành công
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isSaving}
                      onClick={() => void handleFailMock()}
                    >
                      Mock thanh toán thất bại
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Workspace đang ở gói miễn phí hoặc chưa tạo paid subscription.
            </p>
          )}
        </CardBody>
      </Card>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Các gói cước</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedPlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const isPaidPlan = (plan.monthlyPriceCents ?? 0) > 0;
            return (
              <Card
                key={plan.id}
                className={isCurrent ? 'border-2 border-blue-600' : ''}
              >
                <CardBody>
                  {isCurrent && (
                    <Badge variant="info" className="mb-3">
                      Gói hiện tại
                    </Badge>
                  )}

                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{plan.description || 'Không có mô tả'}</p>

                  <div className="mt-4">
                    <p className="text-2xl font-bold text-gray-900">
                      {plan.monthlyPriceCents ? formatCurrency(plan.monthlyPriceCents) : 'Liên hệ'}
                    </p>
                    <p className="text-xs text-gray-500">/ tháng</p>
                  </div>

                  <ul className="mt-4 space-y-2">
                    {formatFeature(plan).map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full mt-5"
                    variant={isCurrent ? 'outline' : 'primary'}
                    disabled={!isPaidPlan || isCurrent || isSaving}
                    onClick={() => handleOpenUpgrade(plan)}
                  >
                    {isCurrent ? 'Đang sử dụng' : isPaidPlan ? 'Nâng cấp' : 'Không hỗ trợ thanh toán'}
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Giao dịch gần nhất (phiên hiện tại)</h3>
        </CardHeader>
        <CardBody>
          {latestTransactions.length === 0 ? (
            <p className="text-sm text-gray-500">
              Chưa có giao dịch mới trong phiên này. (Backend hiện chưa có endpoint list lịch sử giao dịch)
            </p>
          ) : (
            <div className="space-y-3">
              {latestTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-start justify-between border border-gray-200 rounded-lg p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{txn.id}</p>
                      <Badge variant={statusBadgeVariant(txn.status)}>
                        {txn.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Plan: {txn.planCode} • Type: {txn.type}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Kỳ: {formatDateTime(txn.billingPeriodStart)} → {formatDateTime(txn.billingPeriodEnd)}
                    </p>
                    {txn.failureReason && (
                      <p className="text-xs text-red-600 mt-1">Lý do lỗi: {txn.failureReason}</p>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">{formatCurrency(txn.amountCents)}</p>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Xác nhận nâng cấp gói"
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                Bạn đang chọn gói <span className="font-semibold">{selectedPlan?.name}</span>
              </p>
              {selectedPlan?.monthlyPriceCents ? (
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatCurrency(selectedPlan.monthlyPriceCents)}/tháng
                </p>
              ) : (
                <p className="text-sm text-gray-600 mt-1">Plan này không có thanh toán định kỳ</p>
              )}
            </div>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  Sau khi xác nhận, hệ thống sẽ tạo một giao dịch mock ở trạng thái pending.
                </p>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowUpgradeModal(false)} disabled={isSaving}>
            Hủy
          </Button>
          <Button onClick={() => void handleConfirmUpgrade()} disabled={isSaving}>
            Xác nhận
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Hủy gia hạn subscription"
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-2">
                <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">
                  Subscription sẽ được hủy vào cuối kỳ hiện tại.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Kết thúc kỳ hiện tại: <span className="font-medium">{formatDateTime(subscription?.currentPeriodEnd)}</span>
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setShowCancelModal(false)} disabled={isSaving}>
            Giữ nguyên
          </Button>
          <Button variant="danger" onClick={() => void handleCancelSubscription()} disabled={isSaving}>
            Xác nhận hủy
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
