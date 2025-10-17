import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UserProfileResponse } from 'src/users/dto/user-profile-response.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
        private readonly config: ConfigService,
    ) {}

    async signIn(userName: string, password: string) {
        const user = await this.usersService.findByUserName(userName);
        if (!user) {
            throw new UnauthorizedException("Username is not registered");
        }

        const matchPass = await bcrypt.compare(password, user.password);
        if (!matchPass) {
            throw new UnauthorizedException("Password is incorrect");
        }

        const payload = { name: user.fullName, email: user.email, role: user.globalRole, sub: user.id };
        const accessToken = await this.jwtService.signAsync(payload);
        const refreshToken = await this.jwtService.signAsync(payload);

        return {
            accessToken,
            refreshToken,
            user: UserProfileResponse.fromEntity(user),
        }
    }

    async me(email: string) {
        console.log(email);
        const user = await this.usersService.findByEmail(email);
        if (!user) {
        throw new UnauthorizedException('Invalid email');
        }
        return {
            userName: user.userName,
            fullName: user.fullName,
            email: user.email,
            globalRole: user.globalRole,
        };
    }
}
