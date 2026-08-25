export interface StudentDetailResponseDto {
  student: {
    studentId: string;
    fullName: string;
    userName: string;
    email: string;
    role: string;
    status: string;
  };

  classes: {
    id: string;
    className: string;
    description: string | null;
  }[];

  summary: {
    classCount: number;
    completedAssignmentCount: number;
    manualAverageScore: number | null;
    quizAveragePercentage: number | null;
  };

  results: StudentLearningResult[];
}

export interface StudentLearningResult {
  assignmentId: string;
  classId: string;
  className: string;
  title: string;
  type: "manual" | "quiz";

  score: number | null;
  maxScore: number | null;

  status:
    "not_submitted" | "in_progress" | "submitted" | "graded" | "completed";

  completedAt: string | null;
}
