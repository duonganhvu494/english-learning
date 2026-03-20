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
  async signMaterialUploadPart(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: SignMaterialUploadPartDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.materialsService.signMaterialUploadPart(
      workspaceId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Material upload part signed');
  }

  @Post('workspaces/:workspaceId/materials/upload-complete')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async completeMaterialUpload(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CompleteMaterialUploadDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.materialsService.completeMaterialUpload(
      workspaceId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Material upload completed');
  }

  @Post('workspaces/:workspaceId/materials/upload-abort')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async abortMaterialUpload(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AbortMaterialUploadDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.materialsService.abortMaterialUpload(
      workspaceId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Material upload aborted');
  }

  @Get('workspaces/:workspaceId/materials')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async listWorkspaceMaterials(
    @Param('workspaceId') workspaceId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.materialsService.listWorkspaceMaterials(
      workspaceId,
      req.user.userId,
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
  async deleteMaterial(@Param('materialId') materialId: string) {
    const result = await this.materialsService.deleteMaterial(materialId);

    return ApiResponse.success(result, 'Material deleted');
  }
}
