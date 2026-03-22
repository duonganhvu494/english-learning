import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'temporary-password',
    description: 'Current password of the authenticated user',
  })
  @IsNotEmpty({ message: 'Current password can not be empty' })
  currentPassword: string;

  @ApiProperty({
    example: 'new-secure-password',
    description: 'New password with at least 6 characters',
    minLength: 6,
  })
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  @IsNotEmpty({ message: 'New password can not be empty' })
  newPassword: string;
}
