import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { ApiBusinessErrorResponses, ApiEnvelopeResponse } from 'src/common/swagger/swagger-response.decorator';
import { RequireRoles } from './decorators/require-roles.decorator';
import { CreateClassRoleDto } from './dto/create-class-role.dto';
import { CustomRoleResponseDto } from './dto/custom-role-response.dto';
import { DeleteRoleResponseDto } from './dto/delete-role-response.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';
import { RbacPermissionGuard } from './guards/rbac-permission.guard';
import { RbacService } from './rbac.service';

@ApiTags('Class Roles')
@Controller('classes/:classId/roles')
@UseGuards(JwtAuthGuard)
export class ClassRolesController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'List class custom roles',
    description: 'Returns all custom roles in a class. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Class custom roles retrieved successfully',
    model: CustomRoleResponseDto,
    isArray: true,
    exampleMessage: 'Class roles retrieved',
    exampleResult: [
      {
        id: '550e8400-e29b-41d4-a716-446655440310',
        name: 'assistant',
        description: 'Supports attendance and assignment review',
        workspaceId: null,
        classId: '550e8400-e29b-41d4-a716-446655440200',
        isSystem: false,
        permissions: [
          {
            id: '550e8400-e29b-41d4-a716-446655440101',
            action: 'update',
            resource: 'attendance',
            description: 'Allows updating attendance',
            key: 'update:attendance',
          },
        ],
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
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
  ])
  async listClassRoles(
    @Param('classId') classId: string,
  ) {
    const roles = await this.rbacService.listClassCustomRoles(classId);

    return ApiResponse.success(roles, 'Class roles retrieved');
  }

  @Post()
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'Create class custom role',
    description: 'Creates a custom role in a class. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Class custom role created successfully',
    model: CustomRoleResponseDto,
    exampleMessage: 'Class role created',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440310',
      name: 'assistant',
      description: 'Supports attendance and assignment review',
      workspaceId: null,
      classId: '550e8400-e29b-41d4-a716-446655440200',
      isSystem: false,
      permissions: [
        {
          id: '550e8400-e29b-41d4-a716-446655440101',
          action: 'update',
          resource: 'attendance',
          description: 'Allows updating attendance',
          key: 'update:attendance',
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
    {
      status: 400,
      code: 'RBAC_CLASS_ROLE_NAME_EXISTS',
      message: 'Role name already exists in this class',
    },
    {
      status: 400,
      code: 'RBAC_ROLE_NAME_CONFLICTS_SYSTEM',
      message: 'Role name conflicts with reserved system role',
    },
    {
      status: 400,
      code: 'RBAC_PERMISSION_KEY_INVALID',
      message: 'Invalid permission key',
    },
    {
      status: 400,
      code: 'RBAC_PERMISSION_NOT_FOUND',
      message: 'Permission not found',
    },
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async createClassRole(
    @Param('classId') classId: string,
    @Body() dto: CreateClassRoleDto,
  ) {
    const role = await this.rbacService.createClassCustomRole(classId, dto);

    return ApiResponse.success(role, 'Class role created', 201);
  }

  @Patch(':roleId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'Update class custom role',
    description: 'Updates a class custom role. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Class custom role updated successfully',
    model: CustomRoleResponseDto,
    exampleMessage: 'Class role updated',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440310',
      name: 'assistant',
      description: 'Updated class role description',
      workspaceId: null,
      classId: '550e8400-e29b-41d4-a716-446655440200',
      isSystem: false,
      permissions: [
        {
          id: '550e8400-e29b-41d4-a716-446655440101',
          action: 'update',
          resource: 'attendance',
          description: 'Allows updating attendance',
          key: 'update:attendance',
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
    {
      status: 400,
      code: 'RBAC_CLASS_CUSTOM_ROLE_NOT_FOUND',
      message: 'Class custom role not found',
    },
    {
      status: 400,
      code: 'RBAC_DEFAULT_CLASS_ROLE_IMMUTABLE',
      message: 'Default class student role can not be updated or deleted',
    },
    {
      status: 400,
      code: 'RBAC_ROLE_NAME_REQUIRED',
      message: 'Role name can not be empty',
    },
    {
      status: 400,
      code: 'RBAC_CLASS_ROLE_NAME_EXISTS',
      message: 'Role name already exists in this class',
    },
    {
      status: 400,
      code: 'RBAC_ROLE_NAME_CONFLICTS_SYSTEM',
      message: 'Role name conflicts with reserved system role',
    },
    {
      status: 400,
      code: 'RBAC_PERMISSION_KEY_INVALID',
      message: 'Invalid permission key',
    },
    {
      status: 400,
      code: 'RBAC_PERMISSION_NOT_FOUND',
      message: 'Permission not found',
    },
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async updateClassRole(
    @Param('classId') classId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateCustomRoleDto,
  ) {
    const role = await this.rbacService.updateClassCustomRole(classId, roleId, dto);

    return ApiResponse.success(role, 'Class role updated');
  }

  @Delete(':roleId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'Delete class custom role',
    description: 'Deletes a class custom role. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Class custom role deleted successfully',
    model: DeleteRoleResponseDto,
    exampleMessage: 'Class role deleted',
    exampleResult: {
      roleId: '550e8400-e29b-41d4-a716-446655440310',
      workspaceId: null,
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
    {
      status: 400,
      code: 'RBAC_CLASS_CUSTOM_ROLE_NOT_FOUND',
      message: 'Class custom role not found',
    },
    {
      status: 400,
      code: 'RBAC_DEFAULT_CLASS_ROLE_IMMUTABLE',
      message: 'Default class student role can not be updated or deleted',
    },
    {
      status: 400,
      code: 'RBAC_CLASS_CUSTOM_ROLE_ASSIGNED',
      message:
        'Cannot delete class role while it is still assigned to class students',
    },
    { status: 400, code: 'CLASS_NOT_FOUND', message: 'Class not found' },
  ])
  async deleteClassRole(
    @Param('classId') classId: string,
    @Param('roleId') roleId: string,
  ) {
    const result = await this.rbacService.deleteClassCustomRole(classId, roleId);

    return ApiResponse.success(result, 'Class role deleted');
  }
}
