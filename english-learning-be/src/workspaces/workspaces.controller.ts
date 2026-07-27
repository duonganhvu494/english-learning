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
import { WorkspacePlanGuard } from 'src/rbac/guards/workspace-plan.guard';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { WorkspaceResponseDto } from './dto/workspace-response.dto';
import { WorkspaceDetailResponseDto } from './dto/workspace-detail-response.dto';
import { WorkspaceStudentResponseDto } from './dto/workspace-student-response.dto';
import { WorkspaceStudentListItemDto } from './dto/workspace-student-list-item.dto';
import { RemoveWorkspaceStudentResponseDto } from './dto/remove-workspace-student-response.dto';
import { WorkspacePlansService } from './workspace-plans.service';
import { PlanResponseDto } from './dto/plan-response.dto';
import { WorkspaceSubscriptionResponseDto } from './dto/workspace-subscription-response.dto';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(
    private readonly service: WorkspacesService,
    private readonly workspacePlansService: WorkspacePlansService,
  ) {}

  @Post()
  async createWorkspace(
    @Body() dto: CreateWorkspaceDto,
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<WorkspaceResponseDto>> {
    const workspace = await this.service.createWorkspace(
      dto,
      req.user.userId,
    );
    return ApiResponse.success(workspace, 'Workspace created', 201);
  }

  @Get('me')
  async getMyWorkspace(@Req() req: AuthRequest): Promise<ApiResponse<WorkspaceDetailResponseDto>> {
    const result = await this.service.getMyWorkspace(
      req.user.userId,
    );
    return ApiResponse.success(result, 'Current workspace retrieved');
  }

  @Get('me/subscription')
  async getMyWorkspaceSubscription(@Req() req: AuthRequest): Promise<ApiResponse<WorkspaceSubscriptionResponseDto>> {
    const result = await this.service.getMyWorkspaceSubscription(
      req.user.userId,
    );
    return ApiResponse.success(
      result,
      'Current workspace subscription retrieved',
    );
  }

  @Get('plans')
  async listPlans(): Promise<ApiResponse<PlanResponseDto[]>> {
    const result = await this.workspacePlansService.listPublicPlans();
    return ApiResponse.success(result, 'Workspace plans retrieved');
  }

  @Get(':id')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequirePermission('read', 'workspace', {
    scopeType: 'workspace',
    scopeIdParam: 'id',
  })
  async getWorkspaceDetail(
    @Param('id') workspaceId: string,
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<WorkspaceDetailResponseDto>> {
    const result = await this.service.getWorkspaceDetail(
      workspaceId,
      req.user.userId,
    );
    return ApiResponse.success(result, 'Workspace detail retrieved');
  }

  @Post(':id/students')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], { scopeType: 'workspace', scopeIdParam: 'id' })
  async createStudent(
    @Param('id') workspaceId: string,
    @Body() dto: CreateStudentDto
  ): Promise<ApiResponse<WorkspaceStudentResponseDto>> {
    const student = await this.service.createStudentInWorkspace(
      workspaceId,
      dto,
    );
    const statusCode = student.mode === 'already_assigned' ? 200 : 201;

    return ApiResponse.success(
      student,
      this.getWorkspaceStudentMessage(student.mode),
      statusCode,
    );
  }

  @Get(':id/students')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], { scopeType: 'workspace', scopeIdParam: 'id' })
  async listStudents(
    @Param('id') workspaceId: string,
  ): Promise<ApiResponse<WorkspaceStudentListItemDto[]>> {
    const students = await this.service.listWorkspaceStudents(
      workspaceId,
    );
    return ApiResponse.success(students, 'Workspace students retrieved');
  }

  @Patch(':id/students/:studentId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], { scopeType: 'workspace', scopeIdParam: 'id' })
  async updateStudent(
    @Param('id') workspaceId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateWorkspaceStudentDto,
  ): Promise<ApiResponse<WorkspaceStudentListItemDto>> {
    const result = await this.service.updateWorkspaceStudent(
      workspaceId,
      studentId,
      dto,
    );
    return ApiResponse.success(result, 'Workspace student updated');
  }

  @Delete(':id/students/:studentId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], { scopeType: 'workspace', scopeIdParam: 'id' })
  async removeStudent(
    @Param('id') workspaceId: string,
    @Param('studentId') studentId: string,
  ): Promise<ApiResponse<RemoveWorkspaceStudentResponseDto>> {
    const result = await this.service.removeStudentFromWorkspace(
      workspaceId,
      studentId,
    );
    return ApiResponse.success(result, 'Student removed from workspace');
  }

  private getWorkspaceStudentMessage(
    mode: WorkspaceStudentResponseDto['mode'],
  ): string {
    switch (mode) {
      case 'created':
        return 'Student created and added to workspace';
      case 'attached':
        return 'Existing student added to workspace';
      case 'already_assigned':
        return 'Student already exists in workspace';
    }
  }
}
