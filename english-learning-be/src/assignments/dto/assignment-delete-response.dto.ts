import { ApiProperty } from '@nestjs/swagger';

export class AssignmentDeleteResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440800' })
  assignmentId: string;

  static fromData(input: {
    assignmentId: string;
  }): AssignmentDeleteResponseDto {
    const dto = new AssignmentDeleteResponseDto();
    dto.assignmentId = input.assignmentId;
    return dto;
  }
}
