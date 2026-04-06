import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'teacher@example.com',
    description: 'Email address of the account requesting password reset',
  })
  @IsEmail({}, { message: 'Email is invalid' })
  email: string;
}
