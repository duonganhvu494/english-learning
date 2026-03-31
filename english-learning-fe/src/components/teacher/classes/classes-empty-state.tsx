import { GraduationCap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ClassesDictionary } from "@/components/teacher/classes/types";

type ClassesEmptyStateProps = {
  dictionary: ClassesDictionary;
  onCreateFirstClass: () => void;
};

export function ClassesEmptyState({
  dictionary,
  onCreateFirstClass,
}: ClassesEmptyStateProps) {
  return (
    <Card className="border-app-border bg-app-surface px-6 py-12 text-center">
      <GraduationCap className="mx-auto mb-4 h-16 w-16 text-app-text-muted" />
      <h3 className="mb-2 text-xl font-medium text-app-text">
        {dictionary.noClassesYet}
      </h3>
      <p className="mb-6 text-app-text-muted">{dictionary.noClassesHint}</p>
      <div className="mx-auto w-full max-w-xs">
        <Button onClick={onCreateFirstClass}>
          <Plus className="mr-2 h-4 w-4" />
          {dictionary.createFirstClass}
        </Button>
      </div>
    </Card>
  );
}
