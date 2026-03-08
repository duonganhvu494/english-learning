import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountType, User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { UserProfileResponse } from './dto/user-profile-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AuthSessionsService } from 'src/auth-sessions/auth-sessions.service';

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
      throw new BadRequestException('Email or username already exists');
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

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
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
      throw new BadRequestException('User not found');
    }

    return UserProfileResponse.fromEntity(user);
  }

  // ================== UPDATE ==================
  async updateProfile(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (dto.email && dto.email !== user.email) {
      const emailExist = await this.usersRepo.findOne({
        where: { email: dto.email },
      });
      if (emailExist) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (dto.userName && dto.userName !== user.userName) {
      const userNameExist = await this.usersRepo.findOne({
        where: { userName: dto.userName },
      });
      if (userNameExist) {
        throw new BadRequestException('Username already exists');
      }
    }

    await this.usersRepo.update(id, dto);
    return this.getUserById(id);
  }

  // ================== DELETE ==================
  async remove(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
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
