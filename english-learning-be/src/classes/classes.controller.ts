import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { AddClassStudentsDto } from './dto/add-class-students.dto';
import { ApiBusinessErrorResponses, ApiEnvelopeResponse } from 'src/common/swagger/swagger-response.decorator';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassStudentRoleDto } from './dto/update-class-student-role.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassesService } from './classes.service';
import { ClassResponseDto } from './dto/class-response.dto';
import { ClassRosterResponseDto } from './dto/class-roster-response.dto';
import { ClassStudentsResponseDto } from './dto/class-students-response.dto';
import { ClassDeleteResponseDto } from './dto/class-delete-response.dto';
import { ClassStudentRoleResponseDto } from './dto/class-student-role-response.dto';

@ApiTags('Classes')
@Controller()
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post('workspaces/:workspaceId/classes')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'Create class',
    description: 'Creates a class inside a workspace. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Class created successfully',
    model: ClassResponseDto,
    exampleMessage: 'Class created',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440200',
      className: 'Basic English 101',
      description: 'Foundation class for beginner students',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      studentCount: 0,
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
    { status: 400, code: 'CLASS_NAME_ALREADY_EXISTS', message: 'You already have a class with this name in this workspace' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async createClass(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateClassDto,
  ) {
    const classEntity = await this.classesService.createClass(
      workspaceId,
      dto,
    );

    return ApiResponse.success(classEntity, 'Class created', 201);
  }

  @Get('workspaces/:workspaceId/classes')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'List workspace classes',
    description: 'Returns all classes in a workspace. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Workspace classes retrieved successfully',
    model: ClassResponseDto,
    isArray: true,
    exampleMessage: 'Workspace classes fetched',
    exampleResult: [
      {
        id: '550e8400-e29b-41d4-a716-446655440200',
        className: 'Basic English 101',
        description: 'Foundation class for beginner students',
        workspaceId: '550e8400-e29b-41d4-a716-446655440100',
        studentCount: 15,
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
  async listWorkspaceClasses(
    @Param('workspaceId') workspaceId: string,
  ) {
    const result = await this.classesService.listWorkspaceClasses(
      workspaceId,
    );

    return ApiResponse.success(result, 'Workspace classes fetched');
  }

  @Get('classes/:classId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'Get class detail',
    description: 'Returns detail information of a class. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Class detail retrieved successfully',
    model: ClassResponseDto,
    exampleMessage: 'Class detail fetched',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440200',
      className: 'Basic English 101',
      description: 'Foundation class for beginner students',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      studentCount: 15,
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
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
  ])
  async getClassDetail(
    @Param('classId') classId: string,
  ) {
    const result = await this.classesService.getClassDetail(classId);

    return ApiResponse.success(result, 'Class detail fetched');
  }

  @Get('classes/:classId/students')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'List class students',
    description: 'Returns the roster of a class. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Class students retrieved successfully',
    model: ClassRosterResponseDto,
    exampleMessage: 'Class students fetched',
    exampleResult: {
      classId: '550e8400-e29b-41d4-a716-446655440200',
      students: [
        {
          studentId: '550e8400-e29b-41d4-a716-446655440010',
          fullName: 'Nguyen Van A',
          userName: 'student01',
          email: 'student01@example.com',
          classRoleId: null,
          classRoleName: null,
        },
      ],
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
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
  ])
  async getClassStudents(
    @Param('classId') classId: string,
  ) {
    const result = await this.classesService.getClassStudents(classId);

    return ApiResponse.success(result, 'Class students fetched');
  }

  @Post('classes/:classId/students')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'Add students to class',
    description: 'Adds existing workspace students into a class. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Students added to class successfully',
    model: ClassStudentsResponseDto,
    exampleMessage: 'Students added to class',
    exampleResult: {
      classId: '550e8400-e29b-41d4-a716-446655440200',
      studentIds: [
        '550e8400-e29b-41d4-a716-446655440010',
        '550e8400-e29b-41d4-a716-446655440011',
      ],
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
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async addStudentsToClass(
    @Param('classId') classId: string,
    @Body() dto: AddClassStudentsDto,
  ) {
    const result = await this.classesService.addStudentsToClass(
      classId,
      dto,
    );

    return ApiResponse.success(result, 'Students added to class');
  }

  @Patch('classes/:classId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'Update class',
    description: 'Updates class information. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Class updated successfully',
    model: ClassResponseDto,
    exampleMessage: 'Class updated',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440200',
      className: 'Basic English 101',
      description: 'Updated class description',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      studentCount: 15,
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
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
    { status: 400, code: 'CLASS_NAME_ALREADY_EXISTS', message: 'You already have a class with this name in this workspace' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async updateClass(
    @Param('classId') classId: string,
    @Body() dto: UpdateClassDto,
  ) {
    const result = await this.classesService.updateClass(
      classId,
      dto,
    );

    return ApiResponse.success(result, 'Class updated');
  }

  @Delete('classes/:classId/students/:studentId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'Remove student from class',
    description: 'Removes a student from a class. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Student removed from class successfully',
    model: ClassStudentsResponseDto,
    exampleMessage: 'Student removed from class',
    exampleResult: {
      classId: '550e8400-e29b-41d4-a716-446655440200',
      studentIds: [
        '550e8400-e29b-41d4-a716-446655440011',
      ],
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
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
  ])
  async removeStudentFromClass(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    const result = await this.classesService.removeStudentFromClass(
      classId,
      studentId,
    );

    return ApiResponse.success(result, 'Student removed from class');
  }

  @Delete('classes/:classId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'Delete class',
    description: 'Deletes a class. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Class deleted successfully',
    model: ClassDeleteResponseDto,
    exampleMessage: 'Class deleted',
    exampleResult: {
      classId: '550e8400-e29b-41d4-a716-446655440200',
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
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
  ])
  async deleteClass(
    @Param('classId') classId: string,
  ) {
    const result = await this.classesService.deleteClass(classId);

    return ApiResponse.success(result, 'Class deleted');
  }

  @Patch('classes/:classId/students/:studentId/role')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'Update class student role',
    description:
      'Updates the class role of a student. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Class student role updated successfully',
    model: ClassStudentRoleResponseDto,
    exampleMessage: 'Class student role updated',
    exampleResult: {
      classId: '550e8400-e29b-41d4-a716-446655440200',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      roleId: '550e8400-e29b-41d4-a716-446655440300',
      roleName: 'assistant',
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
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
    { status: 400, code: 'CLASS_ROLE_NOT_FOUND', message: 'Class role not found' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async updateClassStudentRole(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateClassStudentRoleDto,
  ) {
    const result = await this.classesService.updateClassStudentRole(
      classId,
      studentId,
      dto,
    );

    return ApiResponse.success(result, 'Class student role updated');
  }
}
