import { ApiProperty } from '@nestjs/swagger';
import { MaterialSummaryDto } from 'src/materials/dto/material-summary.dto';
import { AssignmentQuizQuestionEntity } from '../entities/assignment-quiz-question.entity';
import { AssignmentQuizQuestionType } from '../entities/assignment-quiz-question.entity';
import { AssignmentQuizOptionManagementResponseDto } from './assignment-quiz-option-management-response.dto';

export class AssignmentQuizQuestionManagementResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440810' })
  id: string;

  @ApiProperty({ example: 'Choose the correct answer' })
  content: string;

  @ApiProperty({
    enum: AssignmentQuizQuestionType,
    example: AssignmentQuizQuestionType.SINGLE_CHOICE,
  })
  type: string;

  @ApiProperty({ example: 1 })
  points: number;

  @ApiProperty({ example: 0 })
  sortOrder: number;

  @ApiProperty({ type: MaterialSummaryDto, nullable: true })
  material: MaterialSummaryDto | null;

  @ApiProperty({ type: [AssignmentQuizOptionManagementResponseDto] })
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
