import { ApiProperty } from '@nestjs/swagger';
import { AssignmentQuizAttemptAnswerEntity } from '../entities/assignment-quiz-attempt-answer.entity';

export class AssignmentQuizAttemptAnswerResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440810' })
  questionId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440820' })
  selectedOptionId: string;

  @ApiProperty({ example: true })
  isCorrect: boolean;

  @ApiProperty({ example: 1 })
  awardedPoints: number;

  static fromEntity(
    answer: AssignmentQuizAttemptAnswerEntity,
  ): AssignmentQuizAttemptAnswerResponseDto {
    const dto = new AssignmentQuizAttemptAnswerResponseDto();
    dto.questionId = answer.question.id;
    dto.selectedOptionId = answer.selectedOption.id;
    dto.isCorrect = answer.isCorrect;
    dto.awardedPoints = answer.awardedPoints;
    return dto;
  }
}
