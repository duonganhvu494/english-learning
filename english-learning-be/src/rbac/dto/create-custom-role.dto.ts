import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomRoleDto {
  @ApiProperty({
    example: 'content-manager',
    description: 'Unique custom role name inside the workspace',
  })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name can not be empty' })
  @MaxLength(50, { message: 'name is too long' })
  name: string;

  @ApiPropertyOptional({
    example: 'Can manage materials and lectures',
    description: 'Optional role description',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(255, { message: 'description is too long' })
  description?: string;

  @ApiProperty({
    type: [String],
    example: ['read:lecture', 'create:lecture'],
    description: 'Permission keys assigned to the role',
  })
  @IsArray({ message: 'permissionKeys must be an array' })
  @ArrayMinSize(1, { message: 'permissionKeys must contain at least 1 item' })
  @ArrayUnique({ message: 'permissionKeys contains duplicated values' })
  @IsString({ each: true, message: 'each permissionKey must be a string' })
  @Matches(/^[a-z_]+:[a-z_]+$/, {
    each: true,
    message: 'each permissionKey must follow action:resource format',
  })
  permissionKeys: string[];
}
