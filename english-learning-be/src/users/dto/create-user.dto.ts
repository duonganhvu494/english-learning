import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'Duong Anh Vu',
    description: 'Full name of the user',
  })
  @IsNotEmpty({ message: 'Fullname can not be empty' })
  fullName: string;

  @ApiProperty({
    example: 'duonganhvu',
    description: 'Unique username for login',
  })
  @IsNotEmpty({ message: 'Username can not be empty' })
  userName: string;

  @ApiProperty({
    example: 'password123',
    description: 'Password with at least 6 characters',
    minLength: 6,
  })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  @IsNotEmpty({ message: 'Password can not be empty' })
  password: string;

  @ApiProperty({
    example: 'duonganhvu@example.com',
    description: 'Email address of the user',
  })
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;
}
