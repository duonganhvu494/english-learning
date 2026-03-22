// src/workspaces/workspaces.controller.ts
import {
  Controller,
  Delete,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { CreateStudentDto } from 'src/users/dto/create-student.dto';
import { UpdateWorkspaceStudentDto } from './dto/update-workspace-student.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { ApiBusinessErrorResponses, ApiEnvelopeResponse } from 'src/common/swagger/swagger-response.decorator';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { WorkspaceMembershipResponseDto } from './dto/workspace-membership-response.dto';
import { WorkspaceDetailResponseDto } from './dto/workspace-detail-response.dto';
import { WorkspaceStudentResponseDto } from './dto/workspace-student-response.dto';
import { WorkspaceStudentListItemDto } from './dto/workspace-student-list-item.dto';
import { RemoveWorkspaceStudentResponseDto } from './dto/remove-workspace-student-response.dto';

@ApiTags('Workspaces')
@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly service: WorkspacesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create workspace',
    description: 'Creates a new workspace for the authenticated teacher/owner.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Workspace created successfully',
    model: WorkspaceResponseDto,
    exampleMessage: 'Workspace created',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440100',
      name: 'English Center Alpha',
      owner: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userName: 'teacher01',
        fullName: 'Duong Anh Vu',
        email: 'duonganhvu@example.com',
        mustChangePassword: false,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Only teacher account can create workspace' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    {
      status: 403,
      code: 'WORKSPACE_CREATE_TEACHER_ONLY',
      message: 'Only teacher account can create workspace',
    },
    {
      status: 400,
      code: 'WORKSPACE_OWNER_NOT_FOUND',
      message: 'User not found',
    },
    {
      status: 400,
      code: 'WORKSPACE_NAME_ALREADY_EXISTS',
      message: 'You already have a workspace with this name',
    },
    {
      status: 400,
      code: 'WORKSPACE_OWNER_ROLE_NOT_FOUND',
      message: 'Owner role not found',
    },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async create(
    @Body() dto: CreateWorkspaceDto,
    @Req() req: AuthRequest,
  ) {
    const workspace = await this.service.createWorkspace(
      dto,
      req.user.userId,
    );
    return ApiResponse.success(workspace, 'Workspace created', 201);
  }

  @Get('me')
  @ApiOperation({
    summary: 'List my workspaces',
    description: 'Returns all workspaces that the current user belongs to.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Workspaces retrieved successfully',
    model: WorkspaceMembershipResponseDto,
    isArray: true,
    exampleMessage: 'Success',
    exampleResult: [
      {
        workspaceId: '550e8400-e29b-41d4-a716-446655440100',
        workspaceName: 'English Center Alpha',
        role: 'owner',
      },
    ],
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
  ])
  async myWorkspaces(@Req() req: AuthRequest) {
    const result = await this.service.listMyWorkspaces(
      req.user.userId,
    );
    return ApiResponse.success(result);
  }

  @Get(':id')
  @UseGuards(RbacPermissionGuard)
  @RequirePermission('read', 'workspace', {
    scopeType: 'workspace',
    scopeIdParam: 'id',
  })
  @ApiOperation({
    summary: 'Get workspace detail',
    description:
      'Returns detail information of a workspace when the user has workspace read access.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Workspace detail retrieved successfully',
    model: WorkspaceDetailResponseDto,
    exampleMessage: 'Workspace detail retrieved',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440100',
      name: 'English Center Alpha',
      owner: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        userName: 'teacher01',
        fullName: 'Duong Anh Vu',
        email: 'duonganhvu@example.com',
        mustChangePassword: false,
      },
      isActive: true,
      currentUserRole: 'owner',
      studentCount: 28,
      classCount: 4,
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have access to this workspace' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_PERMISSION_DENIED', message: 'Permission access denied' },
    { status: 400, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
  ])
  async getDetail(
    @Param('id') workspaceId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.service.getWorkspaceDetail(
      workspaceId,
      req.user.userId,
    );
    return ApiResponse.success(result, 'Workspace detail retrieved');
  }

  @Post(':id/students')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], { scopeType: 'workspace', scopeIdParam: 'id' })
  @ApiOperation({
    summary: 'Create workspace student',
    description:
      'Creates a student account and adds it into the target workspace. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Workspace student created successfully',
    model: WorkspaceStudentResponseDto,
    exampleMessage: 'Student created and added to workspace',
    exampleResult: {
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      role: 'student',
      plainPassword: 'temp-pass-493',
      user: {
        id: '550e8400-e29b-41d4-a716-446655440010',
        userName: 'student01',
        fullName: 'Nguyen Van A',
        email: 'student01@example.com',
        mustChangePassword: true,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    {
      status: 400,
      code: 'WORKSPACE_STUDENT_EMAIL_ALREADY_EXISTS',
      message: 'Email already exists',
    },
    {
      status: 400,
      code: 'WORKSPACE_STUDENT_USERNAME_ALREADY_EXISTS',
      message: 'Username already exists',
    },
    { status: 400, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async createStudent(
    @Param('id') workspaceId: string,
    @Body() dto: CreateStudentDto
  ) {
    const student = await this.service.createStudentInWorkspace(
      workspaceId,
      dto,
    );
    return ApiResponse.success(
      student,
      'Student created and added to workspace',
      201,
    );
  }

  @Get(':id/students')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], { scopeType: 'workspace', scopeIdParam: 'id' })
  @ApiOperation({
    summary: 'List workspace students',
    description: 'Returns all students belonging to a workspace. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Workspace students retrieved successfully',
    model: WorkspaceStudentListItemDto,
    isArray: true,
    exampleMessage: 'Workspace students retrieved',
    exampleResult: [
      {
        studentId: '550e8400-e29b-41d4-a716-446655440010',
        fullName: 'Nguyen Van A',
        userName: 'student01',
        email: 'student01@example.com',
        role: 'student',
        status: 'active',
      },
    ],
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 400, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
  ])
  async listStudents(
    @Param('id') workspaceId: string,
  ) {
    const students = await this.service.listWorkspaceStudents(
      workspaceId,
    );
    return ApiResponse.success(students, 'Workspace students retrieved');
  }

  @Patch(':id/students/:studentId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], { scopeType: 'workspace', scopeIdParam: 'id' })
  @ApiOperation({
    summary: 'Update workspace student',
    description: 'Updates workspace student profile fields. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Workspace student updated successfully',
    model: WorkspaceStudentListItemDto,
    exampleMessage: 'Workspace student updated',
    exampleResult: {
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      fullName: 'Nguyen Van A',
      userName: 'student01',
      email: 'student01@example.com',
      role: 'student',
      status: 'active',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 400, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
    {
      status: 400,
      code: 'WORKSPACE_STUDENT_NOT_ASSIGNED',
      message: 'Student is not assigned to workspace',
    },
    {
      status: 400,
      code: 'WORKSPACE_STUDENT_EMAIL_ALREADY_EXISTS',
      message: 'Email already exists',
    },
    {
      status: 400,
      code: 'WORKSPACE_STUDENT_USERNAME_ALREADY_EXISTS',
      message: 'Username already exists',
    },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async updateStudent(
    @Param('id') workspaceId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateWorkspaceStudentDto,
  ) {
    const result = await this.service.updateWorkspaceStudent(
      workspaceId,
      studentId,
      dto,
    );
    return ApiResponse.success(result, 'Workspace student updated');
  }

  @Delete(':id/students/:studentId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], { scopeType: 'workspace', scopeIdParam: 'id' })
  @ApiOperation({
    summary: 'Remove workspace student',
    description: 'Removes a student from the workspace. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Workspace student removed successfully',
    model: RemoveWorkspaceStudentResponseDto,
    exampleMessage: 'Student removed from workspace',
    exampleResult: {
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      removedClassCount: 2,
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    {
      status: 400,
      code: 'WORKSPACE_STUDENT_NOT_ASSIGNED',
      message: 'Student is not assigned to workspace',
    },
    { status: 400, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
  ])
  async removeStudent(
    @Param('id') workspaceId: string,
    @Param('studentId') studentId: string,
  ) {
    const result = await this.service.removeStudentFromWorkspace(
      workspaceId,
      studentId,
    );
    return ApiResponse.success(result, 'Student removed from workspace');
  }
}
