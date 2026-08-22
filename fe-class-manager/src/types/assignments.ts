export type AssignmentTypeInput = "MANUAL" | "QUIZ";
export type AssignmentTypeValue = "manual" | "quiz";

export interface CreateAssignmentDto {
  title: string;
  description?: string;
  timeStart: string;
  timeEnd: string;
  type?: AssignmentTypeInput;
  materialIds?: string[];
}

export interface MaterialSummary {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  size: number;
  downloadUrl: string;
}

export interface AssignmentResponse {
  id: string;
  code: string | null;
  sessionId: string;
  classId: string;
  type: AssignmentTypeValue;
  title: string;
  description: string | null;
  timeStart: string;
  timeEnd: string;
  status: string;
  materials: MaterialSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentDeleteResponse {
  assignmentId: string;
}