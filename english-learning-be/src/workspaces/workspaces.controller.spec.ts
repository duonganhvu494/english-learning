import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { RbacService } from 'src/rbac/rbac.service';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;
  let workspacesService: {
    createWorkspace: jest.Mock;
    listMyWorkspaces: jest.Mock;
    getWorkspaceDetail: jest.Mock;
    createStudentInWorkspace: jest.Mock;
    listWorkspaceStudents: jest.Mock;
    updateWorkspaceStudent: jest.Mock;
    removeStudentFromWorkspace: jest.Mock;
  };

  beforeEach(async () => {
    workspacesService = {
      createWorkspace: jest.fn(),
      listMyWorkspaces: jest.fn(),
      getWorkspaceDetail: jest.fn(),
      createStudentInWorkspace: jest.fn(),
      listWorkspaceStudents: jest.fn(),
      updateWorkspaceStudent: jest.fn(),
      removeStudentFromWorkspace: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        {
          provide: WorkspacesService,
          useValue: workspacesService,
        },
        {
          provide: RbacPermissionGuard,
          useValue: { canActivate: () => true },
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

    controller = module.get<WorkspacesController>(WorkspacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates a workspace for the current teacher', async () => {
    workspacesService.createWorkspace.mockResolvedValue({ id: 'workspace-1' });

    const result = await controller.create(
      { name: 'English Center' },
      { user: { userId: 'teacher-1' } } as never,
    );

    expect(workspacesService.createWorkspace).toHaveBeenCalledWith(
      { name: 'English Center' },
      'teacher-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Workspace created',
      result: { id: 'workspace-1' },
    });
  });

  it('returns the current user workspaces', async () => {
    workspacesService.listMyWorkspaces.mockResolvedValue([
      { workspaceId: 'workspace-1' },
    ]);

    const result = await controller.myWorkspaces({
      user: { userId: 'teacher-1' },
    } as never);

    expect(workspacesService.listMyWorkspaces).toHaveBeenCalledWith(
      'teacher-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Success',
      result: [{ workspaceId: 'workspace-1' }],
    });
  });

  it('returns a workspace detail for the current member', async () => {
    workspacesService.getWorkspaceDetail.mockResolvedValue({
      id: 'workspace-1',
      currentUserRole: 'owner',
    });

    const result = await controller.getDetail(
      'workspace-1',
      { user: { userId: 'teacher-1' } } as never,
    );

    expect(workspacesService.getWorkspaceDetail).toHaveBeenCalledWith(
      'workspace-1',
      'teacher-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Workspace detail retrieved',
      result: {
        id: 'workspace-1',
        currentUserRole: 'owner',
      },
    });
  });

  it('creates a student inside a workspace', async () => {
    workspacesService.createStudentInWorkspace.mockResolvedValue({
      workspaceId: 'workspace-1',
      user: { id: 'student-1' },
    });

    const result = await controller.createStudent(
      'workspace-1',
      {
        fullName: 'Student One',
        email: 'student@example.com',
        userName: 'student1',
      },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(workspacesService.createStudentInWorkspace).toHaveBeenCalledWith(
      'workspace-1',
      {
        fullName: 'Student One',
        email: 'student@example.com',
        userName: 'student1',
      },
      'owner-1',
    );
    expect(result).toEqual({
      statusCode: 201,
      message: 'Student created and added to workspace',
      result: {
        workspaceId: 'workspace-1',
        user: { id: 'student-1' },
      },
    });
  });

  it('lists workspace students for the current owner', async () => {
    workspacesService.listWorkspaceStudents.mockResolvedValue([
      { studentId: 'student-1' },
    ]);

    const result = await controller.listStudents(
      'workspace-1',
      { user: { userId: 'owner-1' } } as never,
    );

    expect(workspacesService.listWorkspaceStudents).toHaveBeenCalledWith(
      'workspace-1',
      'owner-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Workspace students retrieved',
      result: [{ studentId: 'student-1' }],
    });
  });

  it('updates a workspace student', async () => {
    workspacesService.updateWorkspaceStudent.mockResolvedValue({
      studentId: 'student-1',
      fullName: 'Updated Student',
    });

    const result = await controller.updateStudent(
      'workspace-1',
      'student-1',
      { fullName: 'Updated Student' },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(workspacesService.updateWorkspaceStudent).toHaveBeenCalledWith(
      'workspace-1',
      'student-1',
      { fullName: 'Updated Student' },
      'owner-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Workspace student updated',
      result: {
        studentId: 'student-1',
        fullName: 'Updated Student',
      },
    });
  });

  it('removes a student from the workspace', async () => {
    workspacesService.removeStudentFromWorkspace.mockResolvedValue({
      workspaceId: 'workspace-1',
      studentId: 'student-1',
    });

    const result = await controller.removeStudent(
      'workspace-1',
      'student-1',
      { user: { userId: 'owner-1' } } as never,
    );

    expect(workspacesService.removeStudentFromWorkspace).toHaveBeenCalledWith(
      'workspace-1',
      'student-1',
      'owner-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Student removed from workspace',
      result: {
        workspaceId: 'workspace-1',
        studentId: 'student-1',
      },
    });
  });
});
