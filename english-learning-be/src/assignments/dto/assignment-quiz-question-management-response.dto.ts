import { MaterialSummaryDto } from 'src/materials/dto/material-summary.dto';
import { AssignmentQuizQuestionEntity } from '../entities/assignment-quiz-question.entity';
import { AssignmentQuizOptionManagementResponseDto } from './assignment-quiz-option-management-response.dto';

export class AssignmentQuizQuestionManagementResponseDto {
  id: string;
  content: string;
  type: string;
  points: number;
  sortOrder: number;
  material: MaterialSummaryDto | null;
  options: AssignmentQuizOptionManagementResponseDto[];

  static fromEntity(
    question: AssignmentQuizQuestionEntity,
    assignmentId: string,
  ): AssignmentQuizQuestionManagementResponseDto {
    const dto = new AssignmentQuizQuestionManagementResponseDto();
    dto.id = question.id;
    dto.content = question.content;
    dto.type = question.type;
    dto.points = question.points;
    dto.sortOrder = question.sortOrder;
    dto.material = question.material
      ? MaterialSummaryDto.fromEntity(
          question.material,
          `/assignments/${assignmentId}/quiz/questions/${question.id}/materials/${question.material.id}/download`,
        )
      : null;
    dto.options = [...(question.options ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((option) =>
        AssignmentQuizOptionManagementResponseDto.fromEntity(option),
      );
    return dto;
  }
}
