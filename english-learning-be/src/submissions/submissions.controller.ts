import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiCookieAuth,
  ApiFoundResponse,
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
import { AbortMaterialUploadDto } from 'src/materials/dto/abort-material-upload.dto';
import { CompleteMaterialUploadDto } from 'src/materials/dto/complete-material-upload.dto';
import { MaterialUploadAbortResponseDto } from 'src/materials/dto/material-upload-abort-response.dto';
import { MaterialUploadInitResponseDto } from 'src/materials/dto/material-upload-init-response.dto';
import { MaterialUploadPartSignedResponseDto } from 'src/materials/dto/material-upload-part-signed-response.dto';
import { SignMaterialUploadPartDto } from 'src/materials/dto/sign-material-upload-part.dto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { InitSubmissionUploadDto } from './dto/init-submission-upload.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmissionResponseDto } from './dto/submission-response.dto';
import { SubmissionsService } from './submissions.service';

@ApiTags('Submissions')
@Controller()
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('assignments/:assignmentId/submissions/me/upload-init')
  @UseGuards(RbacPermissionGuard)
  @RequirePermission('read', 'assignment', {
    scopeType: 'class',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  @ApiOperation({
    summary: 'Initialize my submission upload',
    description: 'Initializes a multipart upload for the current student submission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Submission upload initialized successfully',
    model: MaterialUploadInitResponseDto,
    exampleMessage: 'Submission upload initialized',
    exampleResult: {
      materialId: '550e8400-e29b-41d4-a716-446655440900',
      uploadSessionId: '550e8400-e29b-41d4-a716-446655440901',
      uploadId: '2~QmF0Y2hVcGxvYWRJZA...',
      objectKey: 'submissions/homework-01-nguyen-van-a.pdf',
      partSize: 10485760,
      totalParts: 1,
      expiresAt: '2026-03-25T10:00:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have permission to submit this assignment' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_PERMISSION_DENIED', message: 'Permission access denied' },
    { status: 403, code: 'SUBMISSION_CLASS_MEMBERSHIP_REQUIRED', message: 'Student does not belong to this class' },
    { status: 403, code: 'SUBMISSION_STUDENT_ROLE_REQUIRED', message: 'Only students can submit assignments' },
    { status: 400, code: 'SUBMISSION_ASSIGNMENT_NOT_FOUND', message: 'Assignment not found' },
    { status: 400, code: 'SUBMISSION_MANUAL_ASSIGNMENT_REQUIRED', message: 'File submissions are only available for manual assignments' },
    { status: 400, code: 'SUBMISSION_NOT_OPEN_YET', message: 'Assignment submission has not opened yet' },
    { status: 400, code: 'SUBMISSION_CLOSED', message: 'Assignment submission window has closed' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async initMySubmissionUpload(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: InitSubmissionUploadDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.submissionsService.initMySubmissionUpload(
      assignmentId,
      req.user.userId,
      dto,
    );

    return ApiResponse.success(result, 'Submission upload initialized', 201);
  }

  @Post('assignments/:assignmentId/submissions/me/upload-sign-part')
  @UseGuards(RbacPermissionGuard)
  @RequirePermission('read', 'assignment', {
    scopeType: 'class',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  @ApiOperation({
    summary: 'Sign my submission upload part',
    description: 'Signs a multipart upload part for the current student submission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Submission upload part signed successfully',
    model: MaterialUploadPartSignedResponseDto,
    exampleMessage: 'Submission upload part signed',
    exampleResult: {
      partNumber: 1,
      url: 'https://bucket.s3.amazonaws.com/...signed-url...',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have permission to submit this assignment' })
  async signMySubmissionUploadPart(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SignMaterialUploadPartDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.submissionsService.signMySubmissionUploadPart(
      assignmentId,
      req.user.userId,
      dto,
    );

    return ApiResponse.success(result, 'Submission upload part signed');
  }

  @Post('assignments/:assignmentId/submissions/me/upload-complete')
  @UseGuards(RbacPermissionGuard)
  @RequirePermission('read', 'assignment', {
    scopeType: 'class',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  @ApiOperation({
    summary: 'Complete my submission upload',
    description: 'Completes the current student multipart upload and finalizes the submission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment submitted successfully',
    model: SubmissionResponseDto,
    exampleMessage: 'Assignment submitted',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440800',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      studentName: 'Nguyen Van A',
      submitted: true,
      submittedAt: '2026-03-25T09:00:00.000Z',
      grade: null,
      feedback: null,
      material: {
        id: '550e8400-e29b-41d4-a716-446655440900',
        title: 'Homework 01 - Nguyen Van A',
        downloadUrl: '/assignments/550e8400-e29b-41d4-a716-446655440800/submissions/me/download',
        fileName: 'homework-01-nguyen-van-a.pdf',
        mimeType: 'application/pdf',
        size: 124553,
        category: 'submission',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have permission to submit this assignment' })
  async completeMySubmissionUpload(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: CompleteMaterialUploadDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.submissionsService.completeMySubmissionUpload(
      assignmentId,
      req.user.userId,
      dto,
    );

    return ApiResponse.success(result, 'Assignment submitted');
  }

  @Post('assignments/:assignmentId/submissions/me/upload-abort')
  @UseGuards(RbacPermissionGuard)
  @RequirePermission('read', 'assignment', {
    scopeType: 'class',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  @ApiOperation({
    summary: 'Abort my submission upload',
    description: 'Aborts the current student multipart upload.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Submission upload aborted successfully',
    model: MaterialUploadAbortResponseDto,
    exampleMessage: 'Submission upload aborted',
    exampleResult: {
      materialId: '550e8400-e29b-41d4-a716-446655440900',
      uploadSessionId: '550e8400-e29b-41d4-a716-446655440901',
      status: 'failed',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have permission to submit this assignment' })
  async abortMySubmissionUpload(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: AbortMaterialUploadDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.submissionsService.abortMySubmissionUpload(
      assignmentId,
      req.user.userId,
      dto,
    );

    return ApiResponse.success(result, 'Submission upload aborted');
  }

  @Get('assignments/:assignmentId/submissions/me/download')
  @UseGuards(RbacPermissionGuard)
  @RequirePermission('read', 'assignment', {
    scopeType: 'class',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  @ApiOperation({
    summary: 'Download my submission',
    description: 'Redirects the current student to a signed download URL for their submission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiFoundResponse({
    description: 'Returns a 302 redirect to the signed download URL for the current student submission.',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'User does not have permission to access this submission' })
  @ApiBusinessErrorResponses([
    {
      status: 400,
      code: 'SUBMISSION_NOT_FOUND',
      message: 'Student has not submitted this assignment yet',
    },
    {
      status: 400,
      code: 'SUBMISSION_MATERIAL_NOT_READY',
      message: 'Submission material is not ready for download',
    },
  ])
  async downloadMySubmission(
    @Param('assignmentId') assignmentId: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    const result = await this.submissionsService.getMySubmissionDownloadTarget(
      assignmentId,
      req.user.userId,
    );
    return res.redirect(result.url);
  }

  @Get('assignments/:assignmentId/submissions/me')
  @UseGuards(RbacPermissionGuard)
  @RequirePermission('read', 'assignment', {
    scopeType: 'class',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  @ApiOperation({
    summary: 'Get my submission',
    description: 'Returns the current student submission for an assignment.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'My submission retrieved successfully',
    model: SubmissionResponseDto,
    exampleMessage: 'My submission fetched',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440800',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      studentName: 'Nguyen Van A',
      submitted: true,
      submittedAt: '2026-03-25T09:00:00.000Z',
      grade: 8.5,
      feedback: 'Good job, but review question 3.',
      material: {
        id: '550e8400-e29b-41d4-a716-446655440900',
        title: 'Homework 01 - Nguyen Van A',
        downloadUrl: '/assignments/550e8400-e29b-41d4-a716-446655440800/submissions/me/download',
        fileName: 'homework-01-nguyen-van-a.pdf',
        mimeType: 'application/pdf',
        size: 124553,
        category: 'submission',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have permission to access this submission' })
  async getMySubmission(
    @Param('assignmentId') assignmentId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.submissionsService.getMySubmission(
      assignmentId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'My submission fetched');
  }

  @Get('assignments/:assignmentId/submissions')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  @ApiOperation({
    summary: 'List assignment submissions',
    description: 'Returns all student submissions of an assignment. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment submissions retrieved successfully',
    model: SubmissionResponseDto,
    isArray: true,
    exampleMessage: 'Assignment submissions fetched',
    exampleResult: [
      {
        assignmentId: '550e8400-e29b-41d4-a716-446655440800',
        studentId: '550e8400-e29b-41d4-a716-446655440010',
        studentName: 'Nguyen Van A',
        submitted: true,
        submittedAt: '2026-03-25T09:00:00.000Z',
        grade: 8.5,
        feedback: 'Good job, but review question 3.',
        material: {
          id: '550e8400-e29b-41d4-a716-446655440900',
          title: 'Homework 01 - Nguyen Van A',
          downloadUrl: '/assignments/550e8400-e29b-41d4-a716-446655440800/submissions/550e8400-e29b-41d4-a716-446655440010/download',
          fileName: 'homework-01-nguyen-van-a.pdf',
          mimeType: 'application/pdf',
          size: 124553,
          category: 'submission',
        },
      },
    ],
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  async listAssignmentSubmissions(@Param('assignmentId') assignmentId: string) {
    const result = await this.submissionsService.listAssignmentSubmissions(
      assignmentId,
    );

    return ApiResponse.success(result, 'Assignment submissions fetched');
  }

  @Get('assignments/:assignmentId/submissions/:studentId/download')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  @ApiOperation({
    summary: 'Download student submission',
    description: 'Redirects to a signed download URL for a student submission. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiFoundResponse({
    description: 'Returns a 302 redirect to the signed download URL for the student submission.',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  @ApiBusinessErrorResponses([
    {
      status: 400,
      code: 'SUBMISSION_NOT_FOUND',
      message: 'Student has not submitted this assignment yet',
    },
    {
      status: 400,
      code: 'SUBMISSION_MATERIAL_NOT_READY',
      message: 'Submission material is not ready for download',
    },
  ])
  async downloadSubmission(
    @Param('assignmentId') assignmentId: string,
    @Param('studentId') studentId: string,
    @Res() res: Response,
  ) {
    const result = await this.submissionsService.getSubmissionDownloadTarget(
      assignmentId,
      studentId,
    );
    return res.redirect(result.url);
  }

  @Get('assignments/:assignmentId/submissions/:studentId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  @ApiOperation({
    summary: 'Get student submission',
    description: 'Returns a specific student submission. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment submission retrieved successfully',
    model: SubmissionResponseDto,
    exampleMessage: 'Assignment submission fetched',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440800',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      studentName: 'Nguyen Van A',
      submitted: true,
      submittedAt: '2026-03-25T09:00:00.000Z',
      grade: 8.5,
      feedback: 'Good job, but review question 3.',
      material: {
        id: '550e8400-e29b-41d4-a716-446655440900',
        title: 'Homework 01 - Nguyen Van A',
        downloadUrl: '/assignments/550e8400-e29b-41d4-a716-446655440800/submissions/550e8400-e29b-41d4-a716-446655440010/download',
        fileName: 'homework-01-nguyen-van-a.pdf',
        mimeType: 'application/pdf',
        size: 124553,
        category: 'submission',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  async getAssignmentSubmission(
    @Param('assignmentId') assignmentId: string,
    @Param('studentId') studentId: string,
  ) {
    const result = await this.submissionsService.getAssignmentSubmission(
      assignmentId,
      studentId,
    );

    return ApiResponse.success(result, 'Assignment submission fetched');
  }

  @Patch('assignments/:assignmentId/submissions/:studentId/review')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  @ApiOperation({
    summary: 'Review submission',
    description: 'Updates submission grade and feedback. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Submission reviewed successfully',
    model: SubmissionResponseDto,
    exampleMessage: 'Submission reviewed',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440800',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      studentName: 'Nguyen Van A',
      submitted: true,
      submittedAt: '2026-03-25T09:00:00.000Z',
      grade: 8.5,
      feedback: 'Good job, but review question 3.',
      material: {
        id: '550e8400-e29b-41d4-a716-446655440900',
        title: 'Homework 01 - Nguyen Van A',
        downloadUrl: '/assignments/550e8400-e29b-41d4-a716-446655440800/submissions/550e8400-e29b-41d4-a716-446655440010/download',
        fileName: 'homework-01-nguyen-van-a.pdf',
        mimeType: 'application/pdf',
        size: 124553,
        category: 'submission',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  async reviewSubmission(
    @Param('assignmentId') assignmentId: string,
    @Param('studentId') studentId: string,
    @Body() dto: ReviewSubmissionDto,
  ) {
    const result = await this.submissionsService.reviewSubmission(
      assignmentId,
      studentId,
      dto,
    );

    return ApiResponse.success(result, 'Submission reviewed');
  }
}
