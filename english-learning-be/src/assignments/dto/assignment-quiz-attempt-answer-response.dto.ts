import { AssignmentQuizAttemptAnswerEntity } from '../entities/assignment-quiz-attempt-answer.entity';

export class AssignmentQuizAttemptAnswerResponseDto {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
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
