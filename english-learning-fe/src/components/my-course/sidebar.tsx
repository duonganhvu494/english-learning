"use client";

import { sidebarSections } from "@/mock-data/my-course";
import { useAppSettings } from "@/providers/app-settings-provider";
import { cn } from "@/utils/cn";
import { UserPanel } from "./user-panel";

function ItemIcon({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "h-5 w-5 rounded-sm border",
        active
          ? "border-(--color-text-inverse)"
          : "border-(--color-border-strong)",
      )}
    />
  );
}

type SidebarProps = {
  mobile?: boolean;
  onClose?: () => void;
};

export function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const { dictionary } = useAppSettings();
  const sidebarCopy = dictionary.myCourse.sidebar;

  return (
    <aside className="h-full border-r border-(--color-border) bg-(--color-surface)">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-center justify-between rounded-2xl bg-(--color-surface)">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-(--color-primary) font-bold text-(--color-text-inverse)">
              RR
            </div>
            <div className="text-2xl font-semibold text-(--color-primary)">
              {sidebarCopy.brandName}
            </div>
          </div>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-(--color-surface-2) text-(--color-text-muted)"
            onClick={mobile ? onClose : undefined}
            aria-label={dictionary.myCourse.topbar.closeMenu}
          >
            {mobile ? "×" : "‹"}
          </button>
        </div>

        <div className="mt-6 rounded-[28px] bg-(--color-surface-2) p-0">
          <UserPanel />
        </div>

        <div className="mt-4 space-y-6 overflow-y-auto pr-1">
          {sidebarSections.map((section, idx) => (
            <div key={idx}>
              {section.titleKey ? (
                <div className="mb-2 px-1 text-[15px] font-semibold text-(--color-text)">
                  {sidebarCopy.sections[section.titleKey]}
                </div>
              ) : null}

              <div className="space-y-1">
                {section.items.map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition",
                      item.active
                        ? "bg-(--color-primary) text-(--color-text-inverse)"
                        : "text-(--color-text) hover:bg-(--color-surface-2)",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <ItemIcon active={item.active} />
                      <span className="text-[17px] font-medium">
                        {sidebarCopy.items[item.key]}
                      </span>
                    </span>

                    {item.badgeKey ? (
                      <span className="rounded-lg bg-(--color-error) px-2 py-1 text-xs font-semibold text-(--color-text-inverse)">
                        {sidebarCopy.badges[item.badgeKey]}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
