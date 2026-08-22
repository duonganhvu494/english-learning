import { AssignmentQuizAttemptAnswerEntity } from "../entities/assignment-quiz-attempt-answer.entity";

export class AssignmentQuizAttemptAnswerResponseDto {
  questionId: string;

  selectedOptionId: string;

  isCorrect: boolean;

  awardedPoints: number;

  question: {
    id: string;
    content: string;
  };

  selectedOption: {
    id: string;
    content: string;
  };

  static fromEntity(
    answer: AssignmentQuizAttemptAnswerEntity,
  ): AssignmentQuizAttemptAnswerResponseDto {
    const dto = new AssignmentQuizAttemptAnswerResponseDto();

    dto.questionId = answer.question.id;

    dto.selectedOptionId = answer.selectedOption.id;

    dto.isCorrect = answer.isCorrect;

    dto.awardedPoints = answer.awardedPoints;

    dto.question = {
      id: answer.question.id,
      content: answer.question.content,
    };

    dto.selectedOption = {
      id: answer.selectedOption.id,
      content: answer.selectedOption.content,
    };

    return dto;
  }
}
