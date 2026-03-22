import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkspacesService } from './workspaces.service';
import { Workspace } from './entities/workspace.entity';
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from './entities/workspace-member.entity';
import { User, AccountType } from 'src/users/entities/user.entity';
import { Role } from 'src/rbac/entities/role.entity';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { ClassEntity } from 'src/classes/entities/class.entity';

describe('WorkspacesService', () => {
  let service: WorkspacesService;
  const workspaceRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    manager: {},
  };
  const memberRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const userRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };
  const roleRepo = {
    findOne: jest.fn(),
  };
  const classRepo = {
    count: jest.fn(),
  };
  const workspaceAccessService = {
    getWorkspaceOrThrow: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    workspaceRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    memberRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    memberRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspacesService,
        {
          provide: getRepositoryToken(Workspace),
          useValue: workspaceRepo,
        },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: memberRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepo,
        },
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: classRepo,
        },
        {
          provide: WorkspaceAccessService,
          useValue: workspaceAccessService,
        },
      ],
    }).compile();

    service = module.get<WorkspacesService>(WorkspacesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a workspace and assigns the system owner role to the creator', async () => {
    const teacher = {
      id: 'teacher-1',
      userName: 'teacher1',
      fullName: 'Teacher One',
      email: 'teacher@example.com',
      accountType: AccountType.TEACHER,
    };
    const ownerRole = { id: 'role-owner', name: 'owner' };
    const savedWorkspace = {
      id: 'workspace-1',
      name: 'English Center',
      owner: teacher,
      isActive: true,
    };

    userRepo.findOne.mockResolvedValue(teacher);
    workspaceRepo.findOne.mockResolvedValue(null);
    workspaceRepo.save.mockResolvedValue(savedWorkspace);
    roleRepo.findOne.mockResolvedValue(ownerRole);
    memberRepo.save.mockResolvedValue(undefined);

    const result = await service.createWorkspace(
      { name: 'English Center' },
      'teacher-1',
    );

    expect(workspaceRepo.create).toHaveBeenCalledWith({
      name: 'English Center',
      owner: teacher,
      isActive: true,
    });
    expect(memberRepo.create).toHaveBeenCalledWith({
      workspace: savedWorkspace,
      user: teacher,
      role: ownerRole,
    });
    expect(result).toEqual({
      id: 'workspace-1',
      name: 'English Center',
      owner: {
        id: 'teacher-1',
        userName: 'teacher1',
        fullName: 'Teacher One',
        email: 'teacher@example.com',
      },
    });
  });

  it('rejects workspace creation for non-teacher accounts', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'student-1',
      accountType: AccountType.STUDENT,
    });

    await expect(
      service.createWorkspace({ name: 'English Center' }, 'student-1'),
    ).rejects.toThrow(
      new ForbiddenException('Only teacher account can create workspace'),
    );
  });

  it('rejects duplicate workspace names for the same owner', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'teacher-1',
      accountType: AccountType.TEACHER,
    });
    workspaceRepo.findOne.mockResolvedValue({ id: 'workspace-existing' });

    await expect(
      service.createWorkspace({ name: 'English Center' }, 'teacher-1'),
    ).rejects.toThrow(
      new BadRequestException('You already have a workspace with this name'),
    );
  });

  it('updates a workspace student profile and returns the mapped roster item', async () => {
    const member = {
      user: {
        id: 'student-1',
        fullName: 'Student One',
        userName: 'student1',
        email: 'student1@example.com',
      },
      role: { name: 'student' },
      status: WorkspaceMemberStatus.ACTIVE,
    };
    const savedUser = {
      ...member.user,
      fullName: 'Student Updated',
    };

    workspaceAccessService.getWorkspaceOrThrow.mockResolvedValue({
      id: 'workspace-1',
    });
    memberRepo.findOne.mockResolvedValue(member);
    userRepo.save.mockResolvedValue(savedUser);

    const result = await service.updateWorkspaceStudent(
      'workspace-1',
      'student-1',
      { fullName: 'Student Updated' },
    );

    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'student-1',
        fullName: 'Student Updated',
      }),
    );
    expect(result).toEqual({
      studentId: 'student-1',
      fullName: 'Student Updated',
      userName: 'student1',
      email: 'student1@example.com',
      role: 'student',
      status: WorkspaceMemberStatus.ACTIVE,
    });
  });

  it('rejects updating a workspace student to an email that already exists', async () => {
    workspaceAccessService.getWorkspaceOrThrow.mockResolvedValue({
      id: 'workspace-1',
    });
    memberRepo.findOne.mockResolvedValue({
      user: {
        id: 'student-1',
        fullName: 'Student One',
        userName: 'student1',
        email: 'student1@example.com',
      },
      role: { name: 'student' },
      status: WorkspaceMemberStatus.ACTIVE,
    });
    userRepo.findOne.mockResolvedValue({ id: 'other-user' });

    await expect(
      service.updateWorkspaceStudent(
        'workspace-1',
        'student-1',
        { email: 'taken@example.com' },
      ),
    ).rejects.toThrow(new BadRequestException('Email already exists'));
  });

  it('returns workspace detail for a super admin without workspace membership', async () => {
    workspaceRepo.findOne.mockResolvedValue({
      id: 'workspace-1',
      name: 'English Center',
      owner: {
        id: 'teacher-1',
        userName: 'teacher1',
        fullName: 'Teacher One',
        email: 'teacher@example.com',
      },
      isActive: true,
    });
    memberRepo.findOne.mockResolvedValue(null);
    userRepo.findOne.mockResolvedValue({
      id: 'super-admin-1',
      isSuperAdmin: true,
    });
    classRepo.count.mockResolvedValue(4);
    memberRepo.createQueryBuilder.mockReturnValue({
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(28),
    });

    const result = await service.getWorkspaceDetail(
      'workspace-1',
      'super-admin-1',
    );

    expect(result).toEqual({
      id: 'workspace-1',
      name: 'English Center',
      owner: {
        id: 'teacher-1',
        userName: 'teacher1',
        fullName: 'Teacher One',
        email: 'teacher@example.com',
      },
      isActive: true,
      currentUserRole: 'owner',
      studentCount: 28,
      classCount: 4,
    });
  });
});
