import { User } from '../entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

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

    static fromData(data: {
        id: string;
        userName: string;
        fullName: string;
        email: string;
        mustChangePassword: boolean;
    }): UserProfileResponse {
        const dto = new UserProfileResponse();
        dto.id = data.id;
        dto.userName = data.userName;
        dto.fullName = data.fullName;
        dto.email = data.email;
        dto.mustChangePassword = data.mustChangePassword;
        return dto;
    }

    static fromEntity(user: User): UserProfileResponse {
        return UserProfileResponse.fromData({
            id: user.id,
            userName: user.userName,
            fullName: user.fullName,
            email: user.email,
            mustChangePassword: user.mustChangePassword,
        });
    }
}
