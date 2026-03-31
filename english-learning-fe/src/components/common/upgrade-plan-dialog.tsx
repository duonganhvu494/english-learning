"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import type {
  BillingSubscription,
  PaymentTransaction,
  WorkspacePlan,
  WorkspaceSubscription,
} from "@/types/billing";
import { useAppSettings } from "@/providers/app-settings-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MAX_CLASSES_FEATURE_KEY = "max_classes";
const MAX_STUDENTS_FEATURE_KEY = "max_students";
const CUSTOM_ROLES_FEATURE_KEY = "custom_roles";
const QUIZ_ASSIGNMENTS_FEATURE_KEY = "quiz_assignments";

type UpgradePlanDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availablePlans: WorkspacePlan[];
  workspaceSubscription: WorkspaceSubscription | null;
  billingSubscription: BillingSubscription | null;
  pendingTransaction: PaymentTransaction | null;
  isLoading: boolean;
  isStarting: boolean;
  isPaying: boolean;
  isFailing: boolean;
  isCancelling: boolean;
  errorMessage: string | null;
  onStartSubscription: (planCode: string) => void | Promise<void>;
  onPayPendingTransaction: () => void | Promise<void>;
  onFailPendingTransaction: () => void | Promise<void>;
  onCancelSubscription: () => void | Promise<void>;
};

