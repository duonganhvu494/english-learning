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
import { CreateCustomRoleDto } from './dto/create-custom-role.dto';
import { CustomRoleResponseDto } from './dto/custom-role-response.dto';
import { DeleteRoleResponseDto } from './dto/delete-role-response.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';
import { RbacPermissionGuard } from './guards/rbac-permission.guard';
import { RbacService } from './rbac.service';

@ApiTags('Workspace Roles')
@Controller('workspaces/:workspaceId/roles')
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'List workspace permissions',
    description: 'Returns all available permissions. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Permissions retrieved successfully',
    model: PermissionResponseDto,
    isArray: true,
    exampleMessage: 'Permissions retrieved',
    exampleResult: [
      {
        id: '550e8400-e29b-41d4-a716-446655440100',
        action: 'read',
        resource: 'assignment',
        description: 'Allows reading assignment resources',
        key: 'read:assignment',
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
  async listPermissions(
    @Param('workspaceId') workspaceId: string,
  ) {
    const permissions = await this.rbacService.listPermissions(workspaceId);

    return ApiResponse.success(permissions, 'Permissions retrieved');
  }

  @Get()
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'List workspace custom roles',
    description: 'Returns all custom roles in a workspace. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Workspace custom roles retrieved successfully',
    model: CustomRoleResponseDto,
    isArray: true,
    exampleMessage: 'Custom roles retrieved',
    exampleResult: [
      {
        id: '550e8400-e29b-41d4-a716-446655440110',
        name: 'teaching-assistant',
        description: 'Can read and manage assignment-related resources',
        workspaceId: '550e8400-e29b-41d4-a716-446655440100',
        classId: null,
        isSystem: false,
        permissions: [
          {
            id: '550e8400-e29b-41d4-a716-446655440100',
            action: 'read',
            resource: 'assignment',
            description: 'Allows reading assignment resources',
            key: 'read:assignment',
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
    { status: 400, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
  ])
  async listCustomRoles(
    @Param('workspaceId') workspaceId: string,
  ) {
    const roles = await this.rbacService.listCustomRoles(workspaceId);

    return ApiResponse.success(roles, 'Custom roles retrieved');
  }

  @Post()
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'Create workspace custom role',
    description: 'Creates a custom role in a workspace. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Workspace custom role created successfully',
    model: CustomRoleResponseDto,
    exampleMessage: 'Custom role created',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440110',
      name: 'teaching-assistant',
      description: 'Can read and manage assignment-related resources',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      classId: null,
      isSystem: false,
      permissions: [
        {
          id: '550e8400-e29b-41d4-a716-446655440100',
          action: 'read',
          resource: 'assignment',
          description: 'Allows reading assignment resources',
          key: 'read:assignment',
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
      code: 'RBAC_WORKSPACE_ROLE_NAME_EXISTS',
      message: 'Role name already exists in this workspace',
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
    { status: 400, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async createCustomRole(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateCustomRoleDto,
  ) {
    const role = await this.rbacService.createCustomRole(workspaceId, dto);

    return ApiResponse.success(role, 'Custom role created', 201);
  }

  @Patch(':roleId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'Update workspace custom role',
    description: 'Updates a workspace custom role. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Workspace custom role updated successfully',
    model: CustomRoleResponseDto,
    exampleMessage: 'Custom role updated',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440110',
      name: 'teaching-assistant',
      description: 'Updated description',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      classId: null,
      isSystem: false,
      permissions: [
        {
          id: '550e8400-e29b-41d4-a716-446655440100',
          action: 'read',
          resource: 'assignment',
          description: 'Allows reading assignment resources',
          key: 'read:assignment',
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
      code: 'RBAC_WORKSPACE_CUSTOM_ROLE_NOT_FOUND',
      message: 'Workspace custom role not found',
    },
    {
      status: 400,
      code: 'RBAC_ROLE_NAME_REQUIRED',
      message: 'Role name can not be empty',
    },
    {
      status: 400,
      code: 'RBAC_WORKSPACE_ROLE_NAME_EXISTS',
      message: 'Role name already exists in this workspace',
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
    { status: 400, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async updateCustomRole(
    @Param('workspaceId') workspaceId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateCustomRoleDto,
  ) {
    const role = await this.rbacService.updateCustomRole(workspaceId, roleId, dto);

    return ApiResponse.success(role, 'Custom role updated');
  }

  @Delete(':roleId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'Delete workspace custom role',
    description: 'Deletes a workspace custom role. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Workspace custom role deleted successfully',
    model: DeleteRoleResponseDto,
    exampleMessage: 'Custom role deleted',
    exampleResult: {
      roleId: '550e8400-e29b-41d4-a716-446655440110',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      classId: null,
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
      code: 'RBAC_WORKSPACE_CUSTOM_ROLE_NOT_FOUND',
      message: 'Workspace custom role not found',
    },
    {
      status: 400,
      code: 'RBAC_WORKSPACE_CUSTOM_ROLE_ASSIGNED',
      message:
        'Cannot delete workspace role while it is still assigned to members',
    },
    { status: 400, code: 'WORKSPACE_NOT_FOUND', message: 'Workspace not found' },
  ])
  async deleteCustomRole(
    @Param('workspaceId') workspaceId: string,
    @Param('roleId') roleId: string,
  ) {
    const result = await this.rbacService.deleteCustomRole(workspaceId, roleId);

    return ApiResponse.success(result, 'Custom role deleted');
  }
}
