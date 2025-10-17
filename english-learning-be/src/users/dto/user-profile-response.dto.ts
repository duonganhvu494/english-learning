import { User } from '../entities/user.entity';

export class UserProfileResponse {
    id: string;
    userName: string;
    fullName: string;
    email: string;

    static fromEntity(user: User): UserProfileResponse {
        const dto = new UserProfileResponse();
        dto.id = user.id;
        dto.userName = user.userName;
        dto.fullName = user.fullName;
        dto.email = user.email;
        return dto;
    }
}