import { Permission } from '../entities/permission.entity';

export class PermissionResponseDto {
  id: string;
  action: string;
  resource: string;
  description: string | null;
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
