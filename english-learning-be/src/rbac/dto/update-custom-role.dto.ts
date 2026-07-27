import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateCustomRoleDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @MaxLength(50, { message: 'name is too long' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'description must be a string' })
  @MaxLength(255, { message: 'description is too long' })
  description?: string;

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
