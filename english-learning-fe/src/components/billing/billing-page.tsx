"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { useSubscription } from "@/context/subscriptionContext";
import { useData } from "@/mock-data/dataContext";
import { useAuth } from "@/providers/auth-provider";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useNotification } from "@/providers/notification-provider";
import { getDashboardPathByRole } from "@/utils/app-routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlanUpgradeDialog } from "@/components/common/plan-upgrade-dialog";
import { BillingCurrentPlanCard } from "@/components/billing/billing-current-plan-card";
import { BillingHistoryCard } from "@/components/billing/billing-history-card";
import { BillingPaymentDialog } from "@/components/billing/billing-payment-dialog";
import { BillingPaymentMethodCard } from "@/components/billing/billing-payment-method-card";
import type {
  BillingHistoryItem,
  BillingPlanDetail,
  BillingTier,
} from "@/components/billing/billing-types";

const PLAN_LIMITS: Record<BillingTier, number> = {
  free: 3,
  pro: 10,
  enterprise: Infinity,
};

function formatByLocale(locale: "vi" | "en") {
  return locale === "vi" ? "vi-VN" : "en-US";
}

function replaceTemplate(template: string, vars: Record<string, string>) {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );
}

export function BillingPage() {
  const { tier, maxClasses, upgradeTier } = useSubscription();
  const { classes } = useData();
  const { appRole } = useAuth();
  const { dictionary, locale } = useAppSettings();
  const { success: notifySuccess, info: notifyInfo } = useNotification();
  const billingDictionary = dictionary.billingPage;
  const localeTag = formatByLocale(locale);

  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "enterprise">("pro");

  const planDetails = useMemo<Record<BillingTier, BillingPlanDetail>>(
    () => ({
      free: {
        name: billingDictionary.freePlanName,
        price: billingDictionary.freePlanPrice,
        period: billingDictionary.periodForever,
        maxClasses: PLAN_LIMITS.free,
        accentClassName: "text-app-text-muted",
        features: billingDictionary.freeFeatures,
      },
      pro: {
        name: billingDictionary.proPlanName,
        price: billingDictionary.proPlanPrice,
        period: billingDictionary.periodPerMonth,
        maxClasses: PLAN_LIMITS.pro,
        accentClassName: "text-(--color-primary)",
        features: billingDictionary.proFeatures,
      },
      enterprise: {
        name: billingDictionary.enterprisePlanName,
        price: billingDictionary.enterprisePlanPrice,
        period: billingDictionary.periodPerMonth,
        maxClasses: PLAN_LIMITS.enterprise,
        accentClassName: "text-(--color-warning)",
        features: billingDictionary.enterpriseFeatures,
      },
    }),
    [
      billingDictionary.enterpriseFeatures,
      billingDictionary.enterprisePlanName,
      billingDictionary.enterprisePlanPrice,
      billingDictionary.freeFeatures,
      billingDictionary.freePlanName,
      billingDictionary.freePlanPrice,
      billingDictionary.periodForever,
      billingDictionary.periodPerMonth,
      billingDictionary.proFeatures,
      billingDictionary.proPlanName,
      billingDictionary.proPlanPrice,
    ],
  );

  const currentPlan = planDetails[tier];
  const effectiveMaxClasses = Number.isFinite(maxClasses)
    ? maxClasses
    : currentPlan.maxClasses;
  const usagePercentage =
    effectiveMaxClasses === Infinity
      ? 0
      : Math.min(100, Math.round((classes.length / Math.max(1, effectiveMaxClasses)) * 100));
  const usageText = replaceTemplate(billingDictionary.classUsageValue, {
    current: String(classes.length),
    max:
      effectiveMaxClasses === Infinity
        ? billingDictionary.unlimitedSymbol
        : String(effectiveMaxClasses),
  });

  const nextBillingDateText = useMemo(() => {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + 1, 1);
    nextDate.setHours(0, 0, 0, 0);

    return replaceTemplate(billingDictionary.nextBillingDate, {
      date: nextDate.toLocaleDateString(localeTag, {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    });
  }, [billingDictionary.nextBillingDate, localeTag]);

  const billingHistory = useMemo<BillingHistoryItem[]>(() => {
    const paidStatus = billingDictionary.invoiceStatusPaid;
    const planDescription = replaceTemplate(billingDictionary.invoiceDescription, {
      plan: planDetails.pro.name,
    });
    return [
      {
        id: "1",
        date: "2026-03-01",
        description: planDescription,
        amount: `${planDetails.pro.price}.00`,
        status: paidStatus,
      },
      {
        id: "2",
        date: "2026-02-01",
        description: planDescription,
        amount: `${planDetails.pro.price}.00`,
        status: paidStatus,
      },
      {
        id: "3",
        date: "2026-01-01",
        description: planDescription,
        amount: `${planDetails.pro.price}.00`,
        status: paidStatus,
      },
    ];
  }, [
    billingDictionary.invoiceDescription,
    billingDictionary.invoiceStatusPaid,
    planDetails.pro.name,
    planDetails.pro.price,
  ]);

  const handleChooseUpgrade = (plan: "pro" | "enterprise") => {
    setSelectedPlan(plan);
    setUpgradeDialogOpen(false);
    setPaymentDialogOpen(true);
  };

  const handleCompleteUpgrade = () => {
    upgradeTier(selectedPlan);
    setPaymentDialogOpen(false);
    notifySuccess(
      billingDictionary.upgradeSuccessTitle,
      replaceTemplate(billingDictionary.upgradeSuccessMessage, {
        plan: planDetails[selectedPlan].name,
      }),
    );
  };

  const handleCancelSubscription = () => {
    notifyInfo(
      billingDictionary.cancelSubscriptionSoonTitle,
      billingDictionary.cancelSubscriptionSoonMessage,
    );
  };

  const handleUpdatePaymentMethod = () => {
    notifyInfo(
      billingDictionary.updatePaymentSoonTitle,
      billingDictionary.updatePaymentSoonMessage,
    );
  };

  const handleDownloadAll = () => {
    notifyInfo(
      billingDictionary.downloadSoonTitle,
      billingDictionary.downloadSoonMessage,
    );
  };

  const handleDownloadOne = (invoice: BillingHistoryItem) => {
    void invoice;
    notifyInfo(
      billingDictionary.downloadSoonTitle,
      billingDictionary.downloadSoonMessage,
    );
  };

  if (appRole !== "teacher") {
    return (
      <Card className="border-app-border bg-app-surface">
        <CardContent className="space-y-4 py-12 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-(--color-warning)" />
          <p className="text-xl font-semibold text-app-text">
            {billingDictionary.teacherOnlyTitle}
          </p>
          <p className="text-app-text-muted">
            {billingDictionary.teacherOnlyDescription}
          </p>
          <div className="mx-auto w-full max-w-xs">
            <Link href={getDashboardPathByRole(appRole)}>
              <Button variant="outline" className="w-full">
                {billingDictionary.backToDashboard}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-app-text">
          {billingDictionary.title}
        </h1>
        <p className="text-app-text-muted">{billingDictionary.description}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <BillingCurrentPlanCard
          dictionary={billingDictionary}
          tier={tier}
          currentPlan={currentPlan}
          classesCount={classes.length}
          maxClasses={effectiveMaxClasses}
          usagePercentage={usagePercentage}
          usageText={usageText}
          nextBillingDateText={nextBillingDateText}
          onOpenUpgrade={() => setUpgradeDialogOpen(true)}
          onCancelSubscription={handleCancelSubscription}
        />

        <BillingPaymentMethodCard
          dictionary={billingDictionary}
          tier={tier}
          onUpdatePaymentMethod={handleUpdatePaymentMethod}
        />
      </div>

      <BillingHistoryCard
        dictionary={billingDictionary}
        tier={tier}
        history={billingHistory}
        localeTag={localeTag}
        onDownloadAll={handleDownloadAll}
        onDownloadOne={handleDownloadOne}
      />

      <PlanUpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        onUpgrade={handleChooseUpgrade}
        currentTier={tier}
        title={billingDictionary.upgradeDialogTitle}
        description={billingDictionary.upgradeDialogDescription}
        cancelLabel={billingDictionary.cancel}
        proPlan={{
          name: planDetails.pro.name,
          price: planDetails.pro.price,
          period: planDetails.pro.period,
          features: planDetails.pro.features,
          ctaLabel: billingDictionary.upgradeToPro,
          badgeLabel: billingDictionary.proPopularBadge,
        }}
        enterprisePlan={{
          name: planDetails.enterprise.name,
          price: planDetails.enterprise.price,
          period: planDetails.enterprise.period,
          features: planDetails.enterprise.features,
          ctaLabel: billingDictionary.upgradeToEnterprise,
        }}
      />

      <BillingPaymentDialog
        dictionary={billingDictionary}
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        selectedPlan={selectedPlan}
        planDetail={planDetails[selectedPlan]}
        onComplete={handleCompleteUpgrade}
      />
    </div>
  );
}
