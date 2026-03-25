import type { Dictionary } from "@/i18n/types";
import type { WorkspaceStudentListItem } from "@/types/workspace";

export type StudentsDictionary = Dictionary["studentsPage"];

export type StudentFormData = {
  fullName: string;
  userName: string;
  email: string;
};

export const EMPTY_STUDENT_FORM: StudentFormData = {
  fullName: "",
  userName: "",
  email: "",
};

export type StudentItem = WorkspaceStudentListItem;
