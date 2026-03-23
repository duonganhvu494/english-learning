import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { AbortMaterialUploadDto } from './dto/abort-material-upload.dto';
import { CompleteMaterialUploadDto } from './dto/complete-material-upload.dto';
import { InitMaterialUploadDto } from './dto/init-material-upload.dto';
import { SignMaterialUploadPartDto } from './dto/sign-material-upload-part.dto';
import { MaterialsService } from './materials.service';
import { ApiBusinessErrorResponses, ApiEnvelopeResponse } from 'src/common/swagger/swagger-response.decorator';
import { MaterialDeleteResponseDto } from './dto/material-delete-response.dto';
import { MaterialResponseDto } from './dto/material-response.dto';
import { MaterialUploadAbortResponseDto } from './dto/material-upload-abort-response.dto';
import { MaterialUploadInitResponseDto } from './dto/material-upload-init-response.dto';
import { MaterialUploadPartSignedResponseDto } from './dto/material-upload-part-signed-response.dto';

@ApiTags('Materials')
@Controller()
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post('workspaces/:workspaceId/materials/upload-init')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'Initialize material upload',
    description:
      'Creates a material record and returns multipart upload metadata for direct S3 upload. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Material upload initialized successfully',
    model: MaterialUploadInitResponseDto,
    exampleMessage: 'Material upload initialized',
    exampleResult: {
      materialId: '550e8400-e29b-41d4-a716-446655440500',
      uploadSessionId: '550e8400-e29b-41d4-a716-446655440700',
      uploadId: '2~QmF0Y2hVcGxvYWRJZA...',
      objectKey: 'workspaces/550e8400/materials/lesson-1-slides.pdf',
      partSize: 10485760,
      totalParts: 3,
      expiresAt: '2026-03-23T08:00:00.000Z',
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
    { status: 400, code: 'MATERIAL_ACTOR_NOT_FOUND', message: 'User not found' },
    { status: 400, code: 'MATERIAL_FILE_NAME_REQUIRED', message: 'fileName can not be empty' },
    { status: 400, code: 'MATERIAL_TITLE_REQUIRED', message: 'title can not be empty' },
    { status: 400, code: 'STORAGE_UPLOAD_MIME_TYPE_REQUIRED', message: 'File mime type is required' },
    { status: 400, code: 'STORAGE_UPLOAD_SIZE_EXCEEDED', message: 'File size exceeds the maximum allowed size' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async initMaterialUpload(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: InitMaterialUploadDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.materialsService.initMaterialUpload(
      workspaceId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Material upload initialized', 201);
  }

  @Post('workspaces/:workspaceId/materials/upload-sign-part')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'Sign material upload part',
    description: 'Signs a multipart upload part for direct browser upload to S3.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Material upload part signed successfully',
    model: MaterialUploadPartSignedResponseDto,
    exampleMessage: 'Material upload part signed',
    exampleResult: {
      partNumber: 1,
      url: 'https://bucket.s3.amazonaws.com/...signed-url...',
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
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_NOT_FOUND', message: 'Material upload session not found' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_EXPIRED', message: 'Material upload session has expired' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_COMPLETED', message: 'Upload session already completed' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_ABORTED', message: 'Upload session already aborted' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_FAILED', message: 'Upload session already failed' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async signMaterialUploadPart(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: SignMaterialUploadPartDto,
  ) {
    const result = await this.materialsService.signMaterialUploadPart(
      workspaceId,
      dto,
    );

    return ApiResponse.success(result, 'Material upload part signed');
  }

  @Post('workspaces/:workspaceId/materials/upload-complete')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'Complete material upload',
    description: 'Completes a multipart upload and marks the material as ready.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Material upload completed successfully',
    model: MaterialResponseDto,
    exampleMessage: 'Material upload completed',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440500',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      title: 'Lesson 1 Slides',
      downloadUrl: '/materials/550e8400-e29b-41d4-a716-446655440500/download',
      status: 'ready',
      fileName: 'lesson-1-slides.pdf',
      mimeType: 'application/pdf',
      size: 248321,
      category: 'lecture',
      uploadedBy: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: '2026-03-22T08:00:00.000Z',
      updatedAt: '2026-03-22T08:05:00.000Z',
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
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_NOT_FOUND', message: 'Material upload session not found' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_EXPIRED', message: 'Material upload session has expired' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_COMPLETED', message: 'Upload session already completed' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_ABORTED', message: 'Upload session already aborted' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_FAILED', message: 'Upload session already failed' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async completeMaterialUpload(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CompleteMaterialUploadDto,
  ) {
    const result = await this.materialsService.completeMaterialUpload(
      workspaceId,
      dto,
    );

    return ApiResponse.success(result, 'Material upload completed');
  }

  @Post('workspaces/:workspaceId/materials/upload-abort')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'Abort material upload',
    description: 'Aborts a multipart upload session and marks the material upload as failed/aborted.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Material upload aborted successfully',
    model: MaterialUploadAbortResponseDto,
    exampleMessage: 'Material upload aborted',
    exampleResult: {
      materialId: '550e8400-e29b-41d4-a716-446655440500',
      uploadSessionId: '550e8400-e29b-41d4-a716-446655440700',
      status: 'failed',
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
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_NOT_FOUND', message: 'Material upload session not found' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_EXPIRED', message: 'Material upload session has expired' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_COMPLETED', message: 'Upload session already completed' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_ABORTED', message: 'Upload session already aborted' },
    { status: 400, code: 'MATERIAL_UPLOAD_SESSION_FAILED', message: 'Upload session already failed' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
  async abortMaterialUpload(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AbortMaterialUploadDto,
  ) {
    const result = await this.materialsService.abortMaterialUpload(
      workspaceId,
      dto,
    );

    return ApiResponse.success(result, 'Material upload aborted');
  }

  @Get('workspaces/:workspaceId/materials')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  @ApiOperation({
    summary: 'List workspace materials',
    description: 'Returns all materials belonging to a workspace. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Workspace materials retrieved successfully',
    model: MaterialResponseDto,
    isArray: true,
    exampleMessage: 'Workspace materials fetched',
    exampleResult: [
      {
        id: '550e8400-e29b-41d4-a716-446655440500',
        workspaceId: '550e8400-e29b-41d4-a716-446655440100',
        title: 'Lesson 1 Slides',
        downloadUrl: '/materials/550e8400-e29b-41d4-a716-446655440500/download',
        status: 'ready',
        fileName: 'lesson-1-slides.pdf',
        mimeType: 'application/pdf',
        size: 248321,
        category: 'lecture',
        uploadedBy: '550e8400-e29b-41d4-a716-446655440000',
        createdAt: '2026-03-22T08:00:00.000Z',
        updatedAt: '2026-03-22T08:05:00.000Z',
      },
    ],
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
  ])
  async listWorkspaceMaterials(
    @Param('workspaceId') workspaceId: string,
  ) {
    const result = await this.materialsService.listWorkspaceMaterials(
      workspaceId,
    );

    return ApiResponse.success(result, 'Workspace materials fetched');
  }

  @Get('materials/:materialId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'material',
    scopeResourceIdParam: 'materialId',
  })
  @ApiOperation({
    summary: 'Get material detail',
    description: 'Returns detail information of a material. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Material detail retrieved successfully',
    model: MaterialResponseDto,
    exampleMessage: 'Material detail fetched',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440500',
      workspaceId: '550e8400-e29b-41d4-a716-446655440100',
      title: 'Lesson 1 Slides',
      downloadUrl: '/materials/550e8400-e29b-41d4-a716-446655440500/download',
      status: 'ready',
      fileName: 'lesson-1-slides.pdf',
      mimeType: 'application/pdf',
      size: 248321,
      category: 'lecture',
      uploadedBy: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: '2026-03-22T08:00:00.000Z',
      updatedAt: '2026-03-22T08:05:00.000Z',
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
    { status: 400, code: 'MATERIAL_NOT_FOUND', message: 'Material not found' },
  ])
  async getMaterialDetail(@Param('materialId') materialId: string) {
    const result = await this.materialsService.getMaterialDetail(materialId);

    return ApiResponse.success(result, 'Material detail fetched');
  }

  @Get('materials/:materialId/download')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'material',
    scopeResourceIdParam: 'materialId',
  })
  @ApiOperation({
    summary: 'Download material',
    description: 'Redirects to a signed S3 download URL for the target material.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiFoundResponse({
    description: 'Returns a 302 redirect to the signed S3 download URL for the target material.',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
  @ApiBusinessErrorResponses([
    { status: 400, code: 'MATERIAL_NOT_FOUND', message: 'Material not found' },
    {
      status: 400,
      code: 'MATERIAL_NOT_READY',
      message: 'Material is not ready for download',
    },
  ])
  async downloadMaterial(
    @Param('materialId') materialId: string,
    @Res() res: Response,
  ) {
    const result = await this.materialsService.getMaterialDownloadTarget(
      materialId,
    );
    return res.redirect(result.url);
  }

  @Delete('materials/:materialId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'material',
    scopeResourceIdParam: 'materialId',
  })
  @ApiOperation({
    summary: 'Delete material',
    description: 'Deletes a material record and its associated storage object. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Material deleted successfully',
    model: MaterialDeleteResponseDto,
    exampleMessage: 'Material deleted',
    exampleResult: {
      materialId: '550e8400-e29b-41d4-a716-446655440500',
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
    { status: 400, code: 'MATERIAL_NOT_FOUND', message: 'Material not found' },
  ])
  async deleteMaterial(@Param('materialId') materialId: string) {
    const result = await this.materialsService.deleteMaterial(materialId);

    return ApiResponse.success(result, 'Material deleted');
  }
}
