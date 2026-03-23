import { ApiProperty } from '@nestjs/swagger';

export class RemoveWorkspaceStudentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  workspaceId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  studentId: string;

  @ApiProperty({ example: 2 })
  removedClassCount: number;

  static fromData(input: {
    workspaceId: string;
    studentId: string;
    removedClassCount: number;
  }): RemoveWorkspaceStudentResponseDto {
    const dto = new RemoveWorkspaceStudentResponseDto();
    dto.workspaceId = input.workspaceId;
    dto.studentId = input.studentId;
    dto.removedClassCount = input.removedClassCount;
    return dto;
  }
}
