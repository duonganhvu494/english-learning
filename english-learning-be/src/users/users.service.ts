import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { UserProfileResponse } from './dto/user-profile-response.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  private generateRandomPassword(length = 10): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      password += chars[randomIndex];
    }
    return password;
  }

  async register(dto: CreateUserDto) {
    const existEmail = await this.usersRepo.findOne({
      where: [{ email: dto.email }],
    });
    if (existEmail) {
      throw new BadRequestException('Email already exists');
    }

    const existUsername = await this.usersRepo.findOne({
      where: [{ userName: dto.userName }],
    });
    if (existUsername) {
      throw new BadRequestException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    const user = this.usersRepo.create({ ...dto, password: hashedPassword, globalRole: 'teacher' });
    
    return this.usersRepo.save(user);
  }

  async createStudent(dto: CreateStudentDto) {
    const exist = await this.usersRepo.findOne({
      where: [{ email: dto.email }, { userName: dto.userName }],
    });
    if (exist) {
      throw new BadRequestException('Email or Username already exists');
    }

    const randomPassword = this.generateRandomPassword();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);
    
    const user = this.usersRepo.create({ ...dto, password: hashedPassword, mustChangePassword: true });
    const savedUser = await this.usersRepo.save(user);

    return { user: savedUser, plainPassword: randomPassword };
  }

  findAll() {
    return this.usersRepo.find();
  }

  async findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findByUserName(userName: string) {
    return this.usersRepo.findOne({ where: { userName } });
  }

  async getUserById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return UserProfileResponse.fromEntity(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (dto.email && dto.email !== user.email) {
      const emailExist = await this.usersRepo.findOne({ where: { email: dto.email } });
      if (emailExist) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (dto.userName && dto.userName !== user.userName) {
      const userNameExist = await this.usersRepo.findOne({ where: { userName: dto.userName } });
      if (userNameExist) {
        throw new BadRequestException('Username already exists');
      }
    }

    return this.usersRepo.update(id, dto);
  }

  async remove(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    
    return this.usersRepo.delete(id);
  }
}
