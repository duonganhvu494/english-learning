import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Fullname can not be empty' })
  fullName: string;

  @IsNotEmpty({ message: 'Username can not be empty' })
  userName: string;

  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @IsNotEmpty({ message: 'Password can not be empty' })
  password: string;

  @IsEmail({}, { message: 'Email is invalid' })
  email: string;
}
