"use client";

import { useAppSettings } from "@/providers/app-settings-provider";
import { useAuth } from "@/providers/auth-provider";

export function UserPanel() {
  const { dictionary } = useAppSettings();
  const { user } = useAuth();
  const displayName =
    user?.fullName || user?.userName || dictionary.myCourse.sidebar.userName;

  return (
    <div className="border-b border-(--color-border) px-4 py-4">
      <div className="text-[18px] font-bold text-(--color-text)">
        {displayName}
      </div>
    </div>
  );
}
