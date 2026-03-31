import { Plus } from "lucide-react";
import type { Dictionary } from "@/i18n/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DashboardPageHeaderProps = {
  dictionary: Dictionary["dashboard"];
  planName: string;
  classesCount: number;
  maxClassesLabel: string;
  onCreateClass: () => void;
  onManagePlan: () => void;
};

export function DashboardPageHeader({
  dictionary,
  planName,
  classesCount,
  maxClassesLabel,
  onCreateClass,
  onManagePlan,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-app-text">
          {dictionary.title}
        </h1>
        <p className="text-app-text-muted">{dictionary.greeting}</p>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <div className="text-right text-sm">
          <Badge variant="secondary" className="mb-1">
            {planName}
          </Badge>
          <p className="text-app-text-muted">
            {classesCount} / {maxClassesLabel} {dictionary.planLabel}
          </p>
        </div>

        <Button variant="outline" onClick={onManagePlan}>
          {dictionary.managePlan}
        </Button>

        <Button onClick={onCreateClass}>
          <Plus className="mr-2 h-4 w-4" />
          {dictionary.createClass}
        </Button>
      </div>
    </div>
  );
}
