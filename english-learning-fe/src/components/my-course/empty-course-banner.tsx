"use client";

import { useAppSettings } from "@/providers/app-settings-provider";

export function EmptyCourseBanner() {
  const { dictionary } = useAppSettings();

  return (
    <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,var(--color-primary),var(--color-secondary))] px-5 py-6 text-(--color-text-inverse) sm:px-8 lg:px-10">
      <div className="grid items-center gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <h1 className="text-3xl font-bold sm:text-[28px] lg:text-[32px]">
            {dictionary.myCourse.emptyBanner.title}
          </h1>
          <p className="mt-2 text-lg text-[color-mix(in_srgb,var(--color-text-inverse)_88%,transparent)]">
            {dictionary.myCourse.emptyBanner.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <button className="rounded-2xl border border-[color-mix(in_srgb,var(--color-text-inverse)_80%,transparent)] px-5 py-3 text-base font-semibold text-(--color-text-inverse) transition hover:bg-[color-mix(in_srgb,var(--color-text-inverse)_10%,transparent)]">
              🛒 {dictionary.myCourse.emptyBanner.storeButton}
            </button>
            <button className="rounded-2xl bg-(--color-surface) px-5 py-3 text-base font-semibold text-(--color-text) transition hover:bg-(--color-surface-2)">
              💬 {dictionary.myCourse.emptyBanner.consultButton}
            </button>
          </div>
        </div>

        <div className="hidden h-37.5 rounded-2xl bg-[color-mix(in_srgb,var(--color-text-inverse)_12%,transparent)] lg:block" />
      </div>
    </section>
  );
}
