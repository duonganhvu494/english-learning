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
import type { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import {
  RequireAnyAccess,
  requirePermissionAccess,
  requireRoleAccess,
} from 'src/rbac/decorators/require-any-access.decorator';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { CreateLectureDto } from './dto/create-lecture.dto';
import { UpdateLectureDto } from './dto/update-lecture.dto';
import { LecturesService } from './lectures.service';

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
  async deleteLecture(@Param('lectureId') lectureId: string) {
    const result = await this.lecturesService.deleteLecture(lectureId);

    return ApiResponse.success(result, 'Lecture deleted');
  }
}
