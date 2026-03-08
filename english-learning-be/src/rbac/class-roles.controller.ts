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
import { CreateClassRoleDto } from './dto/create-class-role.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';
import { RbacPermissionGuard } from './guards/rbac-permission.guard';
import { RbacService } from './rbac.service';

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
  async listClassRoles(
    @Param('classId') classId: string,
    @Req() req: AuthRequest,
  ) {
    const roles = await this.rbacService.listClassCustomRoles(
      classId,
      req.user.userId,
    );

    return ApiResponse.success(roles, 'Class roles retrieved');
  }

  @Post()
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async createClassRole(
    @Param('classId') classId: string,
    @Body() dto: CreateClassRoleDto,
    @Req() req: AuthRequest,
  ) {
    const role = await this.rbacService.createClassCustomRole(
      classId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(role, 'Class role created', 201);
  }

  @Patch(':roleId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async updateClassRole(
    @Param('classId') classId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateCustomRoleDto,
    @Req() req: AuthRequest,
  ) {
    const role = await this.rbacService.updateClassCustomRole(
      classId,
      roleId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(role, 'Class role updated');
  }

  @Delete(':roleId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async deleteClassRole(
    @Param('classId') classId: string,
    @Param('roleId') roleId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.rbacService.deleteClassCustomRole(
      classId,
      roleId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Class role deleted');
  }
}
