import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty({ message: 'Fullname can not be empty' })
  fullName: string;

  @IsNotEmpty({ message: 'Username can not be empty' })
  userName: string;

  @IsEmail({}, { message: 'Email is invalid' })
  email: string;
}
