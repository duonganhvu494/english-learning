import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkspacesService } from './workspaces.service';
import { Workspace } from './entities/workspace.entity';
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from './entities/workspace-member.entity';
import {
  WorkspaceSubscriptionSource,
  WorkspaceSubscription,
  WorkspaceSubscriptionStatus,
} from './entities/workspace-subscription.entity';
import { Plan } from './entities/plan.entity';
import { User, AccountType } from 'src/users/entities/user.entity';
import { Role } from 'src/rbac/entities/role.entity';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { WorkspaceEntitlementService } from './workspace-entitlement.service';
import { WorkspaceStudentsService } from './workspace-students.service';

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
  const planRepo = {
    findOne: jest.fn(),
  };
  const workspaceSubscriptionRepo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };
  const classRepo = {
    count: jest.fn(),
  };
  const workspaceAccessService = {
    getWorkspaceOrThrow: jest.fn(),
  };
  const workspaceEntitlementService = {
    assertStudentQuotaAvailable: jest.fn(),
  };
  const workspaceStudentsService = {
    provisionWorkspaceStudent: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    workspaceRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    memberRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    workspaceSubscriptionRepo.create.mockImplementation(
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
          provide: getRepositoryToken(Plan),
          useValue: planRepo,
        },
        {
          provide: getRepositoryToken(WorkspaceSubscription),
          useValue: workspaceSubscriptionRepo,
        },
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: classRepo,
        },
        {
          provide: WorkspaceAccessService,
          useValue: workspaceAccessService,
        },
        {
          provide: WorkspaceEntitlementService,
          useValue: workspaceEntitlementService,
        },
        {
          provide: WorkspaceStudentsService,
          useValue: workspaceStudentsService,
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
    const freePlan = { id: 'plan-free', code: 'free', name: 'Free' };
    const savedWorkspace = {
      id: 'workspace-1',
      name: 'English Center',
      owner: teacher,
      isActive: true,
    };

    userRepo.findOne.mockResolvedValue(teacher);
    workspaceRepo.findOne.mockResolvedValue(null);
    roleRepo.findOne.mockResolvedValue(ownerRole);
    planRepo.findOne.mockResolvedValue(freePlan);
    workspaceRepo.save.mockResolvedValue(savedWorkspace);
    memberRepo.save.mockResolvedValue(undefined);
    workspaceSubscriptionRepo.save.mockResolvedValue(undefined);

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
    expect(workspaceSubscriptionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace: savedWorkspace,
        plan: freePlan,
        status: WorkspaceSubscriptionStatus.ACTIVE,
        startedAt: expect.any(Date),
        endedAt: null,
        source: WorkspaceSubscriptionSource.WORKSPACE_CREATION,
        paymentTransactionId: null,
        note: 'Assigned free plan on workspace creation',
      }),
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
    });
  });

  it('rejects workspace creation for non-teacher accounts', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'student-1',
      accountType: AccountType.STUDENT,
    });

    await expect(
      service.createWorkspace(
        { name: 'English Center' },
        'student-1',
      ),
    ).rejects.toThrow(
      new ForbiddenException('Only teacher account can create workspace'),
    );
  });

  it('rejects creating a second workspace for the same teacher', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'teacher-1',
      accountType: AccountType.TEACHER,
    });
    workspaceRepo.findOne.mockResolvedValue({ id: 'workspace-existing' });

    await expect(
      service.createWorkspace(
        { name: 'English Center' },
        'teacher-1',
      ),
    ).rejects.toThrow(
      new BadRequestException('Each teacher can own only one workspace'),
    );
  });

  it('rejects workspace creation when the default plan is missing', async () => {
    const teacher = {
      id: 'teacher-1',
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
    planRepo.findOne.mockResolvedValue(null);

    await expect(
      service.createWorkspace(
        { name: 'English Center' },
        'teacher-1',
      ),
    ).rejects.toThrow(
      new BadRequestException('Default workspace plan not found'),
    );
  });

  it('maps owner unique violation to a business error when concurrent create happens', async () => {
    const teacher = {
      id: 'teacher-1',
      accountType: AccountType.TEACHER,
    };
    const ownerRole = { id: 'role-owner', name: 'owner' };
    const freePlan = { id: 'plan-free', code: 'free', name: 'Free' };

    userRepo.findOne.mockResolvedValue(teacher);
    workspaceRepo.findOne.mockResolvedValue(null);
    roleRepo.findOne.mockResolvedValue(ownerRole);
    planRepo.findOne.mockResolvedValue(freePlan);
    workspaceRepo.save.mockRejectedValue({ code: '23505' });

    await expect(
      service.createWorkspace(
        { name: 'English Center' },
        'teacher-1',
      ),
    ).rejects.toThrow(
      new BadRequestException('Each teacher can own only one workspace'),
    );
  });

  it('blocks student creation when the current plan has reached its student quota', async () => {
    workspaceAccessService.getWorkspaceOrThrow.mockResolvedValue({
      id: 'workspace-1',
    });
    workspaceEntitlementService.assertStudentQuotaAvailable.mockRejectedValue(
      new ForbiddenException('Current workspace plan allows up to 30 students'),
    );

    await expect(
      service.createStudentInWorkspace('workspace-1', {
        fullName: 'Student One',
        userName: 'student1',
        email: 'student1@example.com',
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(workspaceStudentsService.provisionWorkspaceStudent).not.toHaveBeenCalled();
  });

  it('returns the current workspace subscription for the owning teacher', async () => {
    const workspace = {
      id: 'workspace-1',
    };
    const subscription = {
      id: 'subscription-1',
      workspace,
      status: WorkspaceSubscriptionStatus.ACTIVE,
      startedAt: new Date('2026-03-25T10:00:00.000Z'),
      endedAt: null,
      trialEndsAt: null,
      cancelledAt: null,
      source: WorkspaceSubscriptionSource.WORKSPACE_CREATION,
      paymentTransactionId: null,
      note: 'Assigned free plan on workspace creation',
      plan: {
        id: 'plan-free',
        code: 'free',
        name: 'Free',
        description: 'Basic plan for small classes',
        monthlyPriceCents: 0,
        isPublic: true,
        isActive: true,
        sortOrder: 1,
        features: [],
      },
    };

    workspaceRepo.findOne.mockResolvedValue(workspace);
    workspaceSubscriptionRepo.findOne.mockResolvedValue(subscription);

    const result = await service.getMyWorkspaceSubscription('teacher-1');

    expect(workspaceRepo.findOne).toHaveBeenCalledWith({
      where: {
        owner: { id: 'teacher-1' },
      },
    });
    expect(workspaceSubscriptionRepo.findOne).toHaveBeenCalledWith({
      where: [
        {
          workspace: { id: 'workspace-1' },
          endedAt: expect.any(Object),
        },
        {
          workspace: { id: 'workspace-1' },
          endedAt: expect.any(Object),
        },
      ],
      relations: {
        workspace: true,
        plan: {
          features: true,
        },
      },
      order: {
        endedAt: 'DESC',
      },
    });
    expect(result).toEqual({
      id: 'subscription-1',
      workspaceId: 'workspace-1',
      status: WorkspaceSubscriptionStatus.ACTIVE,
      startedAt: '2026-03-25T10:00:00.000Z',
      endedAt: null,
      trialEndsAt: null,
      cancelledAt: null,
      source: WorkspaceSubscriptionSource.WORKSPACE_CREATION,
      paymentTransactionId: null,
      note: 'Assigned free plan on workspace creation',
      plan: {
        id: 'plan-free',
        code: 'free',
        name: 'Free',
        description: 'Basic plan for small classes',
        monthlyPriceCents: 0,
        isPublic: true,
        isActive: true,
        sortOrder: 1,
        features: [],
      },
    });
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

  it('returns the current workspace detail using the owner membership first', async () => {
    memberRepo.find.mockResolvedValue([
      {
        workspace: {
          id: 'workspace-2',
          name: 'Beta Center',
        },
        role: { name: 'teacher' },
      },
      {
        workspace: {
          id: 'workspace-1',
          name: 'Alpha Center',
        },
        role: { name: 'owner' },
      },
    ]);

    const getWorkspaceDetailSpy = jest
      .spyOn(service, 'getWorkspaceDetail')
      .mockResolvedValue({
        id: 'workspace-1',
        name: 'Alpha Center',
        owner: {
          id: 'teacher-1',
          userName: 'teacher1',
          fullName: 'Teacher One',
          email: 'teacher@example.com',
        },
        isActive: true,
        currentUserRole: 'owner',
        studentCount: 10,
        classCount: 2,
      });

    const result = await service.getMyWorkspace('teacher-1');

    expect(getWorkspaceDetailSpy).toHaveBeenCalledWith(
      'workspace-1',
      'teacher-1',
    );
    expect(result).toEqual({
      id: 'workspace-1',
      name: 'Alpha Center',
      owner: {
        id: 'teacher-1',
        userName: 'teacher1',
        fullName: 'Teacher One',
        email: 'teacher@example.com',
      },
      isActive: true,
      currentUserRole: 'owner',
      studentCount: 10,
      classCount: 2,
    });
  });

  it('throws when the current user does not belong to any workspace', async () => {
    memberRepo.find.mockResolvedValue([]);

    await expect(service.getMyWorkspace('teacher-1')).rejects.toThrow(
      new BadRequestException('Current workspace not found'),
    );
  });
});
