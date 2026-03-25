import type { WorkspaceClass } from "@/types/class";
import type { Dictionary } from "@/i18n/types";

export type ClassesDictionary = Dictionary["classesPage"];

export type ClassLevel = "Beginner" | "Intermediate" | "Advanced";
export type ClassStatus = "Active" | "Draft" | "Completed";

export type ClassMetadata = {
  schedule: string;
  level: ClassLevel;
  status: ClassStatus;
  color: string;
};

export type ClassItem = WorkspaceClass & ClassMetadata;

export type ClassFormData = {
  name: string;
  description: string;
  schedule: string;
  level: ClassLevel;
  status: ClassStatus;
  color: string;
};

export const CLASS_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#14B8A6",
  "#6366F1",
] as const;

export const EMPTY_CLASS_FORM: ClassFormData = {
  name: "",
  description: "",
  schedule: "",
  level: "Beginner",
  status: "Active",
  color: CLASS_COLORS[0],
};

export function getDefaultClassMetadata(index: number): ClassMetadata {
  return {
    schedule: "",
    level: "Beginner",
    status: "Active",
    color: CLASS_COLORS[index % CLASS_COLORS.length],
  };
}

export function mapWorkspaceClassToClassItem(
  classItem: WorkspaceClass,
  index: number,
  metadata?: ClassMetadata,
): ClassItem {
  const defaults = getDefaultClassMetadata(index);
  const merged = metadata ? { ...defaults, ...metadata } : defaults;

  return {
    ...classItem,
    ...merged,
  };
}
