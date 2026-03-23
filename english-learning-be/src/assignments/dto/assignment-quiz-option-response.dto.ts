import { ApiProperty } from '@nestjs/swagger';
import { AssignmentQuizOptionEntity } from '../entities/assignment-quiz-option.entity';

export class AssignmentQuizOptionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440820' })
  id: string;

  @ApiProperty({ example: 'He goes to school every day.' })
  content: string;

  @ApiProperty({ example: 0 })
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
