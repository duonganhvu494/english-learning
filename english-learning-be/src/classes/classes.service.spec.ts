import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from 'src/rbac/entities/role.entity';
import { RbacService } from 'src/rbac/rbac.service';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import {
  WorkspaceMember,
  WorkspaceMemberStatus,
} from 'src/workspaces/entities/workspace-member.entity';
import { AccountType } from 'src/users/entities/user.entity';
import { ClassesService } from './classes.service';
import { ClassEntity } from './entities/class.entity';
import { ClassStudent } from './entities/class-student.entity';

describe('ClassesService', () => {
  let service: ClassesService;
  const classRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    manager: {},
  };
  const managerClassStudentRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const classStudentRepo = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    manager: {
      transaction: jest.fn(),
    },
  };
  const roleRepo = {
    findOne: jest.fn(),
  };
  const memberRepo = {
    find: jest.fn(),
  };
  const workspaceAccessService = {
    assertTeacherWorkspaceOwner: jest.fn(),
    assertTeacherClassOwner: jest.fn(),
  };
  const rbacService = {
    ensureDefaultClassStudentRole: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    classRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    managerClassStudentRepo.create.mockImplementation(
      (input: Record<string, unknown>) => input,
    );
    classStudentRepo.manager.transaction.mockImplementation(
      async (
        callback: (manager: {
          getRepository: jest.Mock;
        }) => Promise<unknown>,
      ) => {
        return await callback({
          getRepository: jest.fn().mockReturnValue(managerClassStudentRepo),
        });
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: classRepo,
        },
        {
          provide: getRepositoryToken(ClassStudent),
          useValue: classStudentRepo,
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
          provide: WorkspaceAccessService,
          useValue: workspaceAccessService,
        },
        {
          provide: RbacService,
          useValue: rbacService,
        },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a class, normalizes text fields, and ensures the default student role', async () => {
    workspaceAccessService.assertTeacherWorkspaceOwner.mockResolvedValue({
      id: 'workspace-1',
    });
    classRepo.findOne.mockResolvedValue(null);
    classRepo.save.mockResolvedValue({
      id: 'class-1',
      className: 'Grammar A',
      description: 'Morning class',
      workspace: { id: 'workspace-1' },
    });
    rbacService.ensureDefaultClassStudentRole.mockResolvedValue({
      id: 'role-student',
      name: 'student',
    });

    const result = await service.createClass(
      'workspace-1',
      {
        className: '  Grammar A  ',
        description: '  Morning class  ',
      },
      'owner-1',
    );

    expect(classRepo.create).toHaveBeenCalledWith({
      className: 'Grammar A',
      description: 'Morning class',
      workspace: { id: 'workspace-1' },
    });
    expect(rbacService.ensureDefaultClassStudentRole).toHaveBeenCalledWith(
      'class-1',
    );
    expect(result).toEqual({
      id: 'class-1',
      className: 'Grammar A',
      description: 'Morning class',
      workspaceId: 'workspace-1',
      studentCount: 0,
    });
  });

  it('rejects duplicate class names inside the same workspace', async () => {
    workspaceAccessService.assertTeacherWorkspaceOwner.mockResolvedValue({
      id: 'workspace-1',
    });
    classRepo.findOne.mockResolvedValue({ id: 'class-existing' });

    await expect(
      service.createClass(
        'workspace-1',
        { className: 'Grammar A' },
        'owner-1',
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'You already have a class with this name in this workspace',
      ),
    );
  });

  it('adds workspace students to a class and backfills the default class role', async () => {
    const classEntity = {
      id: 'class-1',
      workspace: { id: 'workspace-1' },
    };
    const student1 = {
      id: 'student-1',
      fullName: 'Student One',
      userName: 'student1',
      email: 'student1@example.com',
    };
    const student2 = {
      id: 'student-2',
      fullName: 'Student Two',
      userName: 'student2',
      email: 'student2@example.com',
    };
    const defaultRole = { id: 'role-student', name: 'student' };
    const existingAssignment = {
      classEntity,
      student: student2,
      role: null,
    };

    workspaceAccessService.assertTeacherClassOwner.mockResolvedValue(classEntity);
    memberRepo.find.mockResolvedValue([
      {
        user: student1,
        status: WorkspaceMemberStatus.ACTIVE,
      },
      {
        user: student2,
        status: WorkspaceMemberStatus.ACTIVE,
      },
    ]);
    rbacService.ensureDefaultClassStudentRole.mockResolvedValue(defaultRole);
    classStudentRepo.find
      .mockResolvedValueOnce([existingAssignment])
      .mockResolvedValueOnce([
        { student: student1 },
        { student: student2 },
      ]);
    managerClassStudentRepo.save.mockResolvedValue(undefined);

    const result = await service.addStudentsToClass(
      'class-1',
      { studentIds: ['student-1', 'student-2'] },
      'owner-1',
    );

    expect(managerClassStudentRepo.create).toHaveBeenCalledWith({
      classEntity,
      student: student1,
      role: defaultRole,
    });
    expect(managerClassStudentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        student: student1,
        role: defaultRole,
      }),
    );
    expect(managerClassStudentRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        student: student2,
        role: defaultRole,
      }),
    );
    expect(result).toEqual({
      classId: 'class-1',
      studentIds: ['student-1', 'student-2'],
    });
  });

  it('defaults a class student role back to the system student role when roleId is omitted', async () => {
    const defaultRole = { id: 'role-student', name: 'student' };
    classStudentRepo.findOne.mockResolvedValue({
      student: { id: 'student-1' },
      role: null,
    });
    workspaceAccessService.assertTeacherClassOwner.mockResolvedValue({
      id: 'class-1',
    });
    rbacService.ensureDefaultClassStudentRole.mockResolvedValue(defaultRole);
    classStudentRepo.save.mockResolvedValue({
      role: defaultRole,
    });

    const result = await service.updateClassStudentRole(
      'class-1',
      'student-1',
      {},
      'owner-1',
    );

    expect(rbacService.ensureDefaultClassStudentRole).toHaveBeenCalledWith(
      'class-1',
    );
    expect(result).toEqual({
      classId: 'class-1',
      studentId: 'student-1',
      roleId: 'role-student',
      roleName: 'student',
    });
  });

  it('rejects adding students that do not belong to the workspace', async () => {
    workspaceAccessService.assertTeacherClassOwner.mockResolvedValue({
      id: 'class-1',
      workspace: { id: 'workspace-1' },
    });
    memberRepo.find.mockResolvedValue([
      {
        user: {
          id: 'student-1',
          accountType: AccountType.STUDENT,
        },
      },
    ]);

    await expect(
      service.addStudentsToClass(
        'class-1',
        { studentIds: ['student-1', 'student-2'] },
        'owner-1',
      ),
    ).rejects.toThrow(
      new BadRequestException(
        'Students do not belong to workspace: student-2',
      ),
    );
  });
});
