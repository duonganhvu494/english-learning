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
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import {
  RequireAnyAccess,
  requirePermissionAccess,
  requireRoleAccess,
} from 'src/rbac/decorators/require-any-access.decorator';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionsService } from './sessions.service';
import { ApiBusinessErrorResponses, ApiEnvelopeResponse } from 'src/common/swagger/swagger-response.decorator';
import { SessionResponseDto } from './dto/session-response.dto';
import { SessionDeleteResponseDto } from './dto/session-delete-response.dto';

@ApiTags('Sessions')
@Controller()
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('classes/:classId/sessions')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  @ApiOperation({
    summary: 'Create session',
    description: 'Creates a session inside a class. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Session created successfully',
    model: SessionResponseDto,
    exampleMessage: 'Session created',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440400',
      code: 'SES-001',
      classId: '550e8400-e29b-41d4-a716-446655440200',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      timeStart: '2026-03-22T08:00:00.000Z',
      timeEnd: '2026-03-22T10:00:00.000Z',
      topic: 'Grammar revision',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 400, code: 'SESSION_CLASS_NOT_FOUND', message: 'Class not found' },
    { status: 400, code: 'SESSION_TOPIC_REQUIRED', message: 'topic can not be empty' },
    {
      status: 400,
      code: 'SESSION_DUPLICATE_IN_CLASS',
      message:
        'A session with the same topic and time window already exists in this class',
    },
    { status: 400, code: 'SESSION_TIME_INVALID', message: 'Session time is invalid' },
    { status: 400, code: 'SESSION_TIME_RANGE_INVALID', message: 'timeStart must be earlier than timeEnd' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async createSession(
    @Param('classId') classId: string,
    @Body() dto: CreateSessionDto,
  ) {
    const result = await this.sessionsService.createSession(classId, dto);

    return ApiResponse.success(result, 'Session created', 201);
  }

  @Get('classes/:classId/sessions')
  @UseGuards(RbacPermissionGuard)
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
  @ApiOperation({
    summary: 'List class sessions',
    description:
      'Returns all sessions of a class when the user is the workspace owner or has class session read permission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Class sessions retrieved successfully',
    model: SessionResponseDto,
    isArray: true,
    exampleMessage: 'Class sessions fetched',
    exampleResult: [
      {
        id: '550e8400-e29b-41d4-a716-446655440400',
        code: 'SES-001',
        classId: '550e8400-e29b-41d4-a716-446655440200',
        workspaceId: '550e8400-e29b-41d4-a716-446655440100',
        timeStart: '2026-03-22T08:00:00.000Z',
        timeEnd: '2026-03-22T10:00:00.000Z',
        topic: 'Grammar revision',
      },
    ],
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have access to class sessions' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 403, code: 'RBAC_PERMISSION_DENIED', message: 'Permission access denied' },
    { status: 400, code: 'SESSION_CLASS_NOT_FOUND', message: 'Class not found' },
  ])
  async listClassSessions(
    @Param('classId') classId: string,
  ) {
    const result = await this.sessionsService.listClassSessions(classId);

    return ApiResponse.success(result, 'Class sessions fetched');
  }

  @Get('sessions/:sessionId')
  @UseGuards(RbacPermissionGuard)
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
  @ApiOperation({
    summary: 'Get session detail',
    description:
      'Returns session details when the user is the workspace owner or has class session read permission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Session detail retrieved successfully',
    model: SessionResponseDto,
    exampleMessage: 'Session detail fetched',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440400',
      code: 'SES-001',
      classId: '550e8400-e29b-41d4-a716-446655440200',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      timeStart: '2026-03-22T08:00:00.000Z',
      timeEnd: '2026-03-22T10:00:00.000Z',
      topic: 'Grammar revision',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have access to this session' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 403, code: 'RBAC_PERMISSION_DENIED', message: 'Permission access denied' },
    { status: 400, code: 'SESSION_NOT_FOUND', message: 'Session not found' },
  ])
  async getSessionDetail(
    @Param('sessionId') sessionId: string,
  ) {
    const result = await this.sessionsService.getSessionDetail(sessionId);

    return ApiResponse.success(result, 'Session detail fetched');
  }

  @Patch('sessions/:sessionId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'session',
    scopeResourceIdParam: 'sessionId',
  })
  @ApiOperation({
    summary: 'Update session',
    description: 'Updates session information. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Session updated successfully',
    model: SessionResponseDto,
    exampleMessage: 'Session updated',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440400',
      code: 'SES-001',
      classId: '550e8400-e29b-41d4-a716-446655440200',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      timeStart: '2026-03-22T09:00:00.000Z',
      timeEnd: '2026-03-22T11:00:00.000Z',
      topic: 'Updated grammar revision',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 400, code: 'SESSION_NOT_FOUND', message: 'Session not found' },
    { status: 400, code: 'SESSION_TOPIC_REQUIRED', message: 'topic can not be empty' },
    {
      status: 400,
      code: 'SESSION_DUPLICATE_IN_CLASS',
      message:
        'A session with the same topic and time window already exists in this class',
    },
    { status: 400, code: 'SESSION_TIME_INVALID', message: 'Session time is invalid' },
    { status: 400, code: 'SESSION_TIME_RANGE_INVALID', message: 'timeStart must be earlier than timeEnd' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    const result = await this.sessionsService.updateSession(sessionId, dto);

    return ApiResponse.success(result, 'Session updated');
  }

  @Delete('sessions/:sessionId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'session',
    scopeResourceIdParam: 'sessionId',
  })
  @ApiOperation({
    summary: 'Delete session',
    description: 'Deletes a session. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Session deleted successfully',
    model: SessionDeleteResponseDto,
    exampleMessage: 'Session deleted',
    exampleResult: {
      sessionId: '550e8400-e29b-41d4-a716-446655440400',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 400, code: 'SESSION_NOT_FOUND', message: 'Session not found' },
  ])
  async deleteSession(@Param('sessionId') sessionId: string) {
    const result = await this.sessionsService.deleteSession(sessionId);

    return ApiResponse.success(result, 'Session deleted');
  }
}
