"use client";

import {
  Award,
  BookOpen,
  Calendar,
  TrendingUp,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ProfileStatsDictionary = {
  teachingStatisticsTitle: string;
  teachingStatisticsDescription: string;
  learningProgressTitle: string;
  learningProgressDescription: string;
  statTotalClasses: string;
  statTotalStudents: string;
  statAssignments: string;
  statEvents: string;
  statEnrolledClasses: string;
  statCompleted: string;
  statAverageScore: string;
  statStreak: string;
};

type ProfileStatsCardProps = {
  dictionary: ProfileStatsDictionary;
  isTeacher: boolean;
  values: {
    totalClasses: number;
    totalStudents: number;
    totalAssignments: number;
    totalEvents: number;
    enrolledClasses: number;
    completedItems: number;
    averageScorePercent: number;
    streakLabel: string;
  };
};

type StatTone = "primary" | "info" | "success" | "warning";

type StatItem = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  tone: StatTone;
};

const TONE_STYLES: Record<StatTone, { container: string; icon: string }> = {
  primary: {
    container: "bg-[color-mix(in_srgb,var(--color-primary)_18%,var(--color-surface)_82%)]",
    icon: "text-(--color-primary)",
  },
  info: {
    container: "bg-[color-mix(in_srgb,var(--color-info)_18%,var(--color-surface)_82%)]",
    icon: "text-(--color-info)",
  },
  success: {
    container: "bg-[color-mix(in_srgb,var(--color-success)_18%,var(--color-surface)_82%)]",
    icon: "text-(--color-success)",
  },
  warning: {
    container: "bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-surface)_82%)]",
    icon: "text-(--color-warning)",
  },
};

export function ProfileStatsCard({
  dictionary,
  isTeacher,
  values,
}: ProfileStatsCardProps) {
  const items: StatItem[] = isTeacher
    ? [
        {
          key: "total-classes",
          label: dictionary.statTotalClasses,
          value: String(values.totalClasses),
          icon: BookOpen,
          tone: "primary",
        },
        {
          key: "total-students",
          label: dictionary.statTotalStudents,
          value: String(values.totalStudents),
          icon: UserIcon,
          tone: "info",
        },
        {
          key: "total-assignments",
          label: dictionary.statAssignments,
          value: String(values.totalAssignments),
          icon: Award,
          tone: "success",
        },
        {
          key: "total-events",
          label: dictionary.statEvents,
          value: String(values.totalEvents),
          icon: Calendar,
          tone: "warning",
        },
      ]
    : [
        {
          key: "enrolled-classes",
          label: dictionary.statEnrolledClasses,
          value: String(values.enrolledClasses),
          icon: BookOpen,
          tone: "primary",
        },
        {
          key: "completed",
          label: dictionary.statCompleted,
          value: String(values.completedItems),
          icon: Award,
          tone: "info",
        },
        {
          key: "average-score",
          label: dictionary.statAverageScore,
          value: `${values.averageScorePercent}%`,
          icon: TrendingUp,
          tone: "success",
        },
        {
          key: "streak",
          label: dictionary.statStreak,
          value: values.streakLabel,
          icon: Calendar,
          tone: "warning",
        },
      ];

  return (
    <Card className="border-app-border bg-app-surface">
      <CardHeader>
        <CardTitle>
          {isTeacher
            ? dictionary.teachingStatisticsTitle
            : dictionary.learningProgressTitle}
        </CardTitle>
        <CardDescription>
          {isTeacher
            ? dictionary.teachingStatisticsDescription
            : dictionary.learningProgressDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const style = TONE_STYLES[item.tone];
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="rounded-lg border border-app-border p-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg p-2 ${style.container}`}>
                    <Icon className={`h-5 w-5 ${style.icon}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-app-text-muted">{item.label}</p>
                    <p className="truncate text-2xl font-semibold text-app-text">
                      {item.value}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
