// src/workspaces/dto/add-workspace-member.dto.ts
export class AddWorkspaceMemberDto {
  userId: string;
  roleName: 'owner' | 'admin' | 'teacher' | 'student';
}
