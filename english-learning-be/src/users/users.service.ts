import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountType, User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UserProfileResponse } from './dto/user-profile-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthSessionsService } from 'src/auth-sessions/auth-sessions.service';
import { errorPayload } from 'src/common/utils/error-payload.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly authSessionsService: AuthSessionsService,
  ) {}

  // ================== REGISTER USER ==================
  async register(dto: CreateUserDto) {
    const exist = await this.usersRepo.findOne({
      where: [{ email: dto.email }, { userName: dto.userName }],
    });
    if (exist) {
      throw new BadRequestException(
        errorPayload(
          'Email or username already exists',
          'USER_CREDENTIALS_ALREADY_EXIST',
        ),
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      userName: dto.userName,
      password: hashedPassword,
      mustChangePassword: false,
      accountType: AccountType.TEACHER,
      isActive: true,
      isSuperAdmin: false, 
    });

    const savedUser = await this.usersRepo.save(user);
    return UserResponseDto.fromEntity(savedUser);
  }

  // ================== QUERIES ==================
  async findAll() {
    const users = await this.usersRepo.find();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    return users.map(UserResponseDto.fromEntity);
  }

  findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }

  findByIdWithPassword(id: string) {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
  }

  findByUserName(userName: string) {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.userName = :userName', { userName })
      .getOne();
  }

  async getUserById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException(
        errorPayload('User not found', 'USER_NOT_FOUND'),
      );
    }

    return UserProfileResponse.fromEntity(user);
  }

  // ================== UPDATE ==================
  async updateProfile(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException(
        errorPayload('User not found', 'USER_NOT_FOUND'),
      );
    }

    if (dto.email && dto.email !== user.email) {
      const emailExist = await this.usersRepo.findOne({
        where: { email: dto.email },
      });
      if (emailExist) {
        throw new BadRequestException(
          errorPayload('Email already exists', 'USER_EMAIL_ALREADY_EXISTS'),
        );
      }
    }

    if (dto.userName && dto.userName !== user.userName) {
      const userNameExist = await this.usersRepo.findOne({
        where: { userName: dto.userName },
      });
      if (userNameExist) {
        throw new BadRequestException(
          errorPayload(
            'Username already exists',
            'USER_USERNAME_ALREADY_EXISTS',
          ),
        );
      }
    }

    await this.usersRepo.update(id, dto);
    return this.getUserById(id);
  }

  async updatePassword(
    id: string,
    newPassword: string,
    mustChangePassword = false,
  ) {
    const user = await this.findById(id);
    if (!user) {
      throw new BadRequestException(
        errorPayload('User not found', 'USER_NOT_FOUND'),
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepo.update(id, {
      password: hashedPassword,
      mustChangePassword,
    });

    return this.getUserById(id);
  }

  // ================== DELETE ==================
  async remove(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException(
        errorPayload('User not found', 'USER_NOT_FOUND'),
      );
    }

    if (!user.isActive) {
      await this.authSessionsService.revokeAllUserSessions(id);
      return { deleted: true };
    }

    await this.usersRepo.update(id, { isActive: false });
    await this.authSessionsService.revokeAllUserSessions(id);

    return { deleted: true };
  }
}
