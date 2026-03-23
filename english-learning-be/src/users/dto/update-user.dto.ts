import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Nguyen Van A',
    description: 'Updated full name',
  })
  @IsOptional()
  @IsString({ message: 'fullName must be a string' })
  @MaxLength(100, { message: 'fullName is too long' })
  fullName?: string;

  @ApiPropertyOptional({
    example: 'student01',
    description: 'Updated username',
  })
  @IsOptional()
  @IsString({ message: 'userName must be a string' })
  @MaxLength(50, { message: 'userName is too long' })
  userName?: string;

  @ApiPropertyOptional({
    example: 'student01@example.com',
    description: 'Updated email address',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email is invalid' })
  email?: string;
}
