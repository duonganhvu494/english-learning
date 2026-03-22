import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiFoundResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { ApiBusinessErrorResponses, ApiEnvelopeResponse } from 'src/common/swagger/swagger-response.decorator';
import {
  RequireAnyAccess,
  requirePermissionAccess,
  requireRoleAccess,
} from 'src/rbac/decorators/require-any-access.decorator';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { LectureDeleteResponseDto } from './dto/lecture-delete-response.dto';
import { LectureResponseDto } from './dto/lecture-response.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { LecturesService } from './lectures.service';

@ApiTags('Lectures')
@Controller()
@UseGuards(JwtAuthGuard)
export class LecturesController {
  constructor(private readonly lecturesService: LecturesService) {}

  @Post('sessions/:sessionId/lectures')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'session',
    scopeResourceIdParam: 'sessionId',
  })
  @ApiOperation({
    summary: 'Create lecture',
    description: 'Creates a lecture inside a session. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Lecture created successfully',
    model: LectureResponseDto,
    exampleMessage: 'Lecture created',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440600',
      code: 'LEC-001',
      sessionId: '550e8400-e29b-41d4-a716-446655440400',
      classId: '550e8400-e29b-41d4-a716-446655440200',
      title: 'Present Simple Overview',
      description: 'Introduction and examples for present simple tense',
      materials: [
        {
          id: '550e8400-e29b-41d4-a716-446655440500',
          title: 'Lesson 1 Slides',
          downloadUrl: '550e8400-e29b-41d4-a716-446655440600',
          fileName: 'lesson-1-slides.pdf',
          mimeType: 'application/pdf',
          size: 248321,
          category: 'lecture',
        },
      ],
      createdAt: '2026-03-22T08:00:00.000Z',
      updatedAt: '2026-03-22T08:00:00.000Z',
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
    { status: 400, code: 'LECTURE_SESSION_NOT_FOUND', message: 'Session not found' },
    { status: 400, code: 'LECTURE_ACTOR_NOT_FOUND', message: 'User not found' },
    { status: 400, code: 'LECTURE_TITLE_REQUIRED', message: 'title can not be empty' },
    {
      status: 400,
      code: 'LECTURE_TITLE_ALREADY_EXISTS_IN_SESSION',
      message: 'A lecture with the same title already exists in this session',
    },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async createLecture(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateLectureDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.lecturesService.createLecture(
      sessionId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Lecture created', 201);
  }

  @Get('sessions/:sessionId/lectures')
  @UseGuards(RbacPermissionGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'session',
      scopeResourceIdParam: 'sessionId',
    }),
    requirePermissionAccess('read', 'lecture', {
      scopeType: 'class',
      scopeResourceType: 'session',
      scopeResourceIdParam: 'sessionId',
    }),
  ])
  @ApiOperation({
    summary: 'List session lectures',
    description:
      'Returns all lectures of a session when the user is the workspace owner or has class lecture read permission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Session lectures retrieved successfully',
    model: LectureResponseDto,
    isArray: true,
    exampleMessage: 'Session lectures fetched',
    exampleResult: [
      {
        id: '550e8400-e29b-41d4-a716-446655440600',
        code: 'LEC-001',
        sessionId: '550e8400-e29b-41d4-a716-446655440400',
        classId: '550e8400-e29b-41d4-a716-446655440200',
        title: 'Present Simple Overview',
        description: 'Introduction and examples for present simple tense',
        materials: [],
        createdAt: '2026-03-22T08:00:00.000Z',
        updatedAt: '2026-03-22T08:00:00.000Z',
      },
    ],
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have access to session lectures' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 403, code: 'RBAC_PERMISSION_DENIED', message: 'Permission access denied' },
  ])
  async listSessionLectures(@Param('sessionId') sessionId: string) {
    const result = await this.lecturesService.listSessionLectures(sessionId);

    return ApiResponse.success(result, 'Session lectures fetched');
  }

  @Get('lectures/:lectureId')
  @UseGuards(RbacPermissionGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'lecture',
      scopeResourceIdParam: 'lectureId',
    }),
    requirePermissionAccess('read', 'lecture', {
      scopeType: 'class',
      scopeResourceType: 'lecture',
      scopeResourceIdParam: 'lectureId',
    }),
  ])
  @ApiOperation({
    summary: 'Get lecture detail',
    description:
      'Returns lecture details when the user is the workspace owner or has class lecture read permission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Lecture detail retrieved successfully',
    model: LectureResponseDto,
    exampleMessage: 'Lecture detail fetched',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440600',
      code: 'LEC-001',
      sessionId: '550e8400-e29b-41d4-a716-446655440400',
      classId: '550e8400-e29b-41d4-a716-446655440200',
      title: 'Present Simple Overview',
      description: 'Introduction and examples for present simple tense',
      materials: [],
      createdAt: '2026-03-22T08:00:00.000Z',
      updatedAt: '2026-03-22T08:00:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have access to this lecture' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 403, code: 'RBAC_PERMISSION_DENIED', message: 'Permission access denied' },
    { status: 400, code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' },
  ])
  async getLectureDetail(@Param('lectureId') lectureId: string) {
    const result = await this.lecturesService.getLectureDetail(lectureId);

    return ApiResponse.success(result, 'Lecture detail fetched');
  }

  @Get('lectures/:lectureId/materials/:materialId/download')
  @UseGuards(RbacPermissionGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'lecture',
      scopeResourceIdParam: 'lectureId',
    }),
    requirePermissionAccess('read', 'lecture', {
      scopeType: 'class',
      scopeResourceType: 'lecture',
      scopeResourceIdParam: 'lectureId',
    }),
  ])
  @ApiOperation({
    summary: 'Download lecture material',
    description: 'Redirects to a signed S3 download URL for a lecture material.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiFoundResponse({
    description: 'Returns a 302 redirect to the signed S3 download URL for the lecture material.',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have access to this lecture material' })
  @ApiBusinessErrorResponses([
    {
      status: 400,
      code: 'LECTURE_MATERIAL_NOT_ATTACHED',
      message: 'Material is not attached to this lecture',
    },
    {
      status: 400,
      code: 'LECTURE_MATERIAL_NOT_READY',
      message: 'Lecture material is not ready for download',
    },
  ])
  async downloadLectureMaterial(
    @Param('lectureId') lectureId: string,
    @Param('materialId') materialId: string,
    @Res() res: Response,
  ) {
    const result = await this.lecturesService.getLectureMaterialDownloadTarget(
      lectureId,
      materialId,
    );
    return res.redirect(result.url);
  }

  @Patch('lectures/:lectureId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'lecture',
    scopeResourceIdParam: 'lectureId',
  })
  @ApiOperation({
    summary: 'Update lecture',
    description: 'Updates lecture information. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Lecture updated successfully',
    model: LectureResponseDto,
    exampleMessage: 'Lecture updated',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440600',
      code: 'LEC-001',
      sessionId: '550e8400-e29b-41d4-a716-446655440400',
      classId: '550e8400-e29b-41d4-a716-446655440200',
      title: 'Updated Present Simple Overview',
      description: 'Refined explanation and examples',
      materials: [],
      createdAt: '2026-03-22T08:00:00.000Z',
      updatedAt: '2026-03-22T08:30:00.000Z',
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
    { status: 400, code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' },
    { status: 400, code: 'LECTURE_TITLE_REQUIRED', message: 'title can not be empty' },
    {
      status: 400,
      code: 'LECTURE_TITLE_ALREADY_EXISTS_IN_SESSION',
      message: 'A lecture with the same title already exists in this session',
    },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async updateLecture(
    @Param('lectureId') lectureId: string,
    @Body() dto: UpdateLectureDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.lecturesService.updateLecture(
      lectureId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Lecture updated');
  }

  @Delete('lectures/:lectureId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'lecture',
    scopeResourceIdParam: 'lectureId',
  })
  @ApiOperation({
    summary: 'Delete lecture',
    description: 'Deletes a lecture. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Lecture deleted successfully',
    model: LectureDeleteResponseDto,
    exampleMessage: 'Lecture deleted',
    exampleResult: {
      lectureId: '550e8400-e29b-41d4-a716-446655440600',
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
    { status: 400, code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' },
  ])
  async deleteLecture(@Param('lectureId') lectureId: string) {
    const result = await this.lecturesService.deleteLecture(lectureId);

    return ApiResponse.success(result, 'Lecture deleted');
  }
}
