import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { RequireRoles } from './decorators/require-roles.decorator';
import { CreateCustomRoleDto } from './dto/create-custom-role.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';
import { RbacPermissionGuard } from './guards/rbac-permission.guard';
import { RbacService } from './rbac.service';

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
  async listPermissions(
    @Param('workspaceId') workspaceId: string,
    @Req() req: AuthRequest,
  ) {
    const permissions = await this.rbacService.listPermissions(
      workspaceId,
      req.user.userId,
    );

    return ApiResponse.success(permissions, 'Permissions retrieved');
  }

  @Get()
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async listCustomRoles(
    @Param('workspaceId') workspaceId: string,
    @Req() req: AuthRequest,
  ) {
    const roles = await this.rbacService.listCustomRoles(
      workspaceId,
      req.user.userId,
    );

    return ApiResponse.success(roles, 'Custom roles retrieved');
  }

  @Post()
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async createCustomRole(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateCustomRoleDto,
    @Req() req: AuthRequest,
  ) {
    const role = await this.rbacService.createCustomRole(
      workspaceId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(role, 'Custom role created', 201);
  }

  @Patch(':roleId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async updateCustomRole(
    @Param('workspaceId') workspaceId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateCustomRoleDto,
    @Req() req: AuthRequest,
  ) {
    const role = await this.rbacService.updateCustomRole(
      workspaceId,
      roleId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(role, 'Custom role updated');
  }

  @Delete(':roleId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async deleteCustomRole(
    @Param('workspaceId') workspaceId: string,
    @Param('roleId') roleId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.rbacService.deleteCustomRole(
      workspaceId,
      roleId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Custom role deleted');
  }
}
