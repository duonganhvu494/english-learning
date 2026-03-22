import { ApiProperty } from '@nestjs/swagger';
import {
  AssignmentQuizAttemptEntity,
  AssignmentQuizAttemptStatus,
} from '../entities/assignment-quiz-attempt.entity';
import { AssignmentQuizAttemptAnswerResponseDto } from './assignment-quiz-attempt-answer-response.dto';

export class AssignmentQuizAttemptResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440800' })
  assignmentId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  studentId: string;

  @ApiProperty({ example: AssignmentQuizAttemptStatus.SUBMITTED })
  status: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440830',
    nullable: true,
  })
  attemptId: string | null;

  @ApiProperty({ example: '2026-03-25T08:10:00.000Z', nullable: true })
  startedAt: Date | null;

  @ApiProperty({ example: '2026-03-25T08:15:00.000Z', nullable: true })
  submittedAt: Date | null;

  @ApiProperty({ example: 8.5, nullable: true })
  score: number | null;

  @ApiProperty({ example: 10 })
  maxScore: number;

  @ApiProperty({ example: 8 })
  correctCount: number;

  @ApiProperty({ example: 10 })
  totalQuestions: number;

  @ApiProperty({ type: [AssignmentQuizAttemptAnswerResponseDto] })
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
