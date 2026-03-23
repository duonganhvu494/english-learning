import * as React from "react";
import { cn } from "@/utils/cn";

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  let variantClass = "";

  switch (variant) {
    case "secondary":
      variantClass =
        "border-transparent bg-secondary text-secondary-foreground";
      break;
    case "destructive":
      variantClass =
        "border-transparent bg-destructive text-white dark:bg-destructive/60";
      break;
    case "outline":
      variantClass =
        "text-foreground hover:bg-accent hover:text-accent-foreground";
      break;
    default:
      variantClass = "border-transparent bg-primary text-primary-foreground";
      break;
  }

  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden transition-[color,box-shadow]",
        variantClass,
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
