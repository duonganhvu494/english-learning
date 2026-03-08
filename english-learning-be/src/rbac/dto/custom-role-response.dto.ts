import { Role } from '../entities/role.entity';

export class CustomRoleResponseDto {
  id: string;
  name: string;
  description: string | null;
  workspaceId: string | null;
  classId: string | null;
  isSystem: boolean;
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
