import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto {
  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'Student full name',
  })
  @IsNotEmpty({ message: 'Fullname can not be empty' })
  fullName: string;

  @ApiProperty({
    example: 'student01',
    description: 'Username for the student account',
  })
  @IsNotEmpty({ message: 'Username can not be empty' })
  userName: string;

  @ApiProperty({
    example: 'student01@example.com',
    description: 'Student email',
  })
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;
}
