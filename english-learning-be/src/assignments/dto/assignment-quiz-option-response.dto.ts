import { AssignmentQuizOptionEntity } from '../entities/assignment-quiz-option.entity';

export class AssignmentQuizOptionResponseDto {
  id: string;
  content: string;
  sortOrder: number;

  static fromEntity(
    option: AssignmentQuizOptionEntity,
  ): AssignmentQuizOptionResponseDto {
    const dto = new AssignmentQuizOptionResponseDto();
    dto.id = option.id;
    dto.content = option.content;
    dto.sortOrder = option.sortOrder;
    return dto;
  }
}
