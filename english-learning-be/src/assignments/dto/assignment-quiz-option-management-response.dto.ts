import { AssignmentQuizOptionEntity } from '../entities/assignment-quiz-option.entity';

export class AssignmentQuizOptionManagementResponseDto {
  id: string;
  content: string;
  isCorrect: boolean;
  sortOrder: number;

  static fromEntity(
    option: AssignmentQuizOptionEntity,
  ): AssignmentQuizOptionManagementResponseDto {
    const dto = new AssignmentQuizOptionManagementResponseDto();
    dto.id = option.id;
    dto.content = option.content;
    dto.isCorrect = option.isCorrect;
    dto.sortOrder = option.sortOrder;
    return dto;
  }
}
