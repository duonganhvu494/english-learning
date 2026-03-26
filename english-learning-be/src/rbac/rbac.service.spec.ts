import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { WorkspaceEntitlementService } from 'src/workspaces/workspace-entitlement.service';
import { RbacService } from './rbac.service';
import { Role } from './entities/role.entity';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';
import { WorkspaceMember } from 'src/workspaces/entities/workspace-member.entity';
import { User } from 'src/users/entities/user.entity';
import { WorkspaceAccessService } from './workspace-access.service';
import { ClassStudent } from 'src/classes/entities/class-student.entity';

describe('RbacService', () => {
  let service: RbacService;
  const roleRepo = {
    findOne: jest.fn(),
  };
  const permissionRepo = {};
  const rolePermissionRepo = {};
  const memberRepo = {};
  const classStudentRepo = {};
  const classRepo = {};
  const userRepo = {};
  const workspaceAccessService = {
    getWorkspaceOrThrow: jest.fn(),
    getClassOrThrow: jest.fn(),
  };
  const workspaceEntitlementService = {
    assertFeatureEnabled: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepo,
        },
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionRepo,
        },
        {
          provide: getRepositoryToken(RolePermission),
          useValue: rolePermissionRepo,
        },
        {
          provide: getRepositoryToken(WorkspaceMember),
          useValue: memberRepo,
        },
        {
          provide: getRepositoryToken(ClassStudent),
          useValue: classStudentRepo,
        },
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: classRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: WorkspaceAccessService,
          useValue: workspaceAccessService,
        },
        {
          provide: WorkspaceEntitlementService,
          useValue: workspaceEntitlementService,
        },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('blocks workspace custom role creation when the current plan disables custom roles', async () => {
    workspaceAccessService.getWorkspaceOrThrow.mockResolvedValue({
      id: 'workspace-1',
    });
    workspaceEntitlementService.assertFeatureEnabled.mockRejectedValue(
      new ForbiddenException(
        'Current workspace plan does not allow custom roles',
      ),
    );

    await expect(
      service.createCustomRole('workspace-1', {
        name: 'Observer',
        description: 'Read only',
        permissionKeys: [],
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(roleRepo.findOne).not.toHaveBeenCalled();
  });

  it('blocks class custom role creation when the workspace plan disables custom roles', async () => {
    workspaceAccessService.getClassOrThrow.mockResolvedValue({
      id: 'class-1',
      workspace: { id: 'workspace-1' },
    });
    workspaceEntitlementService.assertFeatureEnabled.mockRejectedValue(
      new ForbiddenException(
        'Current workspace plan does not allow custom roles',
      ),
    );

    await expect(
      service.createClassCustomRole('class-1', {
        name: 'Class Observer',
        description: 'Read only',
        permissionKeys: [],
      }),
    ).rejects.toThrow(ForbiddenException);

    expect(roleRepo.findOne).not.toHaveBeenCalled();
  });
});
