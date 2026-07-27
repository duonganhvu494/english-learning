import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty({ message: 'Fullname can not be empty' })
  fullName: string;

  @IsEmail({}, { message: 'Email is invalid' })
  email: string;
}
