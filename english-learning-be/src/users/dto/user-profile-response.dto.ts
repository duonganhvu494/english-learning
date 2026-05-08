import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AccountType, User } from '../entities/user.entity';

export class UserProfileResponse {
    @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
    id: string;
    @ApiProperty({ example: 'duonganhvu' })
    userName: string;
    @ApiProperty({ example: 'Duong Anh Vu' })
    fullName: string;
    @ApiProperty({ example: 'duonganhvu@example.com' })
    email: string;
    @ApiProperty({ example: false })
    mustChangePassword: boolean;
    @ApiProperty({ example: true })
    emailVerified: boolean;
    @ApiProperty({ enum: AccountType, example: AccountType.TEACHER })
    role: string;
    @ApiPropertyOptional({
        example: 'https://cdn.example.com/avatars/teacher01.png',
        nullable: true,
    })
    avatarUrl?: string;

    static fromData(data: {
        id: string;
        userName: string;
        fullName: string;
        email: string;
        mustChangePassword: boolean;
        emailVerified: boolean;
        role: string;
        avatarUrl?: string;
    }): UserProfileResponse {
        const dto = new UserProfileResponse();
        dto.id = data.id;
        dto.userName = data.userName;
        dto.fullName = data.fullName;
        dto.email = data.email;
        dto.mustChangePassword = data.mustChangePassword;
        dto.emailVerified = data.emailVerified;
        dto.role = data.role;
        dto.avatarUrl = data.avatarUrl;
        return dto;
    }

    static fromEntity(user: User): UserProfileResponse {
        return UserProfileResponse.fromData({
            id: user.id,
            userName: user.userName,
            fullName: user.fullName,
            email: user.email,
            mustChangePassword: user.mustChangePassword,
            emailVerified:
                !user.emailVerificationRequired ||
                user.emailVerifiedAt !== null,
            role: user.accountType,
            avatarUrl: undefined,
        });
    }
}
