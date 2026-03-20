import {
  AssignmentQuizAttemptEntity,
  AssignmentQuizAttemptStatus,
} from '../entities/assignment-quiz-attempt.entity';
import { AssignmentQuizAttemptAnswerResponseDto } from './assignment-quiz-attempt-answer-response.dto';

export class AssignmentQuizAttemptResponseDto {
  assignmentId: string;
  studentId: string;
  status: string;
  attemptId: string | null;
  startedAt: Date | null;
  submittedAt: Date | null;
  score: number | null;
  maxScore: number;
  correctCount: number;
  totalQuestions: number;
  answers: AssignmentQuizAttemptAnswerResponseDto[];

  static empty(input: {
    assignmentId: string;
    studentId: string;
  }): AssignmentQuizAttemptResponseDto {
    const dto = new AssignmentQuizAttemptResponseDto();
    dto.assignmentId = input.assignmentId;
    dto.studentId = input.studentId;
    dto.status = 'not_started';
    dto.attemptId = null;
    dto.startedAt = null;
    dto.submittedAt = null;
    dto.score = null;
    dto.maxScore = 0;
    dto.correctCount = 0;
    dto.totalQuestions = 0;
    dto.answers = [];
    return dto;
  }

  static fromEntity(
    attempt: AssignmentQuizAttemptEntity,
  ): AssignmentQuizAttemptResponseDto {
    const dto = new AssignmentQuizAttemptResponseDto();
    dto.assignmentId = attempt.assignment.id;
    dto.studentId = attempt.student.id;
    dto.status = attempt.status;
    dto.attemptId = attempt.id;
    dto.startedAt = attempt.startedAt;
    dto.submittedAt = attempt.submittedAt;
    dto.score =
      attempt.status === AssignmentQuizAttemptStatus.SUBMITTED
        ? attempt.score
        : null;
    dto.maxScore = attempt.maxScore;
    dto.correctCount = attempt.correctCount;
    dto.totalQuestions = attempt.totalQuestions;
    dto.answers = [...(attempt.answers ?? [])].map((answer) =>
      AssignmentQuizAttemptAnswerResponseDto.fromEntity(answer),
    );
    return dto;
  }
}
