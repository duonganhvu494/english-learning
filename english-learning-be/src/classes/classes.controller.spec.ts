import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RbacService } from 'src/rbac/rbac.service';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { WorkspacePlanGuard } from 'src/rbac/guards/workspace-plan.guard';
import { WorkspaceEntitlementService } from 'src/workspaces/workspace-entitlement.service';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';

describe('ClassesController', () => {
  let controller: ClassesController;
  let classesService: {
    createClass: jest.Mock;
    listWorkspaceClasses: jest.Mock;
    getClassDetail: jest.Mock;
    getClassStudents: jest.Mock;
    addStudentsToClass: jest.Mock;
    createStudentForClass: jest.Mock;
    updateClass: jest.Mock;
    removeStudentFromClass: jest.Mock;
    deleteClass: jest.Mock;
    updateClassStudentRole: jest.Mock;
  };

  beforeEach(async () => {
    classesService = {
      createClass: jest.fn(),
      listWorkspaceClasses: jest.fn(),
      getClassDetail: jest.fn(),
      getClassStudents: jest.fn(),
      addStudentsToClass: jest.fn(),
      createStudentForClass: jest.fn(),
      updateClass: jest.fn(),
      removeStudentFromClass: jest.fn(),
      deleteClass: jest.fn(),
      updateClassStudentRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [
        {
          provide: ClassesService,
          useValue: classesService,
        },
        {
          provide: RbacPermissionGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: WorkspacePlanGuard,
          useValue: { canActivate: () => true },
        },
        {
          provide: WorkspaceEntitlementService,
          useValue: { assertWorkspaceHasUsablePlan: jest.fn() },
        },
        {
          provide: RbacService,
          useValue: {},
        },
        {
          provide: Reflector,
          useValue: {},
        },
        {
          provide: WorkspaceAccessService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ClassesController>(ClassesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates a class for the current owner', async () => {
    classesService.createClass.mockResolvedValue({ id: 'class-1' });

    const result = await controller.createClass(
      'workspace-1',
      { className: 'Grammar A' },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(classesService.createClass).toHaveBeenCalledWith(
      'workspace-1',
      { className: 'Grammar A' },
    );
    expect(result).toEqual({
      statusCode: 201,
      message: 'Class created',
      result: { id: 'class-1' },
    });
  });

  it('lists classes in a workspace', async () => {
    classesService.listWorkspaceClasses.mockResolvedValue([{ id: 'class-1' }]);

    const result = await controller.listWorkspaceClasses(
      'workspace-1',
      { user: { userId: 'owner-1' } } as never,
    );

    expect(classesService.listWorkspaceClasses).toHaveBeenCalledWith(
      'workspace-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Workspace classes fetched',
      result: [{ id: 'class-1' }],
    });
  });

  it('returns class detail', async () => {
    classesService.getClassDetail.mockResolvedValue({ id: 'class-1' });

    const result = await controller.getClassDetail(
      'class-1',
      { user: { userId: 'owner-1' } } as never,
    );

    expect(classesService.getClassDetail).toHaveBeenCalledWith('class-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'Class detail fetched',
      result: { id: 'class-1' },
    });
  });

  it('returns class roster', async () => {
    classesService.getClassStudents.mockResolvedValue({
      classId: 'class-1',
      students: [],
    });

    const result = await controller.getClassStudents(
      'class-1',
      { user: { userId: 'owner-1' } } as never,
    );

    expect(classesService.getClassStudents).toHaveBeenCalledWith('class-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'Class students fetched',
      result: {
        classId: 'class-1',
        students: [],
      },
    });
  });

  it('adds students to a class', async () => {
    classesService.addStudentsToClass.mockResolvedValue({
      classId: 'class-1',
      studentIds: ['student-1'],
    });

    const result = await controller.addStudentsToClass(
      'class-1',
      { studentIds: ['student-1'] },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(classesService.addStudentsToClass).toHaveBeenCalledWith(
      'class-1',
      { studentIds: ['student-1'] },
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Students added to class',
      result: {
        classId: 'class-1',
        studentIds: ['student-1'],
      },
    });
  });

  it('creates a student and adds the student to a class', async () => {
    classesService.createStudentForClass.mockResolvedValue({
      classId: 'class-1',
      workspaceId: 'workspace-1',
      workspaceRole: 'student',
      classRoleId: 'role-student',
      classRoleName: 'student',
      plainPassword: 'temp-pass-493',
      user: { id: 'student-1' },
    });

    const result = await controller.createStudentForClass(
      'class-1',
      {
        fullName: 'Student One',
        email: 'student@example.com',
        userName: 'student1',
      },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(classesService.createStudentForClass).toHaveBeenCalledWith(
      'class-1',
      {
        fullName: 'Student One',
        email: 'student@example.com',
        userName: 'student1',
      },
    );
    expect(result).toEqual({
      statusCode: 201,
      message: 'Student created and added to class',
      result: {
        classId: 'class-1',
        workspaceId: 'workspace-1',
        workspaceRole: 'student',
        classRoleId: 'role-student',
        classRoleName: 'student',
        plainPassword: 'temp-pass-493',
        user: { id: 'student-1' },
      },
    });
  });

  it('updates a class', async () => {
    classesService.updateClass.mockResolvedValue({ id: 'class-1' });

    const result = await controller.updateClass(
      'class-1',
      { description: 'Updated description' },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(classesService.updateClass).toHaveBeenCalledWith(
      'class-1',
      { description: 'Updated description' },
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Class updated',
      result: { id: 'class-1' },
    });
  });

  it('removes a student from a class', async () => {
    classesService.removeStudentFromClass.mockResolvedValue({
      classId: 'class-1',
      studentIds: [],
    });

    const result = await controller.removeStudentFromClass(
      'class-1',
      'student-1',
      { user: { userId: 'owner-1' } } as never,
    );

    expect(classesService.removeStudentFromClass).toHaveBeenCalledWith(
      'class-1',
      'student-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Student removed from class',
      result: {
        classId: 'class-1',
        studentIds: [],
      },
    });
  });

  it('deletes a class', async () => {
    classesService.deleteClass.mockResolvedValue({ classId: 'class-1' });

    const result = await controller.deleteClass(
      'class-1',
      { user: { userId: 'owner-1' } } as never,
    );

    expect(classesService.deleteClass).toHaveBeenCalledWith('class-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'Class deleted',
      result: { classId: 'class-1' },
    });
  });

  it('updates a class student role', async () => {
    classesService.updateClassStudentRole.mockResolvedValue({
      classId: 'class-1',
      studentId: 'student-1',
      roleId: 'role-1',
      roleName: 'monitor',
    });

    const result = await controller.updateClassStudentRole(
      'class-1',
      'student-1',
      { roleId: 'role-1' },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(classesService.updateClassStudentRole).toHaveBeenCalledWith(
      'class-1',
      'student-1',
      { roleId: 'role-1' },
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Class student role updated',
      result: {
        classId: 'class-1',
        studentId: 'student-1',
        roleId: 'role-1',
        roleName: 'monitor',
      },
    });
  });
});
