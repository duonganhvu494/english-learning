import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { errorPayload } from 'src/common/utils/error-payload.util';
import { MailService } from 'src/mail/mail.service';
import { AuthSessionsService } from 'src/auth/redis/auth-sessions.service';
import { AuthOtpService } from 'src/auth/redis/auth-otp.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RegisterUserResponseDto } from './dto/register-user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserProfileResponse } from './dto/user-profile-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { AccountType, User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly authSessionsService: AuthSessionsService,
    private readonly mailService: MailService,
    private readonly authOtpService: AuthOtpService,
  ) {}

  async register(dto: CreateUserDto): Promise<RegisterUserResponseDto> {
    const normalizedInput = this.normalizeCreateUserInput(dto);
    const existingUser = await this.usersRepo.findOne({
      where: [
        { email: normalizedInput.email },
        { userName: normalizedInput.userName },
      ],
    });
    if (existingUser) {
      throw new BadRequestException(
        errorPayload(
          'Email or username already exists',
          'USER_CREDENTIALS_ALREADY_EXIST',
        ),
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.usersRepo.create({
      fullName: normalizedInput.fullName,
      email: normalizedInput.email,
      userName: normalizedInput.userName,
      password: hashedPassword,
      mustChangePassword: false,
      accountType: AccountType.TEACHER,
      isActive: true,
      isSuperAdmin: false,
      emailVerificationRequired: true,
      emailVerifiedAt: null,
    });

    const savedUser = await this.usersRepo.save(user);
    const verificationChallenge = await this.authOtpService.issueEmailVerificationOtp(
      savedUser.id,
    );
    await this.mailService.sendEmailVerificationOtp({
      email: savedUser.email,
      fullName: savedUser.fullName,
      otp: verificationChallenge.code,
      expiresAt: verificationChallenge.expiresAt,
    });

    return RegisterUserResponseDto.fromData({
      user: savedUser,
      emailVerificationRequired: true,
      emailVerificationExpiresAt: verificationChallenge.expiresAt,
    });
  }

  async listUsers(): Promise<UserResponseDto[]> {
    const users = await this.usersRepo.find();
    return users.map((user) => UserResponseDto.fromEntity(user));
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  findByIdWithPassword(id: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();
  }

  findByUserName(userName: string): Promise<User | null> {
    const normalizedUserName = userName.trim();
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.userName = :userName', { userName: normalizedUserName })
      .getOne();
  }

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email: this.normalizeEmail(email) },
    });
  }

  findByEmailOrUserName(identifier: string): Promise<User | null> {
    const normalizedIdentifier = this.normalizeLoginIdentifier(identifier);
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.userName = :identifier', { identifier: normalizedIdentifier })
      .orWhere('user.email = :identifier', { identifier: normalizedIdentifier })
      .getOne();
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    const normalizedEmail = this.normalizeEmail(email);
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: normalizedEmail })
      .getOne();
  }

  async getUserById(id: string): Promise<UserProfileResponse> {
    const user = await this.getUserOrThrow(id);
    return UserProfileResponse.fromEntity(user);
  }

  async updateProfile(
    id: string,
    dto: UpdateUserDto,
  ): Promise<UserProfileResponse> {
    const user = await this.getUserOrThrow(id);
    const normalizedInput = this.normalizeUpdateUserInput(dto);
    let emailVerificationRequired = false;

    if (
      normalizedInput.email !== undefined &&
      normalizedInput.email !== user.email
    ) {
      const emailExist = await this.usersRepo.findOne({
        where: { email: normalizedInput.email },
      });
      if (emailExist) {
        throw new BadRequestException(
          errorPayload('Email already exists', 'USER_EMAIL_ALREADY_EXISTS'),
        );
      }
      user.email = normalizedInput.email;
      user.emailVerifiedAt = null;
      user.emailVerificationRequired = true;
      emailVerificationRequired = true;
    }

    if (
      normalizedInput.userName !== undefined &&
      normalizedInput.userName !== user.userName
    ) {
      const userNameExist = await this.usersRepo.findOne({
        where: { userName: normalizedInput.userName },
      });
      if (userNameExist) {
        throw new BadRequestException(
          errorPayload(
            'Username already exists',
            'USER_USERNAME_ALREADY_EXISTS',
          ),
        );
      }
      user.userName = normalizedInput.userName;
    }

    if (normalizedInput.fullName !== undefined) {
      user.fullName = normalizedInput.fullName;
    }

    const savedUser = await this.usersRepo.save(user);
    if (emailVerificationRequired) {
      const challenge = await this.authOtpService.issueEmailVerificationOtp(
        savedUser.id,
      );
      await this.mailService.sendEmailVerificationOtp({
        email: savedUser.email,
        fullName: savedUser.fullName,
        otp: challenge.code,
        expiresAt: challenge.expiresAt,
      });
    }
    return UserProfileResponse.fromEntity(savedUser);
  }

  async updatePassword(
    id: string,
    newPassword: string,
    mustChangePassword = false,
  ): Promise<UserProfileResponse> {
    const user = await this.getUserOrThrow(id);
    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = mustChangePassword;

    const savedUser = await this.usersRepo.save(user);
    return UserProfileResponse.fromEntity(savedUser);
  }

  async issueEmailVerificationChallenge(email: string): Promise<Date | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.isActive || !user.emailVerificationRequired) {
      return null;
    }

    const challenge = await this.authOtpService.issueEmailVerificationOtp(user.id);
    await this.mailService.sendEmailVerificationOtp({
      email: user.email,
      fullName: user.fullName,
      otp: challenge.code,
      expiresAt: challenge.expiresAt,
    });

    return challenge.expiresAt;
  }

  async markEmailVerified(id: string): Promise<UserProfileResponse> {
    const user = await this.getUserOrThrow(id);
    user.emailVerificationRequired = false;
    user.emailVerifiedAt = new Date();

    const savedUser = await this.usersRepo.save(user);
    return UserProfileResponse.fromEntity(savedUser);
  }

  async issuePasswordResetChallenge(email: string): Promise<Date | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    const challenge = await this.authOtpService.issuePasswordResetOtp(user.id);
    await this.mailService.sendPasswordResetOtp({
      email: user.email,
      fullName: user.fullName,
      otp: challenge.code,
      expiresAt: challenge.expiresAt,
    });

    return challenge.expiresAt;
  }

  async resetPasswordByOtp(
    id: string,
    newPassword: string,
  ): Promise<UserProfileResponse> {
    const user = await this.findByIdWithPassword(id);
    if (!user) {
      throw new BadRequestException(
        errorPayload('User not found', 'USER_NOT_FOUND'),
      );
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;

    const savedUser = await this.usersRepo.save(user);
    return UserProfileResponse.fromEntity(savedUser);
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const user = await this.getUserOrThrow(id);

    if (!user.isActive) {
      await this.authSessionsService.revokeAllUserSessions(id);
      return { deleted: true };
    }

    user.isActive = false;
    await this.usersRepo.save(user);
    await this.authSessionsService.revokeAllUserSessions(id);

    return { deleted: true };
  }

  private async getUserOrThrow(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException(
        errorPayload('User not found', 'USER_NOT_FOUND'),
      );
    }

    return user;
  }

  private normalizeCreateUserInput(dto: CreateUserDto): {
    email: string;
    fullName: string;
    userName: string;
  } {
    return {
      email: this.normalizeEmail(dto.email),
      fullName: dto.fullName.trim(),
      userName: dto.userName.trim(),
    };
  }

  private normalizeUpdateUserInput(dto: UpdateUserDto): UpdateUserDto {
    return {
      ...dto,
      email: dto.email === undefined ? undefined : this.normalizeEmail(dto.email),
      fullName: dto.fullName === undefined ? undefined : dto.fullName.trim(),
      userName: dto.userName === undefined ? undefined : dto.userName.trim(),
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeLoginIdentifier(identifier: string): string {
    const normalizedIdentifier = identifier.trim();
    return normalizedIdentifier.includes('@')
      ? normalizedIdentifier.toLowerCase()
      : normalizedIdentifier;
  }
}
