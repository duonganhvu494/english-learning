import { Role } from '../entities/role.entity';
import { ApiProperty } from '@nestjs/swagger';

export class CustomRoleResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440110' })
  id: string;
  @ApiProperty({ example: 'teaching-assistant' })
  name: string;
  @ApiProperty({ example: 'Can read and manage assignment-related resources', nullable: true })
  description: string | null;
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440120', nullable: true })
  workspaceId: string | null;
  @ApiProperty({ example: null, nullable: true })
  classId: string | null;
  @ApiProperty({ example: false })
  isSystem: boolean;
  @ApiProperty({
    type: [String],
    example: ['read:assignment', 'read:lecture'],
  })
  permissionKeys: string[];

  static fromEntity(
    role: Role,
    permissionKeys: string[],
  ): CustomRoleResponseDto {
    const dto = new CustomRoleResponseDto();
    dto.id = role.id;
    dto.name = role.name;
    dto.description = role.description ?? null;
    dto.workspaceId = role.workspaceId ?? null;
    dto.classId = role.classId ?? null;
    dto.isSystem = role.isSystem;
    dto.permissionKeys = permissionKeys;
    return dto;
  }
}
