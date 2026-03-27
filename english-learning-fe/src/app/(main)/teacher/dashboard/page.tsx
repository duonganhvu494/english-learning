"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { classesApi, workspacesApi } from "@/api";
import { useSubscription } from "@/context/subscriptionContext";
import { useData } from "@/mock-data/dataContext";
import type { Dictionary } from "@/i18n/types";
import { useAppSettings } from "@/providers/app-settings-provider";
import { useAuth } from "@/providers/auth-provider";
import type { Class as DashboardClass } from "@/types/types";
import type { WorkspaceStudentListItem } from "@/types/workspace";
import { FileText, GraduationCap, TrendingUp, Users } from "lucide-react";
import { CreateClassDialog } from "@/components/common/create-class-dialog";
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

function mapClassColor(index: number) {
  return CLASS_COLORS[index % CLASS_COLORS.length];
}

function mapTierName(
  tier: "free" | "pro" | "enterprise",
  dictionary: Dictionary,
) {
  if (tier === "free") {
    return dictionary.landing.pricing.plans.free.name;
  }

  if (tier === "pro") {
    return dictionary.landing.pricing.plans.pro.name;
  }

  return dictionary.landing.pricing.plans.enterprise.name;
}

export default function DashboardPage() {
  const { dictionary } = useAppSettings();
  const { activeWorkspaceId } = useAuth();
  const { projects } = useData();
  const { tier, maxClasses, upgradeTier } = useSubscription();
  const [classes, setClasses] = useState<DashboardClass[]>([]);
  const [students, setStudents] = useState<WorkspaceStudentListItem[]>([]);
  const [isClassesLoading, setIsClassesLoading] = useState(true);
  const [isStudentsLoading, setIsStudentsLoading] = useState(true);
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

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

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

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

  const handleCreateClass = () => {
    if (!activeWorkspaceId) {
      return;
    }

    if (classes.length >= maxClasses) {
      setUpgradeDialogOpen(true);
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

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        dictionary={dictionary.dashboard}
        planName={mapTierName(tier, dictionary)}
        classesCount={classes.length}
        maxClassesLabel={
          maxClasses === Infinity ? "No limit" : String(maxClasses)
        }
        onCreateClass={handleCreateClass}
      />

      <DashboardStatsGrid stats={stats} />

      <div className="grid gap-6 md:grid-cols-2">
        <DashboardRecentClassesCard
          classes={recentClasses}
          isLoading={isClassesLoading}
          dashboardDictionary={dictionary.dashboard}
          studentsLabel={dictionary.myCourse.overview.statsStudents}
        />

        <DashboardTopStudentsCard
          students={highlightedStudents}
          isLoading={isStudentsLoading}
          dashboardDictionary={dictionary.dashboard}
          studentsDictionary={dictionary.studentsPage}
        />
      </div>

      {/* <DashboardUpcomingProjectsCard
        projects={projects}
        classes={classes}
        locale={locale}
        dashboardDictionary={dictionary.dashboard}
      /> */}

      <CreateClassDialog
        open={createClassDialogOpen}
        onOpenChange={setCreateClassDialogOpen}
        onCreate={handleAddClass}
      />

      <UpgradePlanDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        onUpgrade={upgradeTier}
        maxClasses={maxClasses === Infinity ? 999 : maxClasses}
      />
    </div>
  );
}
