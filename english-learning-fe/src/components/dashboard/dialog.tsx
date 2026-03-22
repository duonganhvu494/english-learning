"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { XIcon } from "lucide-react";

import { cn } from "@/utils/cn";

type DialogContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DialogContext = React.createContext<DialogContextType | null>(null);

function useDialogContext() {
  const context = React.useContext(DialogContext);

  if (!context) {
    throw new Error("Dialog components must be used within <Dialog>");
  }

  return context;
}

type DialogProps = {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function Dialog({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (value: React.SetStateAction<boolean>) => {
      const nextOpen = typeof value === "function" ? value(open) : value;

      if (!isControlled) {
        setInternalOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange, open],
  );

  return (
    <DialogContext.Provider value={{ open, setOpen }}>
      <div data-slot="dialog">{children}</div>
    </DialogContext.Provider>
  );
}

type DialogTriggerProps = React.ComponentProps<"button"> & {
  asChild?: boolean;
};

function DialogTrigger({
  className,
  onClick,
  children,
  asChild = false,
  ...props
}: DialogTriggerProps) {
  const { setOpen } = useDialogContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      setOpen(true);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(
      children as React.ReactElement,
      {
        "data-slot": "dialog-trigger",
        onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
          (
            children as React.ReactElement<{
              onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
            }>
          ).props.onClick?.(e);
          if (!e.defaultPrevented) {
            setOpen(true);
          }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    );
  }

  return (
    <button
      type="button"
      data-slot="dialog-trigger"
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

type DialogPortalProps = {
  children: React.ReactNode;
};

function DialogPortal({ children }: DialogPortalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div data-slot="dialog-portal">{children}</div>,
    document.body,
  );
}

function DialogClose({
  className,
  onClick,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { setOpen } = useDialogContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      setOpen(false);
    }
  };

  return (
    <button
      type="button"
      data-slot="dialog-close"
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

function DialogOverlay({ className, ...props }: React.ComponentProps<"div">) {
  const { open, setOpen } = useDialogContext();

  if (!open) return null;

  return (
    <div
      data-slot="dialog-overlay"
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      onClick={() => setOpen(false)}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, setOpen } = useDialogContext();

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <DialogPortal>
      <DialogOverlay />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setOpen(false)}
      >
        <div
          data-slot="dialog-content"
          role="dialog"
          aria-modal="true"
          className={cn(
            "bg-background z-50 grid w-full max-w-lg gap-4 rounded-lg border p-6 shadow-lg",
            className,
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
