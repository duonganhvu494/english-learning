"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppSettings } from "@/providers/app-settings-provider";

export default function StudentAssignmentsPage() {
  const { dictionary } = useAppSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-semibold text-app-text">
          {dictionary.classDetailPage.assignmentsTitle}
        </h1>
        <p className="text-app-text-muted">
          {dictionary.classDetailPage.noAssignmentsYet}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{dictionary.classDetailPage.assignmentsTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-app-text-muted">
            {dictionary.classDetailPage.noAssignmentsFullHint}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}