"use client";

import * as React from "react";
import { cn } from "@/utils/cn";

type TabsContextValue = {
  value: string;
  setValue: (nextValue: string) => void;
  idPrefix: string;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used within <Tabs>.");
  }

  return context;
}

type TabsProps = React.ComponentProps<"div"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

function Tabs({
  className,
  value,
  defaultValue = "",
  onValueChange,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const idPrefix = React.useId();

  const selectedValue = value !== undefined ? value : internalValue;
  const setValue = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [onValueChange, value],
  );

  return (
    <TabsContext.Provider value={{ value: selectedValue, setValue, idPrefix }}>
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      />
    </TabsContext.Provider>
  );
}

function TabsList({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="tablist"
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex",
        className,
      )}
      {...props}
    />
  );
}

type TabsTriggerProps = React.ComponentProps<"button"> & {
  value: string;
};

function TabsTrigger({ className, value, ...props }: TabsTriggerProps) {
  const { value: selectedValue, setValue, idPrefix } = useTabsContext();
  const isActive = selectedValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      aria-controls={`${idPrefix}-content-${value}`}
      id={`${idPrefix}-trigger-${value}`}
      data-slot="tabs-trigger"
      data-state={isActive ? "active" : "inactive"}
      onClick={() => setValue(value)}
      className={cn(
        "data-[state=active]:bg-card dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

type TabsContentProps = React.ComponentProps<"div"> & {
  value: string;
  forceMount?: boolean;
};

function TabsContent({
  className,
  value,
  forceMount = false,
  ...props
}: TabsContentProps) {
  const { value: selectedValue, idPrefix } = useTabsContext();
  const isActive = selectedValue === value;

  if (!isActive && !forceMount) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      aria-labelledby={`${idPrefix}-trigger-${value}`}
      id={`${idPrefix}-content-${value}`}
      data-slot="tabs-content"
      data-state={isActive ? "active" : "inactive"}
      hidden={!isActive}
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
