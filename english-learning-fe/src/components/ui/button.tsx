import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClass = {
  primary:
    "border border-(--color-primary) bg-(--color-primary) text-(--color-text-inverse) hover:bg-(--color-primary-hover)",
  secondary:
    "border border-(--color-border) bg-(--color-surface) text-(--color-text) hover:bg-(--color-surface-2)",
  outline:
    "border border-(--color-border) bg-(--color-bg) text-(--color-text) hover:bg-(--color-surface)",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold uppercase tracking-[0.08em] transition ${variantClass[variant]} ${className}`}
      {...props}
    />
  );
}
