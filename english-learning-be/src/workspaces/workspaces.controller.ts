// src/workspaces/workspaces.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { AddWorkspaceMemberDto } from './dto/add-workspace-member.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { ApiResponse } from 'src/common/dto/api-response.dto';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly service: WorkspacesService) {}

  @Post()
  async create(
    @Body() dto: CreateWorkspaceDto,
    @Req() req: AuthRequest,
  ) {
    const workspace = await this.service.createWorkspace(
      dto,
      req.user.userId,
    );
    return ApiResponse.success(workspace, 'Workspace created');
  }

  @Post(':id/members')
  async addMember(
    @Param('id') workspaceId: string,
    @Body() dto: AddWorkspaceMemberDto,
  ) {
    const member = await this.service.addMember(workspaceId, dto);
    return ApiResponse.success(member, 'Member added');
  }

  @Get('me')
  async myWorkspaces(@Req() req: AuthRequest) {
    const result = await this.service.listMyWorkspaces(
      req.user.userId,
    );
    return ApiResponse.success(result);
  }
}
