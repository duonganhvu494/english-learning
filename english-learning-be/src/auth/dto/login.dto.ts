import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class LoginDto {
  @ValidateIf((object: LoginDto) => !object.userName)
  @IsString({ message: 'Identifier is not valid' })
  identifier?: string;

  @IsOptional()
  @IsString({ message: 'Username is not valid' })
  userName?: string;

  @IsString({ message: 'Password is not valid' })
  password: string;
}
