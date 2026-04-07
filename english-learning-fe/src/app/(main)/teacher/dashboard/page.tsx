"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, billingApi, classesApi, workspacesApi } from "@/api";
import { translateApiMessage } from "@/api/core/api-message-translator";
import { useData } from "@/mock-data/dataContext";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useAuth } from "@/providers/auth-provider";
import type {
  BillingSubscription,
  PaymentTransaction,
  WorkspacePlan,
  WorkspaceSubscription,
} from "@/types/billing";
import type { Class as DashboardClass } from "@/types/types";
import type { WorkspaceStudentListItem } from "@/types/workspace";
import { FileText, GraduationCap, TrendingUp, Users } from "lucide-react";
import { CreateClassDialog } from "@/components/common/create-class-dialog";
import { PlanUpgradeDialog } from "@/components/common/plan-upgrade-dialog";
import { UpgradePlanDialog } from "@/components/common/upgrade-plan-dialog";
import { DashboardPageHeader } from "@/components/teacher/dashboard/dashboard-page-header";
import { DashboardRecentClassesCard } from "@/components/teacher/dashboard/dashboard-recent-classes-card";
import {
  DashboardStatsGrid,
  type DashboardStatItem,
} from "@/components/teacher/dashboard/dashboard-stats-grid";
import { DashboardTopStudentsCard } from "@/components/teacher/dashboard/dashboard-top-students-card";

const CLASS_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
];

const MAX_CLASSES_FEATURE_KEY = "max_classes";
const PENDING_TRANSACTION_STORAGE_PREFIX = "billing:pending-transaction:";

type BillingFeedback = {
  tone: "success" | "warning";
  message: string;
};

type PlanUpgradeMode = "limit" | "manage";

function mapClassColor(index: number) {
  return CLASS_COLORS[index % CLASS_COLORS.length];
}

function getPendingTransactionStorageKey(workspaceId: string) {
  return `${PENDING_TRANSACTION_STORAGE_PREFIX}${workspaceId}`;
}

function readPendingTransaction(workspaceId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(
    getPendingTransactionStorageKey(workspaceId),
  );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PaymentTransaction;
  } catch {
    window.sessionStorage.removeItem(
      getPendingTransactionStorageKey(workspaceId),
    );
    return null;
  }
}

function getMaxClasses(subscription: WorkspaceSubscription | null) {
  const feature = subscription?.plan.features.find(
    (item) => item.featureKey === MAX_CLASSES_FEATURE_KEY,
  );

  if (typeof feature?.value === "number") {
    return feature.value;
  }

  return Number.POSITIVE_INFINITY;
}