function formatMoney(cents: number | null, locale: string) {
  if (cents === null) {
    return "-";
  }

  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatDate(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getNumericFeature(plan: WorkspacePlan, featureKey: string) {
  const feature = plan.features.find((item) => item.featureKey === featureKey);
  return typeof feature?.value === "number" ? feature.value : null;
}

function hasBooleanFeature(plan: WorkspacePlan, featureKey: string) {
  const feature = plan.features.find((item) => item.featureKey === featureKey);
  return feature?.value === true;
}

function formatBillingStatus(status: BillingSubscription["status"]) {
  return status.replaceAll("_", " ");
}

export function UpgradePlanDialog({
  open,
  onOpenChange,
  availablePlans,
  workspaceSubscription,
  billingSubscription,
  pendingTransaction,
  isLoading,
  isStarting,
  isPaying,
  isFailing,
  isCancelling,
  errorMessage,
  onStartSubscription,
  onPayPendingTransaction,
  onFailPendingTransaction,
  onCancelSubscription,
}: UpgradePlanDialogProps) {
  const { dictionary, locale } = useAppSettings();

  const paidPlans = availablePlans.filter(
    (plan) => (plan.monthlyPriceCents ?? 0) > 0 && plan.isActive && plan.isPublic,
  );

  const hasPendingActivation =
    billingSubscription?.status === "pending_activation";
  const hasManageableSubscription =
    billingSubscription !== null && billingSubscription.status !== "pending_activation";

  const renderError = errorMessage ? (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {errorMessage}
    </div>
  ) : null;

  const renderLoading = (
    <div className="flex items-center justify-center gap-3 py-12 text-sm text-app-text-muted">
      <Loader2 className="h-4 w-4 animate-spin" />
      {dictionary.dashboard.billingLoading}
    </div>
  );

  const renderPendingPayment = () => (
    <div className="space-y-4">
      <Card className="border-2 border-app-border/70 bg-app-surface-2">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>{billingSubscription?.plan.name ?? "-"}</CardTitle>
              <CardDescription>
                {dictionary.dashboard.billingPendingDescription}
              </CardDescription>
            </div>
            <Badge>{dictionary.dashboard.billingPendingPaymentLabel}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-app-text-muted">
          <p>
            <span className="font-medium text-app-text">
              {dictionary.dashboard.billingCurrentPlanLabel}: 
            </span>
            {workspaceSubscription?.plan.name ?? "-"}
          </p>
          {pendingTransaction ? (
            <>
              <p>
                <span className="font-medium text-app-text">
                  {dictionary.dashboard.billingAmountLabel}: 
                </span>
                {formatMoney(pendingTransaction.amountCents, locale)}
                <span className="ml-1">{dictionary.dashboard.planPeriod}</span>
              </p>
              <p>
                <span className="font-medium text-app-text">
                  {dictionary.dashboard.billingPeriodEndsLabel}: 
                </span>
                {formatDate(pendingTransaction.billingPeriodEnd, locale)}
              </p>
            </>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
              {dictionary.dashboard.billingPendingMissingTransaction}
            </div>
          )}
        </CardContent>
      </Card>

      {pendingTransaction ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="sm:flex-1"
            onClick={() => void onPayPendingTransaction()}
            disabled={isPaying || isFailing}
          >
            {isPaying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {dictionary.dashboard.billingMockPay}
              </>
            ) : (
              dictionary.dashboard.billingMockPay
            )}
          </Button>
          <Button
            variant="outline"
            className="sm:flex-1"
            onClick={() => void onFailPendingTransaction()}
            disabled={isPaying || isFailing}
          >
            {isFailing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {dictionary.dashboard.billingMockFail}
              </>
            ) : (
              dictionary.dashboard.billingMockFail
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );

  const renderManageCurrentSubscription = () => {
    if (!billingSubscription) {
      return null;
    }

    const isPastDue = billingSubscription.status === "past_due";

    return (
      <div className="space-y-4">
        <Card className="border-2 border-app-border/70 bg-app-surface-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>{billingSubscription.plan.name}</CardTitle>
                <CardDescription>
                  {dictionary.dashboard.billingManageDescription}
                </CardDescription>
              </div>
              <Badge>
                {billingSubscription.cancelAtPeriodEnd
                  ? dictionary.dashboard.billingCancelScheduledBadge
                  : formatBillingStatus(billingSubscription.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-app-text-muted">
            <p>
              <span className="font-medium text-app-text">
                {dictionary.dashboard.billingCurrentPlanLabel}: 
              </span>
              {workspaceSubscription?.plan.name ?? billingSubscription.plan.name}
            </p>
            <p>
              <span className="font-medium text-app-text">
                {dictionary.dashboard.billingPeriodEndsLabel}: 
              </span>
              {formatDate(billingSubscription.currentPeriodEnd, locale)}
            </p>

            {isPastDue ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700">
                {dictionary.dashboard.billingPastDue}
              </div>
            ) : null}

            {billingSubscription.cancelAtPeriodEnd ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
                {dictionary.dashboard.billingCancelScheduled}
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => void onCancelSubscription()}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {dictionary.dashboard.billingCancelSubscription}
                  </>
                ) : (
                  dictionary.dashboard.billingCancelSubscription
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="rounded-lg border border-app-border/70 bg-app-surface-2 px-4 py-3 text-sm text-app-text-muted">
          <div className="mb-2 flex items-center gap-2 text-app-text">
            <AlertCircle className="h-4 w-4" />
            <span className="font-medium">
              {dictionary.dashboard.billingPlanChangeUnavailable}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPlanSelection = () => {
    if (paidPlans.length === 0) {
      return (
        <div className="rounded-lg border border-app-border/70 bg-app-surface-2 px-4 py-6 text-center text-sm text-app-text-muted">
          {dictionary.dashboard.billingNoPaidPlans}
        </div>
      );
    }

    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {paidPlans.map((plan) => {
          const maxClasses = getNumericFeature(plan, MAX_CLASSES_FEATURE_KEY);
          const maxStudents = getNumericFeature(plan, MAX_STUDENTS_FEATURE_KEY);
          const customRoles = hasBooleanFeature(plan, CUSTOM_ROLES_FEATURE_KEY);
          const quizAssignments = hasBooleanFeature(
            plan,
            QUIZ_ASSIGNMENTS_FEATURE_KEY,
          );

          return (
            <Card
              key={plan.id}
              className="flex h-full flex-col border-2 border-app-border/70 bg-app-surface-2"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {workspaceSubscription?.plan.code === plan.code ? (
                    <Badge variant="secondary">
                      {dictionary.dashboard.billingCurrentPlanLabel}
                    </Badge>
                  ) : null}
                </div>
                <CardDescription className="text-2xl font-semibold text-app-text">
                  {formatMoney(plan.monthlyPriceCents, locale)}
                  <span className="ml-1 text-sm font-normal text-app-text-muted">
                    {dictionary.dashboard.planPeriod}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-3">
                <p className="text-sm text-app-text-muted">
                  {plan.description ?? dictionary.dashboard.planBenefits}
                </p>
                <ul className="flex-1 list-disc space-y-2 pl-5 text-sm text-app-text-muted">
                  {maxClasses !== null ? <li>{maxClasses} classes</li> : null}
                  {maxStudents !== null ? <li>{maxStudents} students</li> : null}
                  {customRoles ? <li>Custom roles</li> : null}
                  {quizAssignments ? <li>Quiz assignments</li> : null}
                </ul>
                <Button
                  className="mt-auto"
                  onClick={() => void onStartSubscription(plan.code)}
                  disabled={isStarting}
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {dictionary.dashboard.billingStartPlan}
                    </>
                  ) : (
                    dictionary.dashboard.billingStartPlan
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{dictionary.dashboard.upgradeDialogTitle}</DialogTitle>
          <DialogDescription>
            {dictionary.dashboard.billingManageDescription}
          </DialogDescription>
        </DialogHeader>

        {renderError}

        {isLoading
          ? renderLoading
          : hasPendingActivation
            ? renderPendingPayment()
            : hasManageableSubscription
              ? renderManageCurrentSubscription()
              : renderPlanSelection()}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {dictionary.dashboard.createDialogCancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
