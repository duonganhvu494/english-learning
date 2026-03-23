import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type ButtonVariant = "primary" | "secondary" | "outline";
type ButtonSize = "sm" | "default" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClass = {
  primary:
    "border border-(--color-primary) bg-(--color-primary) text-(--color-text-inverse) hover:bg-(--color-primary-hover)",
  secondary:
    "border border-(--color-border) bg-(--color-surface) text-(--color-text) hover:bg-(--color-surface-2)",
  outline:
    "border border-(--color-border) bg-(--color-bg) text-(--color-text) hover:bg-(--color-surface)",
};

const sizeClass = {
  sm: "h-9 px-3 text-xs",
  default: "h-12 px-4 text-sm",
  lg: "h-14 px-6 text-base",
};

export function Button({
  variant = "primary",
  size = "default",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex w-full items-center justify-center rounded-xl font-bold uppercase tracking-[0.08em] transition hover:cursor-pointer",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    />
  );
}
