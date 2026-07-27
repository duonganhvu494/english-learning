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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { RequireRoles } from './decorators/require-roles.decorator';
import { CreateCustomRoleDto } from './dto/create-custom-role.dto';
import { CustomRoleResponseDto } from './dto/custom-role-response.dto';
import { DeleteRoleResponseDto } from './dto/delete-role-response.dto';
import { PermissionResponseDto } from './dto/permission-response.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';
import { RbacPermissionGuard } from './guards/rbac-permission.guard';
import { WorkspacePlanGuard } from './guards/workspace-plan.guard';
import { RbacService } from './rbac.service';

@Controller('workspaces/:workspaceId/roles')
@UseGuards(JwtAuthGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get('permissions')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async listPermissions(
    @Param('workspaceId') workspaceId: string,
  ): Promise<ApiResponse<PermissionResponseDto[]>> {
    const permissions = await this.rbacService.listPermissions(workspaceId);

    return ApiResponse.success(permissions, 'Permissions retrieved');
  }

  @Get()
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async listCustomRoles(
    @Param('workspaceId') workspaceId: string,
  ): Promise<ApiResponse<CustomRoleResponseDto[]>> {
    const roles = await this.rbacService.listCustomRoles(workspaceId);

    return ApiResponse.success(roles, 'Custom roles retrieved');
  }

  @Post()
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async createCustomRole(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateCustomRoleDto,
  ): Promise<ApiResponse<CustomRoleResponseDto>> {
    const role = await this.rbacService.createCustomRole(workspaceId, dto);

    return ApiResponse.success(role, 'Custom role created', 201);
  }

  @Patch(':roleId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async updateCustomRole(
    @Param('workspaceId') workspaceId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateCustomRoleDto,
  ): Promise<ApiResponse<CustomRoleResponseDto>> {
    const role = await this.rbacService.updateCustomRole(workspaceId, roleId, dto);

    return ApiResponse.success(role, 'Custom role updated');
  }

  @Delete(':roleId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async deleteCustomRole(
    @Param('workspaceId') workspaceId: string,
    @Param('roleId') roleId: string,
  ): Promise<ApiResponse<DeleteRoleResponseDto>> {
    const result = await this.rbacService.deleteCustomRole(workspaceId, roleId);

    return ApiResponse.success(result, 'Custom role deleted');
  }
}
