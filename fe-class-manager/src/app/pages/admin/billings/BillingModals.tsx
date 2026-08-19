import { AlertCircle } from "lucide-react";

import Button from "@/app/components/ui/Button";

import Modal, { ModalBody, ModalFooter } from "@/app/components/ui/Modal";

import type { BillingSubscriptionResponse, PlanResponse } from "@/types";

import { formatDateTime } from "@/app/utils/format";

import { formatCurrency, getMonthlyPrice } from "./billing.utils";

type BillingModalsProps = {
  selectedPlan: PlanResponse | null;
  currentPlan: PlanResponse | null;

  billingSubscription: BillingSubscriptionResponse | null;

  showPlanModal: boolean;
  showCancelModal: boolean;

  isSaving: boolean;

  onClosePlan: () => void;
  onCloseCancel: () => void;

  onConfirmPlan: () => void;
  onConfirmCancel: () => void;
};

export default function BillingModals({
  selectedPlan,
  currentPlan,
  billingSubscription,

  showPlanModal,
  showCancelModal,

  isSaving,

  onClosePlan,
  onCloseCancel,

  onConfirmPlan,
  onConfirmCancel,
}: BillingModalsProps) {
  const selectedPrice = selectedPlan ? getMonthlyPrice(selectedPlan) : null;

  const isKeepingCurrentPlan =
    !!billingSubscription &&
    !!selectedPlan &&
    selectedPlan.id === currentPlan?.id;

  return (
    <>
      <Modal
        isOpen={showPlanModal}
        onClose={() => {
          if (!isSaving) {
            onClosePlan();
          }
        }}
        title={
          !billingSubscription
            ? "Xác nhận đăng ký gói"
            : isKeepingCurrentPlan
              ? "Giữ gói hiện tại"
              : "Xác nhận thay đổi gói"
        }
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Gói đã chọn</p>

              <p className="text-lg font-semibold text-gray-900 mt-1">
                {selectedPlan?.name}
              </p>

              {selectedPrice && (
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  {selectedPrice.amount > 0
                    ? formatCurrency(
                        selectedPrice.amount,
                        selectedPrice.currency,
                      )
                    : "Miễn phí"}

                  {selectedPrice.amount > 0 && "/tháng"}
                </p>
              )}
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />

                <p className="text-sm text-yellow-800">
                  {!billingSubscription
                    ? "Bạn sẽ được chuyển sang trang thanh toán Stripe. Gói trả phí chỉ được kích hoạt sau khi thanh toán thành công."
                    : isKeepingCurrentPlan
                      ? "Thao tác này sẽ hủy thay đổi gói hoặc lịch chuyển về Free đã đặt trước đó và tiếp tục gia hạn gói hiện tại."
                      : "Bạn vẫn sử dụng gói hiện tại đến hết chu kỳ. Gói mới sẽ được áp dụng khi kỳ thanh toán tiếp theo được thanh toán thành công."}
                </p>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" disabled={isSaving} onClick={onClosePlan}>
            Hủy
          </Button>

          <Button
            disabled={isSaving}
            onClick={() => {
              void onConfirmPlan();
            }}
          >
            {isSaving ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          if (!isSaving) {
            onCloseCancel();
          }
        }}
        title="Chuyển về gói Free"
      >
        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />

                <div>
                  <p className="font-medium text-red-900">
                    Hủy gia hạn gói trả phí
                  </p>

                  <p className="text-sm text-red-800 mt-1">
                    Workspace vẫn được sử dụng gói{" "}
                    <strong>{currentPlan?.name}</strong> đến hết chu kỳ hiện
                    tại. Sau đó hệ thống sẽ chuyển về gói Free.
                  </p>
                </div>
              </div>
            </div>

            {billingSubscription?.currentPeriodEnd && (
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-600">Ngày kết thúc</span>

                <span className="text-sm font-medium text-gray-900">
                  {formatDateTime(billingSubscription.currentPeriodEnd)}
                </span>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" disabled={isSaving} onClick={onCloseCancel}>
            Giữ gói hiện tại
          </Button>

          <Button
            variant="danger"
            disabled={isSaving}
            onClick={() => {
              void onConfirmCancel();
            }}
          >
            {isSaving ? "Đang xử lý..." : "Chuyển về Free"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
