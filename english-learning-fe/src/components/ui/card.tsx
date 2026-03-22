import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

type CardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Card({
  title,
  description,
  children,
  className = "",
}: CardProps) {
  return (
    <section
      className={cn(
        "rounded-[28px] border border-(--color-border) bg-(--color-surface) p-6 shadow-lg sm:p-8",
        className,
      )}
    >
      {title ? (
        <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-(--color-text) sm:text-4xl text-center">
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-3 text-sm leading-6 text-(--color-text-muted) sm:text-base">
          {description}
        </p>
      ) : null}
      {children}
    </section>
  );
}
