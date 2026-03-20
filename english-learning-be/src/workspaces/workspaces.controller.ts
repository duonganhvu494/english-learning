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

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly service: WorkspacesService) {}

  @Post()
  async create(
    @Body() dto: CreateWorkspaceDto,
    @Req() req: AuthRequest,
  ) {
    const workspace = await this.service.createWorkspace(
      dto,
      req.user.userId,
    );
    return ApiResponse.success(workspace, 'Workspace created');
  }

  @Get('me')
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
  async createStudent(
    @Param('id') workspaceId: string,
    @Body() dto: CreateStudentDto,
    @Req() req: AuthRequest,
  ) {
    const student = await this.service.createStudentInWorkspace(
      workspaceId,
      dto,
      req.user.userId,
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
  async listStudents(
    @Param('id') workspaceId: string,
    @Req() req: AuthRequest,
  ) {
    const students = await this.service.listWorkspaceStudents(
      workspaceId,
      req.user.userId,
    );
    return ApiResponse.success(students, 'Workspace students retrieved');
  }

  @Patch(':id/students/:studentId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], { scopeType: 'workspace', scopeIdParam: 'id' })
  async updateStudent(
    @Param('id') workspaceId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateWorkspaceStudentDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.service.updateWorkspaceStudent(
      workspaceId,
      studentId,
      dto,
      req.user.userId,
    );
    return ApiResponse.success(result, 'Workspace student updated');
  }

  @Delete(':id/students/:studentId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], { scopeType: 'workspace', scopeIdParam: 'id' })
  async removeStudent(
    @Param('id') workspaceId: string,
    @Param('studentId') studentId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.service.removeStudentFromWorkspace(
      workspaceId,
      studentId,
      req.user.userId,
    );
    return ApiResponse.success(result, 'Student removed from workspace');
  }
}
