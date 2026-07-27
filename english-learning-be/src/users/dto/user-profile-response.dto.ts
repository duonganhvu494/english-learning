import { AccountType, User } from '../entities/user.entity';

export class UserProfileResponse {
    id: string;
    userName: string;
    fullName: string;
    email: string;
    mustChangePassword: boolean;
    emailVerified: boolean;
    role: string;
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
