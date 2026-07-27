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
import { CreateClassRoleDto } from './dto/create-class-role.dto';
import { CustomRoleResponseDto } from './dto/custom-role-response.dto';
import { DeleteRoleResponseDto } from './dto/delete-role-response.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';
import { RbacPermissionGuard } from './guards/rbac-permission.guard';
import { WorkspacePlanGuard } from './guards/workspace-plan.guard';
import { RbacService } from './rbac.service';

@Controller('classes/:classId/roles')
@UseGuards(JwtAuthGuard)
export class ClassRolesController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async listClassRoles(
    @Param('classId') classId: string,
  ): Promise<ApiResponse<CustomRoleResponseDto[]>> {
    const roles = await this.rbacService.listClassCustomRoles(classId);

    return ApiResponse.success(roles, 'Class roles retrieved');
  }

  @Post()
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async createClassRole(
    @Param('classId') classId: string,
    @Body() dto: CreateClassRoleDto,
  ): Promise<ApiResponse<CustomRoleResponseDto>> {
    const role = await this.rbacService.createClassCustomRole(classId, dto);

    return ApiResponse.success(role, 'Class role created', 201);
  }

  @Patch(':roleId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async updateClassRole(
    @Param('classId') classId: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateCustomRoleDto,
  ): Promise<ApiResponse<CustomRoleResponseDto>> {
    const role = await this.rbacService.updateClassCustomRole(classId, roleId, dto);

    return ApiResponse.success(role, 'Class role updated');
  }

  @Delete(':roleId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async deleteClassRole(
    @Param('classId') classId: string,
    @Param('roleId') roleId: string,
  ): Promise<ApiResponse<DeleteRoleResponseDto>> {
    const result = await this.rbacService.deleteClassCustomRole(classId, roleId);

    return ApiResponse.success(result, 'Class role deleted');
  }
}
