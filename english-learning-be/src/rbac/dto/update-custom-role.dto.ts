import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCustomRoleDto {
  @ApiPropertyOptional({
    example: 'content-manager',
    description: 'Updated role name',
  })
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MaxLength(50, { message: 'name is too long' })
  name?: string;

  @ApiPropertyOptional({
    example: 'Can manage content across the workspace',
    description: 'Updated role description',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(255, { message: 'description is too long' })
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['read:lecture', 'update:lecture'],
    description: 'Updated permission keys',
  })
  @IsOptional()
  @IsArray({ message: 'permissionKeys must be an array' })
  @ArrayUnique({ message: 'permissionKeys contains duplicated values' })
  @IsString({ each: true, message: 'each permissionKey must be a string' })
  @Matches(/^[a-z_]+:[a-z_]+$/, {
    each: true,
    message: 'each permissionKey must follow action:resource format',
  })
  permissionKeys?: string[];
}
