import { ApiProperty } from '@nestjs/swagger';

export class DeleteRoleResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440110' })
  roleId: string;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440120', nullable: true })
  workspaceId: string | null;
  @ApiProperty({ example: null, nullable: true })
  classId: string | null;

  static fromData(input: {
    roleId: string;
    workspaceId: string | null;
    classId: string | null;
  }): DeleteRoleResponseDto {
    const dto = new DeleteRoleResponseDto();
    dto.roleId = input.roleId;
    dto.workspaceId = input.workspaceId;
    dto.classId = input.classId;
    return dto;
  }
}
