import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
};

export function Input({
  label,
  icon,
  suffix,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="space-y-2">
      {label ? (
        <label className="block text-sm font-semibold text-(--color-text)">
          {label}
        </label>
      ) : null}
      <div className="relative flex h-12 items-center gap-3 rounded-xl border border-(--color-border) bg-(--color-surface) px-3 transition-colors focus-within:border-(--color-primary) focus-within:ring-4 focus-within:ring-[color-mix(in_srgb,var(--color-primary)_14%,transparent)]">
        {icon ? (
          <span className="inline-flex h-5 w-5 items-center justify-center text-(--color-text-soft)">
            {icon}
          </span>
        ) : null}
        <input
          className={cn(
            "h-full w-full border-none bg-transparent text-sm text-(--color-text) outline-none placeholder:text-(--color-text-soft) sm:text-base",
            className,
            suffix && "pr-9",
          )}
          {...props}
        />
        {suffix ? (
          <div className="absolute right-3 h-full flex items-center">
            {suffix}
          </div>
        ) : null}
      </div>
    </div>
  );
}
