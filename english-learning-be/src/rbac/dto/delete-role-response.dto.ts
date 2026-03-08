export class DeleteRoleResponseDto {
  roleId: string;
  workspaceId: string | null;
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
