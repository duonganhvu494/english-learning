import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import type { AuthRequest } from 'src/auth/interfaces/auth-request.interface';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { AddClassStudentsDto } from './dto/add-class-students.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassStudentRoleDto } from './dto/update-class-student-role.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassesService } from './classes.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post('workspaces/:workspaceId/classes')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async createClass(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateClassDto,
    @Req() req: AuthRequest,
  ) {
    const classEntity = await this.classesService.createClass(
      workspaceId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(classEntity, 'Class created', 201);
  }

  @Get('workspaces/:workspaceId/classes')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async listWorkspaceClasses(
    @Param('workspaceId') workspaceId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.classesService.listWorkspaceClasses(
      workspaceId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Workspace classes fetched');
  }

  @Get('classes/:classId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async getClassDetail(
    @Param('classId') classId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.classesService.getClassDetail(
      classId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Class detail fetched');
  }

  @Get('classes/:classId/students')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async getClassStudents(
    @Param('classId') classId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.classesService.getClassStudents(
      classId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Class students fetched');
  }

  @Post('classes/:classId/students')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async addStudentsToClass(
    @Param('classId') classId: string,
    @Body() dto: AddClassStudentsDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.classesService.addStudentsToClass(
      classId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Students added to class');
  }

  @Patch('classes/:classId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async updateClass(
    @Param('classId') classId: string,
    @Body() dto: UpdateClassDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.classesService.updateClass(
      classId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Class updated');
  }

  @Delete('classes/:classId/students/:studentId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async removeStudentFromClass(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.classesService.removeStudentFromClass(
      classId,
      studentId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Student removed from class');
  }

  @Delete('classes/:classId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async deleteClass(
    @Param('classId') classId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.classesService.deleteClass(
      classId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Class deleted');
  }

  @Patch('classes/:classId/students/:studentId/role')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async updateClassStudentRole(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateClassStudentRoleDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.classesService.updateClassStudentRole(
      classId,
      studentId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Class student role updated');
  }
}
