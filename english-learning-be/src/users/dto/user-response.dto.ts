import { AccountType, User } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  @ApiProperty({ example: 'Duong Anh Vu' })
  fullName: string;
  @ApiProperty({ example: 'duonganhvu' })
  userName: string;
  @ApiProperty({ example: 'duonganhvu@example.com' })
  email: string;
  @ApiProperty({ example: false })
  mustChangePassword: boolean;
  @ApiProperty({ enum: AccountType, example: AccountType.TEACHER })
  accountType: AccountType;
  @ApiProperty({ example: false })
  isSuperAdmin: boolean;
  @ApiProperty({ example: true })
  isActive: boolean;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.fullName = user.fullName;
    dto.userName = user.userName;
    dto.email = user.email;
    dto.mustChangePassword = user.mustChangePassword;
    dto.accountType = user.accountType;
    dto.isSuperAdmin = user.isSuperAdmin;
    dto.isActive = user.isActive;
    return dto;
  }
}
