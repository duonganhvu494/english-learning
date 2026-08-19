import type { MaterialSummary } from "./assignments";

export type AssignmentQuizQuestionType = "single_choice" | "SINGLE_CHOICE";

export type AssignmentQuizAttemptStatus =
  | "in_progress"
  | "submitted"
  | "IN_PROGRESS"
  | "SUBMITTED";

export interface CreateAssignmentQuizQuestionDto {
  content: string;
  points?: number;
  sortOrder?: number;
  materialId?: string | null;
}

export interface UpdateAssignmentQuizQuestionDto {
  content?: string;
  points?: number;
  sortOrder?: number;
  materialId?: string | null;
}

export interface CreateAssignmentQuizOptionDto {
  content: string;
  isCorrect?: boolean;
  sortOrder?: number;
}

export interface UpdateAssignmentQuizOptionDto {
  content?: string;
  isCorrect?: boolean;
  sortOrder?: number;
}

export interface AssignmentQuizOptionResponse {
  id: string;
  content: string;
  isCorrect: boolean;
  sortOrder: number;
}

export interface AssignmentQuizQuestionResponse {
  id: string;
  assignmentId?: string;
  content: string;
  type: AssignmentQuizQuestionType;
  points: number;
  sortOrder: number;
  material: MaterialSummary | null;
  options: AssignmentQuizOptionResponse[];
}

export interface AssignmentQuizManagementResponse {
  id?: string;
  assignmentId?: string;
  title?: string;
  questions?: AssignmentQuizQuestionResponse[];
  quizQuestions?: AssignmentQuizQuestionResponse[];
}

export interface AssignmentQuizResponse {
  id?: string;
  assignmentId?: string;
  title?: string;
  questions?: AssignmentQuizQuestionResponse[];
  quizQuestions?: AssignmentQuizQuestionResponse[];
}

export interface AssignmentQuizAttemptAnswerResponse {
  questionId?: string;
  selectedOptionId?: string;
  isCorrect: boolean;
  awardedPoints: number;
  question?: AssignmentQuizQuestionResponse | null;
  selectedOption?: AssignmentQuizOptionResponse | null;
}

export interface AssignmentQuizAttemptResponse {
  assignmentId: string;
  studentId: string;

  studentName?: string | null;
  studentEmail?: string | null;

  status: AssignmentQuizAttemptStatus | null;
  startedAt: string | null;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  correctCount: number;
  totalQuestions: number;
  answers?: AssignmentQuizAttemptAnswerResponse[];
}

export interface SubmitAssignmentQuizAttemptDto {
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
  }>;
}

export interface AssignmentQuizQuestionDeleteResponse {
  questionId: string;
}

export interface AssignmentQuizOptionDeleteResponse {
  optionId: string;
}

export function getQuizQuestions(
  quiz:
    | AssignmentQuizManagementResponse
    | AssignmentQuizResponse
    | null
    | undefined,
): AssignmentQuizQuestionResponse[] {
  if (!quiz) {
    return [];
  }

  return quiz.questions ?? quiz.quizQuestions ?? [];
}
