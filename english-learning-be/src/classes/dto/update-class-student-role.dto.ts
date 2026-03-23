import { IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateClassStudentRoleDto {
  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440100',
    description:
      'New class role ID. Omit or set null to fall back to the default student role.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID('4', { message: 'roleId must be a valid UUID' })
  roleId?: string | null;
}
