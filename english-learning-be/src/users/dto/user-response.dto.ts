import { AccountType, User } from '../entities/user.entity';

export class UserResponseDto {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  mustChangePassword: boolean;
  accountType: AccountType;
  isSuperAdmin: boolean;
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
