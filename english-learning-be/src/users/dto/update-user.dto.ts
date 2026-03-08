import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'fullName must be a string' })
  @MaxLength(100, { message: 'fullName is too long' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'userName must be a string' })
  @MaxLength(50, { message: 'userName is too long' })
  userName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email is invalid' })
  email?: string;
}
