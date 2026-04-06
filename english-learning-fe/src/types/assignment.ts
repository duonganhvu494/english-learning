export type AssignmentType = "manual" | "quiz";

export type AssignmentStatus = "upcoming" | "open" | "closed";

export type AssignmentMaterialSummary = {
  id: string;
  title: string;
  downloadUrl: string;
  fileName: string;
  mimeType: string | null;
  size: number | null;
  category: string;
};

export type SessionAssignment = {
  id: string;
  code: string | null;
  sessionId: string;
  classId: string;
  type: AssignmentType;
  title: string;
  description: string | null;
  timeStart: string;
  timeEnd: string;
  status: AssignmentStatus;
  materials: AssignmentMaterialSummary[];
  createdAt: string;
  updatedAt: string;
};

export type CreateSessionAssignmentRequest = {
  title: string;
  description?: string;
  timeStart: string;
  timeEnd: string;
  type?: AssignmentType;
  materialIds?: string[];
};

export type DeleteAssignmentResponse = {
  assignmentId: string;
};

export type AssignmentQuizAttemptStatus =
  | "in_progress"
  | "submitted"
  | "cancelled"
  | string;

export type AssignmentQuizAttemptAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  isCorrect: boolean | null;
  awardedPoints: number | null;
};

export type AssignmentQuizAttempt = {
  assignmentId: string;
  studentId: string;
  status: AssignmentQuizAttemptStatus;
  attemptId: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  maxScore: number | null;
  correctCount: number;
  totalQuestions: number;
  answers: AssignmentQuizAttemptAnswer[];
};
