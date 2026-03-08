import { IsOptional, IsUUID } from 'class-validator';

export class UpdateClassStudentRoleDto {
  @IsOptional()
  @IsUUID('4', { message: 'roleId must be a valid UUID' })
  roleId?: string | null;
}
