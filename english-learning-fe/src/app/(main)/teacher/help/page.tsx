"use client";

import { useAppSettings } from "@/providers/app-settings-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherHelpPage() {
  const { dictionary } = useAppSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-app-text">
          {dictionary.helpPage.title}
        </h1>
        <p className="mt-2 text-sm text-app-text-muted">
          {dictionary.helpPage.description}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-app-surface-2">
          <CardHeader>
            <CardTitle>{dictionary.helpPage.supportTitle}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6 text-app-text-muted">
            {dictionary.helpPage.supportDescription}
          </CardContent>
        </Card>

        <Card className="bg-app-surface-2">
          <CardHeader>
            <CardTitle>{dictionary.helpPage.tipsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-3 pl-5 text-sm leading-6 text-app-text-muted">
              <li>{dictionary.helpPage.tip1}</li>
              <li>{dictionary.helpPage.tip2}</li>
              <li>{dictionary.helpPage.tip3}</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
