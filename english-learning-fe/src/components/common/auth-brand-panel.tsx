"use client";

import { useAppSettings } from "@/providers/app-settings-provider";

export function AuthBrandPanel({
  useSignUp,
}: Readonly<{
  useSignUp?: boolean;
}> = {}) {
  const { dictionary } = useAppSettings();
  const brand = useSignUp ? dictionary.signUp : dictionary.login;

  return (
    <section className="hidden lg:flex lg:min-h-130 lg:items-center">
      <div className="max-w-2xl">
        <div className="inline-flex rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-sm font-medium text-(--color-text-muted) shadow-sm">
          {brand.brandBadge}
        </div>

        <h1 className="mt-6 text-5xl font-extrabold leading-[1.08] tracking-[-0.03em] text-(--color-text) xl:text-6xl">
          {brand.welcomeTitle}
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-8 text-(--color-text-muted)">
          {brand.welcomeDescription}
        </p>
      </div>
    </section>
  );
}