function mapFeedbackClassName(tone: BillingFeedback["tone"]) {
  if (tone === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function DashboardPage() {
  const { dictionary } = useAppSettings();
  const { activeWorkspaceId } = useAuth();
  const { projects } = useData();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [classes, setClasses] = useState<DashboardClass[]>([]);
  const [students, setStudents] = useState<WorkspaceStudentListItem[]>([]);
  const [workspaceSubscription, setWorkspaceSubscription] =
    useState<WorkspaceSubscription | null>(null);
  const [billingSubscription, setBillingSubscription] =
    useState<BillingSubscription | null>(null);
  const [availablePlans, setAvailablePlans] = useState<WorkspacePlan[]>([]);
  const [pendingTransaction, setPendingTransaction] =
    useState<PaymentTransaction | null>(null);
  const [isClassesLoading, setIsClassesLoading] = useState(true);
  const [isStudentsLoading, setIsStudentsLoading] = useState(true);
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [isStartingSubscription, setIsStartingSubscription] = useState(false);
  const [isPayingTransaction, setIsPayingTransaction] = useState(false);
  const [isFailingTransaction, setIsFailingTransaction] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] =
    useState(false);
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [classLimitUpgradeDialogOpen, setClassLimitUpgradeDialogOpen] =
    useState(false);
  const [planUpgradeMode, setPlanUpgradeMode] =
    useState<PlanUpgradeMode>("limit");
  const [classLimitUpgradeTarget, setClassLimitUpgradeTarget] = useState<
    number | null
  >(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [billingFeedback, setBillingFeedback] =
    useState<BillingFeedback | null>(null);

  const syncPendingTransaction = useCallback(
    (nextTransaction: PaymentTransaction | null) => {
      setPendingTransaction(nextTransaction);

      if (typeof window === "undefined" || !activeWorkspaceId) {
        return;
      }

      const storageKey = getPendingTransactionStorageKey(activeWorkspaceId);
      if (!nextTransaction) {
        window.sessionStorage.removeItem(storageKey);
        return;
      }

      window.sessionStorage.setItem(
        storageKey,
        JSON.stringify(nextTransaction),
      );
    },
    [activeWorkspaceId],
  );

  const loadClasses = useCallback(async () => {
    if (!activeWorkspaceId) {
      setClasses([]);
      setIsClassesLoading(false);
      return;
    }

    setIsClassesLoading(true);
    try {
      const response = await classesApi.listClasses(activeWorkspaceId);
      const mappedClasses = response.result.map((item, index) => ({
        id: item.id,
        name: item.className,
        description: item.description ?? "",
        schedule: "",
        studentCount: item.studentCount,
        color: mapClassColor(index),
        level: "Beginner" as const,
        status: "Active" as const,
      }));
      setClasses(mappedClasses);
    } catch {
      setClasses([]);
    } finally {
      setIsClassesLoading(false);
    }
  }, [activeWorkspaceId]);

  const loadStudents = useCallback(async () => {
    if (!activeWorkspaceId) {
      setStudents([]);
      setIsStudentsLoading(false);
      return;
    }

    setIsStudentsLoading(true);
    try {
      const response = await workspacesApi.listStudents(activeWorkspaceId);
      setStudents(response.result);
    } catch {
      setStudents([]);
    } finally {
      setIsStudentsLoading(false);
    }
  }, [activeWorkspaceId]);

  const loadBillingData = useCallback(async () => {
    if (!activeWorkspaceId) {
      setWorkspaceSubscription(null);
      setBillingSubscription(null);
      setAvailablePlans([]);
      syncPendingTransaction(null);
      setIsBillingLoading(false);
      return;
    }

    setIsBillingLoading(true);
    try {
      const [workspaceSubscriptionResponse, plansResponse, billingResponse] =
        await Promise.all([
          workspacesApi.getMySubscription(),
          workspacesApi.listPlans(),
          billingApi.getMySubscription(),
        ]);

      const nextWorkspaceSubscription = workspaceSubscriptionResponse.result;
      const nextBillingSubscription = billingResponse.result;
      const storedPendingTransaction =
        readPendingTransaction(activeWorkspaceId);

      setWorkspaceSubscription(nextWorkspaceSubscription);
      setAvailablePlans(plansResponse.result);
      setBillingSubscription(nextBillingSubscription);

      if (
        nextBillingSubscription?.status === "pending_activation" &&
        storedPendingTransaction?.billingSubscriptionId ===
          nextBillingSubscription.id
      ) {
        setPendingTransaction(storedPendingTransaction);
      } else {
        syncPendingTransaction(null);
      }
    } catch {
      setWorkspaceSubscription(null);
      setBillingSubscription(null);
      setAvailablePlans([]);
      syncPendingTransaction(null);
    } finally {
      setIsBillingLoading(false);
    }
  }, [activeWorkspaceId, syncPendingTransaction]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    void loadBillingData();
  }, [loadBillingData]);

  useEffect(() => {
    if (searchParams.get("panel") === "billing") {
      setBillingError(null);
      setPlanUpgradeMode("manage");
      setClassLimitUpgradeTarget(null);
      setClassLimitUpgradeDialogOpen(true);
    }
  }, [searchParams]);

  const totalStudents = students.length;
  const activeClasses = classes.length;
  const activeStudentsCount = students.filter(
    (student) => student.status.toLowerCase() === "active",
  ).length;
  const activeStudentsRate =
    totalStudents > 0
      ? Math.round((activeStudentsCount / totalStudents) * 100)
      : 0;
  const pendingSubmissions = projects.reduce(
    (sum, project) => sum + (project.totalStudents - project.submittedCount),
    0,
  );

  const currentMaxClasses = useMemo(
    () => getMaxClasses(workspaceSubscription),
    [workspaceSubscription],
  );
  const currentUpgradeTier = useMemo<"free" | "pro" | "enterprise">(() => {
    if (!Number.isFinite(currentMaxClasses)) {
      return "enterprise";
    }

    if (currentMaxClasses > 3) {
      return "pro";
    }

    return "free";
  }, [currentMaxClasses]);

  const openPlanUpgradeDialog = useCallback(
    (mode: PlanUpgradeMode, limit: number | null = null) => {
      setPlanUpgradeMode(mode);

      if (mode === "limit") {
        const fallbackLimit = Number.isFinite(currentMaxClasses)
          ? currentMaxClasses
          : 3;
        const nextLimit =
          typeof limit === "number" && Number.isFinite(limit)
            ? limit
            : fallbackLimit;
        setClassLimitUpgradeTarget(nextLimit);
      } else {
        setClassLimitUpgradeTarget(null);
      }

      setClassLimitUpgradeDialogOpen(true);
    },
    [currentMaxClasses],
  );

  const recentClasses = classes.slice(0, 3);
  const highlightedStudents = useMemo(
    () =>
      [...students]
        .sort((a, b) => {
          const aIsActive = a.status.toLowerCase() === "active";
          const bIsActive = b.status.toLowerCase() === "active";

          if (aIsActive !== bIsActive) {
            return aIsActive ? -1 : 1;
          }

          return a.fullName.localeCompare(b.fullName);
        })
        .slice(0, 5),
    [students],
  );

  const stats: DashboardStatItem[] = [
    {
      title: dictionary.dashboard.activeClasses,
      value: activeClasses,
      icon: GraduationCap,
      description: `${classes.length} ${dictionary.dashboard.activeClasses}`,
      color: "text-[var(--color-primary)]",
      bgColor: "bg-[var(--color-primary-soft)]",
    },
    {
      title: dictionary.dashboard.totalStudents,
      value: totalStudents,
      icon: Users,
      description: dictionary.myCourse.overview.statsStudents,
      color: "text-[var(--color-secondary)]",
      bgColor: "bg-[var(--color-secondary-soft)]",
    },
    {
      title: dictionary.studentsPage.activeStudents,
      value: activeStudentsCount,
      icon: TrendingUp,
      description: `${activeStudentsRate}%`,
      color: "text-[var(--color-success)]",
      bgColor: "bg-[var(--color-success-soft)]",
    },
    {
      title: dictionary.dashboard.pendingWork,
      value: pendingSubmissions,
      icon: FileText,
      description: dictionary.dashboard.upcomingProjects,
      color: "text-[var(--color-warning)]",
      bgColor: "bg-[var(--color-warning-soft)]",
    },
  ];

  const translateBillingError = useCallback(
    (error: unknown, fallback: string) => {
      if (error instanceof ApiError) {
        return translateApiMessage(
          error.details,
          error.code,
          dictionary,
          fallback,
        );
      }

      return fallback;
    },
    [dictionary],
  );

  const handleCreateClass = () => {
    if (!activeWorkspaceId) {
      return;
    }

    if (
      Number.isFinite(currentMaxClasses) &&
      classes.length >= currentMaxClasses
    ) {
      openPlanUpgradeDialog("limit", currentMaxClasses);
      return;
    }

    setCreateClassDialogOpen(true);
  };

  const handleAddClass = (classData: {
    id: string;
    name: string;
    description: string;
    schedule: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    status: "Active" | "Draft" | "Completed";
    color: string;
    studentCount: number;
  }) => {
    void classData;
    void loadClasses();
  };

  const handleOpenBillingDialog = () => {
    setBillingError(null);
    openPlanUpgradeDialog("manage");
  };

  const handlePlanUpgradeDialogOpenChange = (open: boolean) => {
    setClassLimitUpgradeDialogOpen(open);

    if (!open) {
      setClassLimitUpgradeTarget(null);
      if (searchParams.get("panel") === "billing") {
        router.replace(pathname);
      }
    }
  };

  const handleBillingDialogOpenChange = (open: boolean) => {
    setUpgradeDialogOpen(open);

    if (!open && searchParams.get("panel") === "billing") {
      router.replace(pathname);
    }
  };

  const handleStartSubscription = async (planCode: string) => {
    setBillingError(null);
    setBillingFeedback(null);
    setIsStartingSubscription(true);

    try {
      const response = await billingApi.startSubscription({ planCode });
      setBillingSubscription(response.result.billingSubscription);
      syncPendingTransaction(response.result.paymentTransaction);
    } catch (error) {
      setBillingError(
        translateBillingError(error, dictionary.dashboard.billingActionError),
      );
    } finally {
      setIsStartingSubscription(false);
    }
  };

  const handleClassLimitUpgrade = (targetTier: "pro" | "enterprise") => {
    const paidPlans = [...availablePlans]
      .filter(
        (plan) =>
          (plan.monthlyPriceCents ?? 0) > 0 && plan.isActive && plan.isPublic,
      )
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const targetPlan =
      targetTier === "pro" ? paidPlans[0] : paidPlans[paidPlans.length - 1];

    if (!targetPlan) {
      setBillingError(dictionary.dashboard.billingNoPaidPlans);
      setUpgradeDialogOpen(true);
      return;
    }

    setUpgradeDialogOpen(true);
    void handleStartSubscription(targetPlan.code);
  };

  const handlePayPendingTransaction = async () => {
    if (!pendingTransaction) {
      setBillingError(dictionary.dashboard.billingPendingMissingTransaction);
      return;
    }

    setBillingError(null);
    setBillingFeedback(null);
    setIsPayingTransaction(true);

    try {
      await billingApi.payMockTransaction(pendingTransaction.id);
      syncPendingTransaction(null);
      await loadBillingData();
      setBillingFeedback({
        tone: "success",
        message: dictionary.dashboard.billingPaymentSuccess,
      });
      setUpgradeDialogOpen(false);
    } catch (error) {
      setBillingError(
        translateBillingError(error, dictionary.dashboard.billingActionError),
      );
    } finally {
      setIsPayingTransaction(false);
    }
  };

  const handleFailPendingTransaction = async () => {
    if (!pendingTransaction) {
      setBillingError(dictionary.dashboard.billingPendingMissingTransaction);
      return;
    }

    setBillingError(null);
    setBillingFeedback(null);
    setIsFailingTransaction(true);

    try {
      await billingApi.failMockTransaction(pendingTransaction.id, {
        failureReason: "Mock payment failed from dashboard",
      });
      syncPendingTransaction(null);
      await loadBillingData();
      setBillingFeedback({
        tone: "warning",
        message: dictionary.dashboard.billingPaymentFailed,
      });
    } catch (error) {
      setBillingError(
        translateBillingError(error, dictionary.dashboard.billingActionError),
      );
    } finally {
      setIsFailingTransaction(false);
    }
  };

  const handleCancelSubscription = async () => {
    setBillingError(null);
    setBillingFeedback(null);
    setIsCancellingSubscription(true);

    try {
      await billingApi.cancelSubscription();
      await loadBillingData();
      setBillingFeedback({
        tone: "success",
        message: dictionary.dashboard.billingCancelSuccess,
      });
      setUpgradeDialogOpen(false);
    } catch (error) {
      setBillingError(
        translateBillingError(error, dictionary.dashboard.billingActionError),
      );
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  const currentPlanName =
    workspaceSubscription?.plan.name ??
    dictionary.classDetailPage.notAvailableLabel;
  const maxClassesLabel = Number.isFinite(currentMaxClasses)
    ? String(currentMaxClasses)
    : dictionary.billingPage.unlimitedSymbol;
  const classLimitUpgradeValue =
    classLimitUpgradeTarget ??
    (Number.isFinite(currentMaxClasses) ? currentMaxClasses : 3);
  const sharedUpgradeTitle =
    planUpgradeMode === "manage"
      ? dictionary.billingPage.upgradeDialogTitle
      : dictionary.dashboard.upgradeDialogTitle;
  const sharedUpgradeDescription =
    planUpgradeMode === "manage"
      ? dictionary.billingPage.upgradeDialogDescription
      : dictionary.dashboard.upgradeDialogDescription.replace(
          "{maxClasses}",
          String(classLimitUpgradeValue),
        );
  const sharedUpgradeCancelLabel =
    planUpgradeMode === "manage"
      ? dictionary.billingPage.cancel
      : dictionary.dashboard.createDialogCancel;
  const sharedUpgradeProPlan =
    planUpgradeMode === "manage"
      ? {
          name: dictionary.billingPage.proPlanName,
          price: dictionary.billingPage.proPlanPrice,
          period: dictionary.billingPage.periodPerMonth,
          features: dictionary.billingPage.proFeatures,
          ctaLabel: dictionary.billingPage.upgradeToPro,
          badgeLabel: dictionary.billingPage.proPopularBadge,
        }
      : {
          name: dictionary.dashboard.proPlanTitle,
          price: dictionary.dashboard.planPrice,
          period: dictionary.dashboard.planPeriod,
          features: [
            dictionary.dashboard.upgradeBenefit1,
            dictionary.dashboard.upgradeBenefit2,
            dictionary.dashboard.upgradeBenefit3,
          ],
          ctaLabel: dictionary.dashboard.upgradeProCta,
          badgeLabel: dictionary.landing.pricing.mostPopular,
        };
  const sharedUpgradeEnterprisePlan =
    planUpgradeMode === "manage"
      ? {
          name: dictionary.billingPage.enterprisePlanName,
          price: dictionary.billingPage.enterprisePlanPrice,
          period: dictionary.billingPage.periodPerMonth,
          features: dictionary.billingPage.enterpriseFeatures,
          ctaLabel: dictionary.billingPage.upgradeToEnterprise,
        }
      : {
          name: dictionary.dashboard.enterprisePlanTitle,
          price: dictionary.dashboard.enterprisePlanPrice,
          period: dictionary.dashboard.planPeriod,
          features: [
            dictionary.dashboard.enterpriseBenefit1,
            dictionary.dashboard.enterpriseBenefit2,
            dictionary.dashboard.enterpriseBenefit3,
          ],
          ctaLabel: dictionary.dashboard.upgradeEnterpriseCta,
        };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        dictionary={dictionary.dashboard}
        planName={currentPlanName}
        classesCount={classes.length}
        maxClassesLabel={maxClassesLabel}
        onManagePlan={handleOpenBillingDialog}
        onCreateClass={handleCreateClass}
      />

      {billingFeedback ? (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${mapFeedbackClassName(
            billingFeedback.tone,
          )}`}
        >
          {billingFeedback.message}
        </div>
      ) : null}

      <DashboardStatsGrid stats={stats} />

      <div className="grid gap-6 md:grid-cols-2">
        <DashboardRecentClassesCard
          classes={recentClasses}
          isLoading={isClassesLoading}
          dashboardDictionary={dictionary.dashboard}
          classesDictionary={dictionary.classesPage}
          studentsLabel={dictionary.myCourse.overview.statsStudents}
        />

        <DashboardTopStudentsCard
          students={highlightedStudents}
          isLoading={isStudentsLoading}
          dashboardDictionary={dictionary.dashboard}
          studentsDictionary={dictionary.studentsPage}
        />
      </div>

      <CreateClassDialog
        open={createClassDialogOpen}
        onOpenChange={setCreateClassDialogOpen}
        onPlanLimitReached={(limit) => {
          setCreateClassDialogOpen(false);
          openPlanUpgradeDialog("limit", limit);
        }}
        onCreate={handleAddClass}
      />

      <PlanUpgradeDialog
        open={classLimitUpgradeDialogOpen}
        onOpenChange={handlePlanUpgradeDialogOpenChange}
        onUpgrade={handleClassLimitUpgrade}
        currentTier={currentUpgradeTier}
        title={sharedUpgradeTitle}
        description={sharedUpgradeDescription}
        cancelLabel={sharedUpgradeCancelLabel}
        proPlan={sharedUpgradeProPlan}
        enterprisePlan={sharedUpgradeEnterprisePlan}
      />

      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={handleBillingDialogOpenChange}
        availablePlans={availablePlans}
        workspaceSubscription={workspaceSubscription}
        billingSubscription={billingSubscription}
        pendingTransaction={pendingTransaction}
        isLoading={isBillingLoading}
        isStarting={isStartingSubscription}
        isPaying={isPayingTransaction}
        isFailing={isFailingTransaction}
        isCancelling={isCancellingSubscription}
        errorMessage={billingError}
        onStartSubscription={handleStartSubscription}
        onPayPendingTransaction={handlePayPendingTransaction}
        onFailPendingTransaction={handleFailPendingTransaction}
        onCancelSubscription={handleCancelSubscription}
      />
    </div>
  );
}
