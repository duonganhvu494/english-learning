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
import {
  RequireAnyAccess,
  requirePermissionAccess,
  requireRoleAccess,
} from 'src/rbac/decorators/require-any-access.decorator';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { WorkspacePlanGuard } from 'src/rbac/guards/workspace-plan.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionsService } from './sessions.service';
import { SessionResponseDto } from './dto/session-response.dto';
import { SessionDeleteResponseDto } from './dto/session-delete-response.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('classes/:classId/sessions')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async createSession(
    @Param('classId') classId: string,
    @Body() dto: CreateSessionDto,
  ): Promise<ApiResponse<SessionResponseDto>> {
    const result = await this.sessionsService.createSession(classId, dto);

    return ApiResponse.success(result, 'Session created', 201);
  }

  @Get('classes/:classId/sessions')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'class',
      scopeResourceIdParam: 'classId',
    }),
    requirePermissionAccess('read', 'session', {
      scopeType: 'class',
      scopeIdParam: 'classId',
    }),
  ])
  async listClassSessions(
    @Param('classId') classId: string,
  ): Promise<ApiResponse<SessionResponseDto[]>> {
    const result = await this.sessionsService.listClassSessions(classId);

    return ApiResponse.success(result, 'Class sessions fetched');
  }

  @Get('sessions/:sessionId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'session',
      scopeResourceIdParam: 'sessionId',
    }),
    requirePermissionAccess('read', 'session', {
      scopeType: 'class',
      scopeResourceType: 'session',
      scopeResourceIdParam: 'sessionId',
    }),
  ])
  async getSessionDetail(
    @Param('sessionId') sessionId: string,
  ): Promise<ApiResponse<SessionResponseDto>> {
    const result = await this.sessionsService.getSessionDetail(sessionId);

    return ApiResponse.success(result, 'Session detail fetched');
  }

  @Patch('sessions/:sessionId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'session',
    scopeResourceIdParam: 'sessionId',
  })
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSessionDto,
  ): Promise<ApiResponse<SessionResponseDto>> {
    const result = await this.sessionsService.updateSession(sessionId, dto);

    return ApiResponse.success(result, 'Session updated');
  }

  @Delete('sessions/:sessionId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'session',
    scopeResourceIdParam: 'sessionId',
  })
  async deleteSession(@Param('sessionId') sessionId: string): Promise<ApiResponse<SessionDeleteResponseDto>> {
    const result = await this.sessionsService.deleteSession(sessionId);

    return ApiResponse.success(result, 'Session deleted');
  }
}
