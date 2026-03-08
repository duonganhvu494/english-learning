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
import { AttendancesService } from './attendances.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class AttendancesController {
  constructor(private readonly attendancesService: AttendancesService) {}

  @Get('sessions/:sessionId/attendances')
  @UseGuards(RbacPermissionGuard)
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
  ) {
    const result = await this.attendancesService.getSessionAttendances(sessionId);

    return ApiResponse.success(result, 'Session attendances fetched');
  }

  @Patch('sessions/:sessionId/attendances/:studentId')
  @UseGuards(RbacPermissionGuard)
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
  ) {
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
  ) {
    const result = await this.attendancesService.selfCheckIn(
      sessionId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Attendance checked in');
  }
}
