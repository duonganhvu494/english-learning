"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/utils/cn";

const AlertDialog = Dialog;
const AlertDialogTrigger = DialogTrigger;
const AlertDialogContent = DialogContent;
const AlertDialogHeader = DialogHeader;
const AlertDialogTitle = DialogTitle;
const AlertDialogDescription = DialogDescription;
const AlertDialogFooter = DialogFooter;

function AlertDialogCancel({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  return (
    <DialogClose
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-xl border border-(--color-border) bg-(--color-bg) px-4 text-sm font-bold uppercase tracking-[0.08em] text-(--color-text) transition hover:cursor-pointer hover:bg-(--color-surface)",
        className,
      )}
      {...props}
    >
      {children}
    </DialogClose>
  );
}

function AlertDialogAction({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogClose>) {
  return (
    <DialogClose
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-xl border border-(--color-error) bg-(--color-error) px-4 text-sm font-bold uppercase tracking-[0.08em] text-(--color-text-inverse) transition hover:cursor-pointer hover:bg-[color-mix(in_srgb,var(--color-error)_85%,black_15%)]",
        className,
      )}
      {...props}
    >
      {children}
    </DialogClose>
  );
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
};
