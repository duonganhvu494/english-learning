"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/utils/cn";

type SelectContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string;
  setValue: (value: string) => void;
  placeholder?: string;
};

const SelectContext = React.createContext<SelectContextType | null>(null);

function useSelectContext() {
  const context = React.useContext(SelectContext);

  if (!context) {
    throw new Error("Select components must be used within <Select>");
  }

  return context;
}

type SelectProps = {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
};

function Select({
  children,
  value,
  defaultValue = "",
  onValueChange,
  placeholder,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue);

  const isControlled = value !== undefined;
  const selectedValue = isControlled ? value : internalValue;

  const setValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        open,
        setOpen,
        value: selectedValue,
        setValue,
        placeholder,
      }}
    >
      <div data-slot="select" className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

function SelectGroup({ children, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="select-group" {...props}>
      {children}
    </div>
  );
}

function SelectValue({
  className,
  placeholder,
  ...props
}: React.ComponentProps<"span"> & {
  placeholder?: string;
}) {
  const { value } = useSelectContext();

  return (
    <span
      data-slot="select-value"
      className={cn(!value && "text-muted-foreground", className)}
      {...props}
    >
      {value || placeholder || "Select an option"}
    </span>
  );
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<"button"> & {
  size?: "sm" | "default";
}) {
  const { open, setOpen } = useSelectContext();

  return (
    <button
      type="button"
      data-slot="select-trigger"
      data-size={size}
      onClick={() => setOpen((prev) => !prev)}
      className={cn(
        "border-input text-left focus-visible:border-ring focus-visible:ring-ring/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
        className,
      )}
      aria-expanded={open}
      {...props}
    >
      {children}
      <ChevronDownIcon className="size-4 opacity-50" />
    </button>
  );
}

function SelectContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, setOpen } = useSelectContext();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        contentRef.current &&
        !contentRef.current.parentElement?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={contentRef}
      data-slot="select-content"
      className={cn(
        "bg-popover text-popover-foreground absolute top-full z-50 mt-1 max-h-60 w-full overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
        className,
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
}

function SelectLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}

function SelectItem({
  className,
  children,
  value,
  ...props
}: React.ComponentProps<"button"> & {
  value: string;
}) {
  const { value: selectedValue, setValue } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      data-slot="select-item"
      onClick={() => setValue(value)}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-none select-none hover:bg-accent",
        className,
      )}
      {...props}
    >
      <span className="flex-1 text-left">{children}</span>

      {isSelected && (
        <span className="absolute right-2 flex size-3.5 items-center justify-center">
          <CheckIcon className="size-4" />
        </span>
      )}
    </button>
  );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}

function SelectScrollUpButton() {
  return null;
}

function SelectScrollDownButton() {
  return null;
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
