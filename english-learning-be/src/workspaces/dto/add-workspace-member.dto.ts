// src/workspaces/dto/add-workspace-member.dto.ts
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddWorkspaceMemberDto {
  @IsUUID('4', { message: 'userId must be a valid UUID' })
  userId: string;

  @IsString({ message: 'roleName must be a string' })
  @IsNotEmpty({ message: 'roleName can not be empty' })
  @MaxLength(50, { message: 'roleName is too long' })
  roleName: string;
}
