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
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { ApiBusinessErrorResponses, ApiEnvelopeResponse } from 'src/common/swagger/swagger-response.decorator';
import {
  RequireAnyAccess,
  requirePermissionAccess,
  requireRoleAccess,
} from 'src/rbac/decorators/require-any-access.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { AttendancesService } from './attendances.service';
import { AttendanceSelfResponseDto } from './dto/attendance-self-response.dto';
import { AttendanceUpdateResponseDto } from './dto/attendance-update-response.dto';
import { SessionAttendanceResponseDto } from './dto/session-attendance-response.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@ApiTags('Attendances')
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
  @ApiOperation({
    summary: 'Get session attendance roster',
    description:
      'Returns the attendance roster of a session for the workspace owner or a class member with attendance read permission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Session attendance roster retrieved successfully',
    model: SessionAttendanceResponseDto,
    exampleMessage: 'Session attendances fetched',
    exampleResult: {
      sessionId: '550e8400-e29b-41d4-a716-446655440020',
      classId: '550e8400-e29b-41d4-a716-446655440200',
      attendances: [
        {
          studentId: '550e8400-e29b-41d4-a716-446655440010',
          fullName: 'Nguyen Van A',
          userName: 'student01',
          email: 'student01@example.com',
          status: 'present',
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have attendance read access' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    {
      status: 403,
      code: 'RBAC_PERMISSION_DENIED',
      message: 'Permission access denied',
    },
    {
      status: 400,
      code: 'ATTENDANCE_SESSION_NOT_FOUND',
      message: 'Session not found',
    },
  ])
  async getSessionAttendances(
    @Param('sessionId') sessionId: string,
  ) {
    const result = await this.attendancesService.getSessionAttendances(sessionId);

    return ApiResponse.success(result, 'Session attendances fetched');
  }

  @Get('sessions/:sessionId/attendances/me')
  @ApiOperation({
    summary: 'Get my attendance',
    description: 'Returns the current authenticated student attendance for a session.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Current student attendance retrieved successfully',
    model: AttendanceSelfResponseDto,
    exampleMessage: 'My attendance fetched',
    exampleResult: {
      sessionId: '550e8400-e29b-41d4-a716-446655440020',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      status: 'present',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    {
      status: 400,
      code: 'ATTENDANCE_SESSION_NOT_FOUND',
      message: 'Session not found',
    },
    {
      status: 400,
      code: 'ATTENDANCE_VIEW_CLASS_STUDENT_REQUIRED',
      message: 'Current user must belong to the session class',
    },
    {
      status: 400,
      code: 'ATTENDANCE_VIEW_STUDENT_ACCOUNT_REQUIRED',
      message: 'Attendance view is only available for student accounts',
    },
  ])
  async getMyAttendance(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.attendancesService.getMyAttendance(
      sessionId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'My attendance fetched');
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
  @ApiOperation({
    summary: 'Update student attendance',
    description:
      'Updates attendance of a student in a session for the workspace owner or a class member with attendance update permission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Attendance updated successfully',
    model: AttendanceUpdateResponseDto,
    exampleMessage: 'Attendance updated',
    exampleResult: {
      sessionId: '550e8400-e29b-41d4-a716-446655440020',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      status: 'late',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have attendance update access' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    {
      status: 403,
      code: 'RBAC_PERMISSION_DENIED',
      message: 'Permission access denied',
    },
    {
      status: 400,
      code: 'ATTENDANCE_SESSION_NOT_FOUND',
      message: 'Session not found',
    },
    {
      status: 400,
      code: 'ATTENDANCE_STUDENT_NOT_ASSIGNED_TO_SESSION_CLASS',
      message: 'Student is not assigned to the session class',
    },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
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
  @ApiOperation({
    summary: 'Self check-in attendance',
    description: 'Allows the current authenticated student to self check-in for a session.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Attendance self check-in completed successfully',
    model: AttendanceUpdateResponseDto,
    exampleMessage: 'Attendance checked in',
    exampleResult: {
      sessionId: '550e8400-e29b-41d4-a716-446655440020',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      status: 'present',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    {
      status: 400,
      code: 'ATTENDANCE_SESSION_NOT_FOUND',
      message: 'Session not found',
    },
    {
      status: 400,
      code: 'ATTENDANCE_SELF_CHECKIN_CLASS_STUDENT_REQUIRED',
      message: 'Current user must belong to the session class',
    },
    {
      status: 400,
      code: 'ATTENDANCE_SELF_CHECKIN_STUDENT_ACCOUNT_REQUIRED',
      message: 'Self check-in is only available for student accounts',
    },
    {
      status: 400,
      code: 'ATTENDANCE_SELF_CHECKIN_ABSENT_LOCKED',
      message: 'Attendance has already been locked as absent',
    },
    {
      status: 400,
      code: 'ATTENDANCE_CHECKIN_CLOSED',
      message: 'Attendance check-in is closed',
    },
    {
      status: 400,
      code: 'ATTENDANCE_LATE_CHECKIN_WINDOW_CLOSED',
      message: 'Late attendance check-in window is closed',
    },
  ])
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
