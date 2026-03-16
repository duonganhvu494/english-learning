"use client";

import { useAppSettings } from "@/providers/app-settings-provider";

export function Breadcrumb() {
  const { dictionary } = useAppSettings();

  return (
    <div className="text-[15px]">
      <span className="font-medium text-(--color-text)">
        {dictionary.myCourse.breadcrumb.home}
      </span>
      <span className="mx-2 text-(--color-text-soft)">/</span>
      <span className="font-medium text-(--color-primary)">
        {dictionary.myCourse.breadcrumb.current}
      </span>
    </div>
  );
}
