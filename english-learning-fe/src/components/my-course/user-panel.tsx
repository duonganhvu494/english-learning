"use client";

import { useAppSettings } from "@/providers/app-settings-provider";

export function UserPanel() {
  const { dictionary } = useAppSettings();

  return (
    <div className="border-b border-(--color-border) px-4 py-4">
      <div className="text-[18px] font-bold text-(--color-text)">
        {dictionary.myCourse.sidebar.userName}
      </div>
    </div>
  );
}
