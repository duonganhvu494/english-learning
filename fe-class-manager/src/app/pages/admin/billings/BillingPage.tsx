import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Calendar,
  Check,
  CreditCard,
  DollarSign,
  X,
} from "lucide-react";

import { toast } from "sonner";

import Button from "@/app/components/ui/Button";

import Card, { CardBody } from "@/app/components/ui/Card";

import Badge from "@/app/components/ui/Badge";

import { billingApi, getApiErrorMessage, plansApi, workspacesApi } from "@/api";

import type {
  BillingSubscriptionResponse,
  PlanResponse,
  WorkspaceSubscriptionResponse,
} from "@/types";

import { formatDateTime } from "@/app/utils/format";

import BillingModals from "./BillingModals";

import {
  formatBillingStatus,
  formatCurrency,
  formatFeatures,
  getMonthlyPrice,
  statusBadgeVariant,
} from "./billing.utils";

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [workspaceSubscription, setWorkspaceSubscription] =
    useState<WorkspaceSubscriptionResponse | null>(null);

  const [billingSubscription, setBillingSubscription] =
    useState<BillingSubscriptionResponse | null>(null);

  const [selectedPlan, setSelectedPlan] = useState<PlanResponse | null>(null);

  const [showPlanModal, setShowPlanModal] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const [
        availablePlans,
        currentWorkspaceSubscription,
        currentBillingSubscription,
      ] = await Promise.all([
        plansApi.getPlans(),

        workspacesApi.getMySubscription(),

        billingApi.getMySubscription(),
      ]);

      setPlans(availablePlans);

      setWorkspaceSubscription(currentWorkspaceSubscription);

      setBillingSubscription(currentBillingSubscription);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Không thể tải thông tin gói cước"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const sortedPlans = useMemo(
    () => [...plans].sort((left, right) => left.sortOrder - right.sortOrder),
    [plans],
  );

  const currentPlan = workspaceSubscription?.plan ?? null;

  const currentPlanId = currentPlan?.id ?? null;

  const currentPrice = currentPlan ? getMonthlyPrice(currentPlan) : null;

  const billingStatus = billingSubscription?.status ?? "free";

  const billingStatusLabel = billingSubscription
    ? formatBillingStatus(billingSubscription.status)
    : "Miễn phí";

  const cycleLabel = billingSubscription?.cancelAtPeriodEnd
    ? "Ngày kết thúc gói"
    : "Ngày gia hạn tiếp theo";

  const handleOpenPlan = (plan: PlanResponse) => {
    setSelectedPlan(plan);
    setShowPlanModal(true);
  };

  const handleClosePlan = () => {
    setShowPlanModal(false);
    setSelectedPlan(null);
  };

  const handleConfirmPlan = async () => {
    if (!selectedPlan || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      if (!billingSubscription) {
        const result = await billingApi.startSubscription({
          planCode: selectedPlan.code,
        });

        window.location.assign(result.checkoutUrl);

        return;
      }

      await billingApi.changePlan({
        planCode: selectedPlan.code,
      });

      const isRestoringCurrentPlan = selectedPlan.id === currentPlanId;

      handleClosePlan();

      toast.success(
        isRestoringCurrentPlan
          ? "Đã tiếp tục sử dụng gói hiện tại"
          : "Đã lên lịch thay đổi gói",
      );

      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể thay đổi gói cước"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!billingSubscription || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await billingApi.cancelSubscription();

      setShowCancelModal(false);

      toast.success("Đã hẹn chuyển về gói Free vào cuối chu kỳ");

      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Không thể hủy gia hạn"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Đang tải thông tin gói cước...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Thanh toán & Gói cước
        </h1>

        <p className="text-gray-600 mt-1">
          Quản lý gói đang sử dụng, gia hạn và thay đổi gói cho workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>

              <div className="min-w-0">
                <p className="text-sm text-gray-600">Gói đang sử dụng</p>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xl font-bold text-gray-900">
                    {currentPlan?.name ?? "Free"}
                  </p>

                  <Badge variant={statusBadgeVariant(billingStatus)}>
                    {billingStatusLabel}
                  </Badge>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>

              <div>
                <p className="text-sm text-gray-600">Chi phí hàng tháng</p>

                <p className="text-xl font-bold text-gray-900 mt-1">
                  {currentPrice && currentPrice.amount > 0
                    ? formatCurrency(currentPrice.amount, currentPrice.currency)
                    : "Miễn phí"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-yellow-600" />
              </div>

              <div>
                <p className="text-sm text-gray-600">{cycleLabel}</p>

                <p className="text-sm font-bold text-gray-900 mt-1">
                  {billingSubscription?.currentPeriodEnd
                    ? formatDateTime(billingSubscription.currentPeriodEnd)
                    : "Không áp dụng"}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {billingSubscription?.status === "pending_activation" && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />

            <div>
              <p className="font-medium text-yellow-900">Đang chờ thanh toán</p>

              <p className="text-sm text-yellow-800 mt-1">
                Gói trả phí chưa được kích hoạt vì giao dịch thanh toán chưa
                hoàn tất.
              </p>
            </div>
          </div>
        </div>
      )}

      {billingSubscription?.status === "past_due" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

            <div>
              <p className="font-medium text-red-900">
                Thanh toán gia hạn chưa thành công
              </p>

              <p className="text-sm text-red-700 mt-1">
                Hệ thống chưa thể thanh toán kỳ gia hạn hiện tại. Vui lòng kiểm
                tra phương thức thanh toán.
              </p>
            </div>
          </div>
        </div>
      )}

      {billingSubscription?.nextPlan && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />

            <div>
              <p className="font-medium text-blue-900">Đã lên lịch đổi gói</p>

              <p className="text-sm text-blue-800 mt-1">
                Gói tiếp theo là{" "}
                <strong>{billingSubscription.nextPlan.name}</strong>
                {billingSubscription.currentPeriodEnd && (
                  <>
                    . Gói mới sẽ được áp dụng sau kỳ hiện tại vào{" "}
                    <strong>
                      {formatDateTime(billingSubscription.currentPeriodEnd)}
                    </strong>
                    .
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {billingSubscription?.cancelAtPeriodEnd && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />

            <div>
              <p className="font-medium text-yellow-900">
                Đã hẹn chuyển về gói Free
              </p>

              <p className="text-sm text-yellow-800 mt-1">
                Gói hiện tại vẫn sử dụng bình thường đến{" "}
                <strong>
                  {formatDateTime(billingSubscription.currentPeriodEnd)}
                </strong>
                . Sau đó workspace sẽ chuyển về gói Free.
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Các gói cước</h2>

          <p className="text-sm text-gray-600 mt-1">
            Chọn gói phù hợp với nhu cầu của workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedPlans.map((plan) => {
            const price = getMonthlyPrice(plan);

            const features = formatFeatures(plan);

            const isCurrent = currentPlanId === plan.id;

            const isFree = plan.code === "free" || !price || price.amount === 0;

            const isScheduledNext =
              billingSubscription?.nextPlan?.id === plan.id;

            const canRestoreCurrentPlan =
              isCurrent &&
              billingSubscription?.status === "active" &&
              (!!billingSubscription.nextPlan ||
                billingSubscription.cancelAtPeriodEnd);

            const billingLocked =
              !!billingSubscription && billingSubscription.status !== "active";

            const disabled =
              isSaving ||
              isScheduledNext ||
              (isCurrent && !canRestoreCurrentPlan) ||
              (!isFree && billingLocked);

            let buttonLabel = "Chọn gói";

            if (isScheduledNext) {
              buttonLabel = "Đã chọn cho kỳ tới";
            } else if (isCurrent) {
              buttonLabel = canRestoreCurrentPlan
                ? "Tiếp tục gói này"
                : "Đang sử dụng";
            } else if (isFree) {
              buttonLabel = billingSubscription ? "Chuyển về Free" : "Miễn phí";
            } else if (!billingSubscription) {
              buttonLabel = "Đăng ký";
            } else if (billingLocked) {
              buttonLabel = "Không thể đổi lúc này";
            } else {
              buttonLabel = "Đổi gói";
            }

            return (
              <Card
                key={plan.id}
                className={isCurrent ? "border-2 border-blue-600" : ""}
              >
                <CardBody>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {isCurrent && <Badge variant="info">Gói hiện tại</Badge>}

                    {isScheduledNext && (
                      <Badge variant="warning">Kỳ tiếp theo</Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>

                  <p className="text-sm text-gray-600 mt-1 min-h-[40px]">
                    {plan.description || "Không có mô tả"}
                  </p>

                  <div className="mt-5">
                    <div className="flex items-end gap-1">
                      <p className="text-3xl font-bold text-gray-900">
                        {price && price.amount > 0
                          ? formatCurrency(price.amount, price.currency)
                          : "Miễn phí"}
                      </p>

                      {price && price.amount > 0 && (
                        <span className="text-sm text-gray-500 mb-1">
                          / tháng
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-5 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-900 mb-3">
                      Bao gồm
                    </p>

                    <ul className="space-y-3">
                      {features.length === 0 ? (
                        <li className="text-sm text-gray-500">
                          Chưa có thông tin tính năng.
                        </li>
                      ) : (
                        features.map((feature) => (
                          <li
                            key={feature.key}
                            className="flex items-start gap-2"
                          >
                            {feature.available ? (
                              <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            ) : (
                              <X className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            )}

                            <span
                              className={
                                feature.available
                                  ? "text-sm text-gray-700"
                                  : "text-sm text-gray-400"
                              }
                            >
                              {feature.label}
                            </span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <Button
                    className="w-full mt-6"
                    variant={isCurrent ? "outline" : "primary"}
                    disabled={disabled}
                    onClick={() => {
                      if (isFree && billingSubscription) {
                        setShowCancelModal(true);

                        return;
                      }

                      handleOpenPlan(plan);
                    }}
                  >
                    {buttonLabel}
                  </Button>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      <BillingModals
        selectedPlan={selectedPlan}
        currentPlan={currentPlan}
        billingSubscription={billingSubscription}
        showPlanModal={showPlanModal}
        showCancelModal={showCancelModal}
        isSaving={isSaving}
        onClosePlan={handleClosePlan}
        onCloseCancel={() => setShowCancelModal(false)}
        onConfirmPlan={handleConfirmPlan}
        onConfirmCancel={handleCancelSubscription}
      />
    </div>
  );
}
