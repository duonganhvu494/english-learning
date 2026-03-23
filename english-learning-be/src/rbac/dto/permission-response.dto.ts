import { Permission } from '../entities/permission.entity';
import { ApiProperty } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440100' })
  id: string;
  @ApiProperty({ example: 'read' })
  action: string;
  @ApiProperty({ example: 'assignment' })
  resource: string;
  @ApiProperty({ example: 'Allows reading assignment resources', nullable: true })
  description: string | null;
  @ApiProperty({ example: 'read:assignment' })
  key: string;

  static fromEntity(permission: Permission): PermissionResponseDto {
    const dto = new PermissionResponseDto();
    dto.id = permission.id;
    dto.action = permission.action;
    dto.resource = permission.resource;
    dto.description = permission.description ?? null;
    dto.key = `${permission.action}:${permission.resource}`;
    return dto;
  }
}
