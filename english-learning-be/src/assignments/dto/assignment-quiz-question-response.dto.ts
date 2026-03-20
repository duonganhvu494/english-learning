import { MaterialSummaryDto } from 'src/materials/dto/material-summary.dto';
import { AssignmentQuizQuestionEntity } from '../entities/assignment-quiz-question.entity';
import { AssignmentQuizOptionResponseDto } from './assignment-quiz-option-response.dto';

export class AssignmentQuizQuestionResponseDto {
  id: string;
  content: string;
  type: string;
  points: number;
  sortOrder: number;
  material: MaterialSummaryDto | null;
  options: AssignmentQuizOptionResponseDto[];

  static fromEntity(
    question: AssignmentQuizQuestionEntity,
    assignmentId: string,
  ): AssignmentQuizQuestionResponseDto {
    const dto = new AssignmentQuizQuestionResponseDto();
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
      .map((option) => AssignmentQuizOptionResponseDto.fromEntity(option));
    return dto;
  }
}
