import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MailService } from 'src/mail/mail.service';
import { Role } from 'src/rbac/entities/role.entity';
import { AccountType, User } from 'src/users/entities/user.entity';
import { WorkspaceStudentsService } from './workspace-students.service';
import { WorkspaceEntitlementService } from './workspace-entitlement.service';
import { WorkspaceMember } from './entities/workspace-member.entity';

describe('WorkspaceStudentsService', () => {
  let service: WorkspaceStudentsService;

  const userRepo = {};
  const roleRepo = {
    findOne: jest.fn(),
  };
  const memberRepo = {
    manager: {
      transaction: jest.fn(),
    },
  };
  const mailService = {
    sendStudentProvisionedCredentials: jest.fn(),
  };
  const workspaceEntitlementService = {
    assertStudentQuotaAvailable: jest.fn(),
  };

  const txUserRepo = {
    findOne: jest.fn(),
    exists: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const txMemberRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    txUserRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    txMemberRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    memberRepo.manager.transaction.mockImplementation(
      async (
        callback: (manager: {
          getRepository: (entity: unknown) => unknown;
        }) => Promise<unknown>,
      ) => {
        return callback({
          getRepository: (entity: unknown) => {
            if (entity === User) {
              return txUserRepo;
            }

            return txMemberRepo;
          },
        });
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceStudentsService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepo,
        },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: memberRepo,
        },
        {
          provide: MailService,
          useValue: mailService,
        },
        {
          provide: WorkspaceEntitlementService,
          useValue: workspaceEntitlementService,
        },
      ],
    }).compile();

    service = module.get<WorkspaceStudentsService>(WorkspaceStudentsService);
  });

  it('creates a new student account, generates a unique username, and sends credentials by email', async () => {
    roleRepo.findOne.mockResolvedValue({
      id: 'role-student',
      name: 'student',
    });
    txUserRepo.findOne.mockResolvedValue(null);
    txUserRepo.exists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    txUserRepo.save.mockImplementation((user: Record<string, unknown>) =>
      Promise.resolve({
        id: 'student-1',
        ...user,
      }),
    );
    txMemberRepo.save.mockResolvedValue(undefined);

    const result = await service.provisionWorkspaceStudent(
      { id: 'workspace-1' } as never,
      {
        fullName: 'Nguyễn Văn A',
        email: 'student@example.com',
      },
    );

    expect(
      workspaceEntitlementService.assertStudentQuotaAvailable,
    ).toHaveBeenCalledWith('workspace-1');
    expect(txUserRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Nguyễn Văn A',
        email: 'student@example.com',
        userName: 'nguyenvana1',
        accountType: AccountType.STUDENT,
        mustChangePassword: true,
      }),
    );
    expect(mailService.sendStudentProvisionedCredentials).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'student@example.com',
        userName: 'nguyenvana1',
        temporaryPassword: expect.any(String),
      }),
    );
    expect(result).toEqual({
      mode: 'created',
      user: expect.objectContaining({
        id: 'student-1',
        userName: 'nguyenvana1',
      }),
      workspaceRole: expect.objectContaining({
        name: 'student',
      }),
    });
  });

  it('attaches an existing student account to the workspace without sending new credentials', async () => {
    const existingStudent = {
      id: 'student-1',
      fullName: 'Student One',
      email: 'student@example.com',
      userName: 'studentone',
      accountType: AccountType.STUDENT,
      isActive: true,
    };

    roleRepo.findOne.mockResolvedValue({
      id: 'role-student',
      name: 'student',
    });
    txUserRepo.findOne.mockResolvedValue(existingStudent);
    txMemberRepo.findOne.mockResolvedValue(null);
    txMemberRepo.save.mockResolvedValue(undefined);

    const result = await service.provisionWorkspaceStudent(
      { id: 'workspace-1' } as never,
      {
        fullName: 'Another Name',
        email: 'student@example.com',
      },
    );

    expect(
      workspaceEntitlementService.assertStudentQuotaAvailable,
    ).toHaveBeenCalledWith('workspace-1');
    expect(txMemberRepo.create).toHaveBeenCalledWith({
      workspace: { id: 'workspace-1' },
      user: existingStudent,
      role: expect.objectContaining({ name: 'student' }),
    });
    expect(mailService.sendStudentProvisionedCredentials).not.toHaveBeenCalled();
    expect(result).toEqual({
      mode: 'attached',
      user: existingStudent,
      workspaceRole: expect.objectContaining({ name: 'student' }),
    });
  });

  it('returns already_assigned when the student already belongs to the workspace', async () => {
    const existingStudent = {
      id: 'student-1',
      email: 'student@example.com',
      userName: 'studentone',
      accountType: AccountType.STUDENT,
      isActive: true,
    };
    const existingRole = { id: 'role-student', name: 'student' };

    roleRepo.findOne.mockResolvedValue(existingRole);
    txUserRepo.findOne.mockResolvedValue(existingStudent);
    txMemberRepo.findOne.mockResolvedValue({
      role: existingRole,
    });

    const result = await service.provisionWorkspaceStudent(
      { id: 'workspace-1' } as never,
      {
        fullName: 'Student One',
        email: 'student@example.com',
      },
    );

    expect(
      workspaceEntitlementService.assertStudentQuotaAvailable,
    ).not.toHaveBeenCalled();
    expect(mailService.sendStudentProvisionedCredentials).not.toHaveBeenCalled();
    expect(result).toEqual({
      mode: 'already_assigned',
      user: existingStudent,
      workspaceRole: existingRole,
    });
  });

  it('rejects when the email belongs to another account type', async () => {
    roleRepo.findOne.mockResolvedValue({
      id: 'role-student',
      name: 'student',
    });
    txUserRepo.findOne.mockResolvedValue({
      id: 'teacher-1',
      email: 'teacher@example.com',
      accountType: AccountType.TEACHER,
      isActive: true,
    });

    await expect(
      service.provisionWorkspaceStudent(
        { id: 'workspace-1' } as never,
        {
          fullName: 'Teacher Person',
          email: 'teacher@example.com',
        },
      ),
    ).rejects.toThrow(
      new BadRequestException('Email already belongs to another account'),
    );
  });

  it('propagates workspace quota errors only when a new membership would be created', async () => {
    roleRepo.findOne.mockResolvedValue({
      id: 'role-student',
      name: 'student',
    });
    txUserRepo.findOne.mockResolvedValue(null);
    txUserRepo.exists.mockResolvedValue(false);
    workspaceEntitlementService.assertStudentQuotaAvailable.mockRejectedValue(
      new ForbiddenException('Current workspace plan allows up to 30 students'),
    );

    await expect(
      service.provisionWorkspaceStudent(
        { id: 'workspace-1' } as never,
        {
          fullName: 'Student One',
          email: 'student@example.com',
        },
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
