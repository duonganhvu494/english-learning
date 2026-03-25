import type { LucideIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type DashboardStatItem = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description: string;
  color: string;
  bgColor: string;
};

type DashboardStatsGridProps = {
  stats: DashboardStatItem[];
};

export function DashboardStatsGrid({ stats }: DashboardStatsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="border-app-border bg-app-surface">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-app-text">
                {stat.title}
              </CardTitle>
              <div className={cn("rounded-lg p-2", stat.bgColor)}>
                <Icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-app-text">
                {stat.value}
              </div>
              <p className="mt-1 text-xs text-app-text-muted">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
