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
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { AbortMaterialUploadDto } from 'src/materials/dto/abort-material-upload.dto';
import { CompleteMaterialUploadDto } from 'src/materials/dto/complete-material-upload.dto';
import { SignMaterialUploadPartDto } from 'src/materials/dto/sign-material-upload-part.dto';
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { InitSubmissionUploadDto } from './dto/init-submission-upload.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmissionsService } from './submissions.service';

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
