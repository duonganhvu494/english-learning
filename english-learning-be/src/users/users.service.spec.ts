import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { AuthOtpService } from 'src/auth/redis/auth-otp.service';
import { MailService } from 'src/mail/mail.service';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { AuthSessionsService } from 'src/auth/redis/auth-sessions.service';

describe('UsersService', () => {
  let service: UsersService;
  const usersRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const authSessionsService = {
    revokeAllUserSessions: jest.fn(),
  };
  const mailService = {
    sendEmailVerificationOtp: jest.fn(),
    sendPasswordResetOtp: jest.fn(),
  };
  const authOtpService = {
    issueEmailVerificationOtp: jest.fn(),
    issuePasswordResetOtp: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
        {
          provide: AuthSessionsService,
          useValue: authSessionsService,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
        {
          provide: AuthOtpService,
          useValue: authOtpService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should reject removing unknown users', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(service.remove('missing-user')).rejects.toThrow(
      new BadRequestException('User not found'),
    );
  });

  it('should disable active users instead of deleting them', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      isActive: true,
    });
    usersRepo.save.mockResolvedValue({
      id: 'user-1',
      isActive: false,
    });

    await expect(service.remove('user-1')).resolves.toEqual({ deleted: true });
    expect(usersRepo.save).toHaveBeenCalledWith({
      id: 'user-1',
      isActive: false,
    });
    expect(authSessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
      'user-1',
    );
  });

  it('should be idempotent when user is already inactive', async () => {
    usersRepo.findOne.mockResolvedValue({
      id: 'user-1',
      isActive: false,
    });

    await expect(service.remove('user-1')).resolves.toEqual({ deleted: true });
    expect(usersRepo.save).not.toHaveBeenCalled();
    expect(authSessionsService.revokeAllUserSessions).toHaveBeenCalledWith(
      'user-1',
    );
  });
});
