"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type SwitchProps = Omit<React.ComponentProps<"button">, "onChange"> & {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  className,
  disabled,
  ...props
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? checked : internalChecked;

  const toggle = () => {
    if (disabled) {
      return;
    }

    const nextChecked = !currentChecked;
    if (!isControlled) {
      setInternalChecked(nextChecked);
    }
    onCheckedChange?.(nextChecked);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={currentChecked}
      data-state={currentChecked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--color-bg) disabled:cursor-not-allowed disabled:opacity-50",
        currentChecked
          ? "bg-(--color-primary)"
          : "bg-[color-mix(in_srgb,var(--color-border)_65%,var(--color-surface)_35%)]",
        className,
      )}
      {...props}
    >
      <span
        data-state={currentChecked ? "checked" : "unchecked"}
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-(--color-surface) shadow-sm ring-0 transition-transform",
          currentChecked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export { Switch };
