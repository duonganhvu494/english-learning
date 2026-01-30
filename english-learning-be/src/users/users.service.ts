import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountType, User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';
import { UserProfileResponse } from './dto/user-profile-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  // ================== UTILS ==================
  private generateRandomPassword(length = 10): string {
    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    return password;
  }

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

    return this.usersRepo.save(user);
  }

  // ================== CREATE STUDENT ACCOUNT ==================
  /**
   * Tạo user cho student
   * KHÔNG gán role
   * Role sẽ được gán khi add vào workspace
   */
  async createStudent(dto: CreateStudentDto) {
    const exist = await this.usersRepo.findOne({
      where: [{ email: dto.email }, { userName: dto.userName }],
    });
    if (exist) {
      throw new BadRequestException('Email or username already exists');
    }

    const randomPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const user = this.usersRepo.create({
      fullName: dto.fullName,
      email: dto.email,
      userName: dto.userName,
      password: hashedPassword,
      mustChangePassword: true,
      accountType: AccountType.STUDENT,
      isActive: true,
      isSuperAdmin: false,
    });

    const savedUser = await this.usersRepo.save(user);

    return {
      user: UserProfileResponse.fromEntity(savedUser),
      plainPassword: randomPassword,
    };
  }

  // ================== QUERIES ==================
  findAll() {
    return this.usersRepo.find();
  }

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  findByUserName(userName: string) {
    return this.usersRepo.findOne({ where: { userName } });
  }

  async getUserById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return UserProfileResponse.fromEntity(user);
  }

  // ================== UPDATE ==================
  async update(id: string, dto: UpdateUserDto) {
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

    await this.usersRepo.delete(id);
    return { deleted: true };
  }
}
