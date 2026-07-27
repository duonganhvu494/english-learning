import {
  Body,
  Controller,
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
import {
  RequireAnyAccess,
  requirePermissionAccess,
  requireRoleAccess,
} from 'src/rbac/decorators/require-any-access.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { WorkspacePlanGuard } from 'src/rbac/guards/workspace-plan.guard';
import { AttendancesService } from './attendances.service';
import { AttendanceSelfResponseDto } from './dto/attendance-self-response.dto';
import { AttendanceUpdateResponseDto } from './dto/attendance-update-response.dto';
import { SessionAttendanceResponseDto } from './dto/session-attendance-response.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get('sessions/:sessionId/attendances')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'session',
      scopeResourceIdParam: 'sessionId',
    }),
    requirePermissionAccess('read', 'attendance', {
      scopeType: 'class',
      scopeResourceType: 'session',
      scopeResourceIdParam: 'sessionId',
    }),
  ])
  async getSessionAttendances(
    @Param('sessionId') sessionId: string,
  ): Promise<ApiResponse<SessionAttendanceResponseDto>> {
    const result = await this.attendancesService.getSessionAttendances(sessionId);

    return ApiResponse.success(result, 'Session attendances fetched');
  }

  @Get('sessions/:sessionId/attendances/me')
  async getMyAttendance(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<AttendanceSelfResponseDto>> {
    const result = await this.attendancesService.getMyAttendance(
      sessionId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'My attendance fetched');
  }

  @Patch('sessions/:sessionId/attendances/:studentId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'session',
      scopeResourceIdParam: 'sessionId',
    }),
    requirePermissionAccess('update', 'attendance', {
      scopeType: 'class',
      scopeResourceType: 'session',
      scopeResourceIdParam: 'sessionId',
    }),
  ])
  async updateAttendance(
    @Param('sessionId') sessionId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateAttendanceDto,
  ): Promise<ApiResponse<AttendanceUpdateResponseDto>> {
    const result = await this.attendancesService.updateAttendance(
      sessionId,
      studentId,
      dto,
    );

    return ApiResponse.success(result, 'Attendance updated');
  }

  @Post('sessions/:sessionId/attendances/me')
  async selfCheckIn(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthRequest,
  ): Promise<ApiResponse<AttendanceUpdateResponseDto>> {
    const result = await this.attendancesService.selfCheckIn(
      sessionId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Attendance checked in');
  }
}
