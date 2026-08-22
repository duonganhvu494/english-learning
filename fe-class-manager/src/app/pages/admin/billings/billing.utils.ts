import type { PlanPrice, PlanResponse } from "@/types";

export type DisplayFeature = {
  key: string;
  label: string;
  available: boolean;
};

export function getMonthlyPrice(plan: PlanResponse): PlanPrice | null {
  return (
    plan.prices.find(
      (price) => price.interval === "monthly" && price.currency === "USD",
    ) ??
    plan.prices.find((price) => price.interval === "monthly") ??
    null
  );
}

export function formatCurrency(amountCents: number, currency = "USD"): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
  }).format(amountCents / 100);
}

export function statusBadgeVariant(
  status: string,
): "success" | "warning" | "danger" | "default" {
  if (status === "active") {
    return "success";
  }

  if (status === "pending_activation" || status === "past_due") {
    return "warning";
  }

  if (status === "cancelled" || status === "expired") {
    return "danger";
  }

  return "default";
}

export function formatBillingStatus(status: string): string {
  switch (status) {
    case "active":
      return "Đang hoạt động";

    case "pending_activation":
      return "Chờ kích hoạt";

    case "past_due":
      return "Thanh toán quá hạn";

    case "cancelled":
      return "Đã hủy";

    case "expired":
      return "Đã hết hạn";

    default:
      return status;
  }
}

export function formatFeatures(plan: PlanResponse): DisplayFeature[] {
  return plan.features
    .map((feature): DisplayFeature | null => {
      switch (feature.featureKey) {
        case "max_students": {
          if (typeof feature.value !== "number") {
            return null;
          }

          return {
            key: feature.featureKey,
            label: `Tối đa ${feature.value} học viên`,
            available: true,
          };
        }

        case "max_classes": {
          if (typeof feature.value !== "number") {
            return null;
          }

          return {
            key: feature.featureKey,
            label: `Tối đa ${feature.value} lớp`,
            available: true,
          };
        }

        case "custom_roles": {
          const enabled = feature.value === true;

          return {
            key: feature.featureKey,
            label: enabled
              ? "Tạo vai trò tùy chỉnh"
              : "Không hỗ trợ vai trò tùy chỉnh",
            available: enabled,
          };
        }

        case "quiz_assignments": {
          const enabled = feature.value === true;

          return {
            key: feature.featureKey,
            label: enabled
              ? "Giao bài kiểm tra"
              : "Không hỗ trợ giao bài kiểm tra",
            available: enabled,
          };
        }

        default: {
          const label = feature.featureKey
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char: string) => char.toUpperCase());

          if (typeof feature.value === "boolean") {
            return {
              key: feature.featureKey,
              label: `${label}: ${feature.value ? "Có" : "Không"}`,
              available: feature.value,
            };
          }

          if (
            typeof feature.value === "number" ||
            typeof feature.value === "string"
          ) {
            return {
              key: feature.featureKey,
              label: `${label}: ${feature.value}`,
              available: true,
            };
          }

          return {
            key: feature.featureKey,
            label,
            available: true,
          };
        }
      }
    })
    .filter((feature): feature is DisplayFeature => feature !== null);
}
