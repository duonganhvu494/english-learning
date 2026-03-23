import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClassRoleDto {
  @ApiProperty({
    example: 'assistant',
    description: 'Unique custom role name inside the class',
  })
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name can not be empty' })
  @MaxLength(50, { message: 'name is too long' })
  name: string;

  @ApiPropertyOptional({
    example: 'Can help monitor attendance and read learning resources',
    description: 'Optional role description',
  })
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(255, { message: 'description is too long' })
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['read:session', 'read:attendance'],
    description: 'Optional permission keys assigned to the class role',
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
