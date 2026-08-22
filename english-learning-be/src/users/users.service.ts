import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { errorPayload } from "src/common/utils/error-payload.util";
import { AuthSessionsService } from "src/auth/redis/auth-sessions.service";
import { AuthOtpService } from "src/auth/redis/auth-otp.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { RegisterUserResponseDto } from "./dto/register-user-response.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UserProfileResponse } from "./dto/user-profile-response.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { AccountType, User } from "./entities/user.entity";
import { MailQueueService } from "src/mail/queue/mail-queue.service";
import {
  PendingRegistration,
  PendingRegistrationService,
} from "src/auth/redis/pending-registration.service";

import { PendingEmailChangeService } from "src/auth/redis/pending-email-change.service";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly authSessionsService: AuthSessionsService,
    private readonly authOtpService: AuthOtpService,
    private readonly mailQueueService: MailQueueService,
    private readonly pendingRegistrationService: PendingRegistrationService,
    private readonly pendingEmailChangeService: PendingEmailChangeService,
  ) {}

  async register(dto: CreateUserDto): Promise<RegisterUserResponseDto> {
    const totalStart = performance.now();

    let start = performance.now();

    const normalizedInput = this.normalizeCreateUserInput(dto);

    console.log(
      `[REGISTER] normalize: ${(performance.now() - start).toFixed(2)}ms`,
    );

    start = performance.now();

    const existingUser = await this.usersRepo.findOne({
      where: [
        {
          email: normalizedInput.email,
        },
        {
          userName: normalizedInput.userName,
        },
      ],
    });

    console.log(
      `[REGISTER] check existing user: ${(performance.now() - start).toFixed(2)}ms`,
    );

    if (existingUser) {
      throw new BadRequestException(
        errorPayload(
          "Email or username already exists",
          "USER_CREDENTIALS_ALREADY_EXIST",
        ),
      );
    }

    start = performance.now();

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    console.log(
      `[REGISTER] bcrypt hash: ${(performance.now() - start).toFixed(2)}ms`,
    );

    start = performance.now();

    const pendingRegistration = await this.pendingRegistrationService.create({
      fullName: normalizedInput.fullName,
      email: normalizedInput.email,
      userName: normalizedInput.userName,
      hashedPassword,
    });

    console.log(
      `[REGISTER] save pending registration: ${(performance.now() - start).toFixed(2)}ms`,
    );

    start = performance.now();

    const verificationChallenge =
      await this.authOtpService.issueEmailVerificationOtp(
        pendingRegistration.registrationId,
      );

    console.log(
      `[REGISTER] issue OTP: ${(performance.now() - start).toFixed(2)}ms`,
    );

    start = performance.now();

    await this.mailQueueService.enqueueEmailVerificationOtp({
      email: pendingRegistration.email,
      fullName: pendingRegistration.fullName,
      otp: verificationChallenge.code,
      expiresAt: verificationChallenge.expiresAt,
    });

    console.log(
      `[REGISTER] enqueue email: ${(performance.now() - start).toFixed(2)}ms`,
    );

    console.log(
      `[REGISTER] TOTAL: ${(performance.now() - totalStart).toFixed(2)}ms`,
    );

    return RegisterUserResponseDto.fromData({
      registrationId: pendingRegistration.registrationId,

      email: pendingRegistration.email,

      emailVerificationRequired: true,

      emailVerificationExpiresAt: verificationChallenge.expiresAt,
    });
  }

  async createVerifiedUserFromPending(
    pending: PendingRegistration,
  ): Promise<UserProfileResponse> {
    const existingUser = await this.usersRepo.findOne({
      where: [{ email: pending.email }, { userName: pending.userName }],
    });

    if (existingUser) {
      throw new BadRequestException(
        errorPayload(
          "Email or username already exists",
          "USER_CREDENTIALS_ALREADY_EXIST",
        ),
      );
    }

    const user = this.usersRepo.create({
      fullName: pending.fullName,
      email: pending.email,
      userName: pending.userName,
      password: pending.hashedPassword,

      mustChangePassword: false,
      accountType: AccountType.TEACHER,
      isActive: true,
      isSuperAdmin: false,

      // OTP đã verify rồi
      emailVerificationRequired: false,
      emailVerifiedAt: new Date(),
    });

    const savedUser = await this.usersRepo.save(user);

    return UserProfileResponse.fromEntity(savedUser);
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
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.id = :id", { id })
      .getOne();
  }

  findByUserName(userName: string): Promise<User | null> {
    const normalizedUserName = userName.trim();
    return this.usersRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.userName = :userName", { userName: normalizedUserName })
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
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.userName = :identifier", {
        identifier: normalizedIdentifier,
      })
      .orWhere("user.email = :identifier", { identifier: normalizedIdentifier })
      .getOne();
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    const normalizedEmail = this.normalizeEmail(email);
    return this.usersRepo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email: normalizedEmail })
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

    let pendingEmail: string | null = null;

    if (
      normalizedInput.email !== undefined &&
      normalizedInput.email !== user.email
    ) {
      const emailExist = await this.usersRepo.findOne({
        where: { email: normalizedInput.email },
      });

      if (emailExist) {
        throw new BadRequestException(
          errorPayload("Email already exists", "USER_EMAIL_ALREADY_EXISTS"),
        );
      }

      pendingEmail = normalizedInput.email;
    }

    if (
      normalizedInput.userName !== undefined &&
      normalizedInput.userName !== user.userName
    ) {
      const userNameExist = await this.usersRepo.findOne({
        where: {
          userName: normalizedInput.userName,
        },
      });

      if (userNameExist) {
        throw new BadRequestException(
          errorPayload(
            "Username already exists",
            "USER_USERNAME_ALREADY_EXISTS",
          ),
        );
      }

      user.userName = normalizedInput.userName;
    }

    if (normalizedInput.fullName !== undefined) {
      user.fullName = normalizedInput.fullName;
    }

    const savedUser = await this.usersRepo.save(user);

    if (pendingEmail) {
      await this.pendingEmailChangeService.create({
        userId: savedUser.id,
        email: pendingEmail,
      });

      const challenge = await this.authOtpService.issueEmailVerificationOtp(
        savedUser.id,
      );

      await this.mailQueueService.enqueueEmailVerificationOtp({
        email: pendingEmail,
        fullName: savedUser.fullName,
        otp: challenge.code,
        expiresAt: challenge.expiresAt,
      });
    }

    return UserProfileResponse.fromEntity(savedUser);
  }

  async verifyEmailChange(
    userId: string,
    otp: string,
  ): Promise<UserProfileResponse> {
    const pendingEmailChange =
      await this.pendingEmailChangeService.find(userId);

    if (!pendingEmailChange) {
      throw new BadRequestException(
        errorPayload(
          "Email change request is invalid or expired",
          "AUTH_EMAIL_CHANGE_INVALID",
        ),
      );
    }

    const verificationStatus =
      await this.authOtpService.verifyEmailVerificationOtp(userId, otp);

    if (verificationStatus === "expired") {
      throw new BadRequestException(
        errorPayload(
          "Verification OTP has expired",
          "AUTH_EMAIL_VERIFICATION_OTP_EXPIRED",
        ),
      );
    }

    if (verificationStatus !== "valid") {
      throw new BadRequestException(
        errorPayload(
          "Verification OTP is invalid",
          "AUTH_EMAIL_VERIFICATION_OTP_INVALID",
        ),
      );
    }

    const emailExist = await this.usersRepo.findOne({
      where: {
        email: pendingEmailChange.email,
      },
    });

    if (emailExist && emailExist.id !== userId) {
      throw new BadRequestException(
        errorPayload("Email already exists", "USER_EMAIL_ALREADY_EXISTS"),
      );
    }

    const user = await this.getUserOrThrow(userId);

    user.email = pendingEmailChange.email;
    user.emailVerifiedAt = new Date();
    user.emailVerificationRequired = false;

    const savedUser = await this.usersRepo.save(user);

    await this.pendingEmailChangeService.remove(userId);

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

  // async issueEmailVerificationChallenge(email: string): Promise<Date | null> {
  //   const user = await this.findByEmail(email);
  //   if (!user || !user.isActive || !user.emailVerificationRequired) {
  //     return null;
  //   }

  //   const challenge = await this.authOtpService.issueEmailVerificationOtp(
  //     user.id,
  //   );
  //   await this.mailService.sendEmailVerificationOtp({
  //     email: user.email,
  //     fullName: user.fullName,
  //     otp: challenge.code,
  //     expiresAt: challenge.expiresAt,
  //   });

  //   return challenge.expiresAt;
  // }

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

    await this.mailQueueService.enqueuePasswordResetOtp({
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
        errorPayload("User not found", "USER_NOT_FOUND"),
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
        errorPayload("User not found", "USER_NOT_FOUND"),
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
      email:
        dto.email === undefined ? undefined : this.normalizeEmail(dto.email),
      fullName: dto.fullName === undefined ? undefined : dto.fullName.trim(),
      userName: dto.userName === undefined ? undefined : dto.userName.trim(),
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private normalizeLoginIdentifier(identifier: string): string {
    const normalizedIdentifier = identifier.trim();
    return normalizedIdentifier.includes("@")
      ? normalizedIdentifier.toLowerCase()
      : normalizedIdentifier;
  }
}
