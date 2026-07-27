import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ApiResponse } from 'src/common/dto/api-response.dto';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { WorkspacePlanGuard } from 'src/rbac/guards/workspace-plan.guard';
import { CreateStudentDto } from 'src/users/dto/create-student.dto';
import { AddClassStudentsDto } from './dto/add-class-students.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { CreateClassStudentResponseDto } from './dto/create-class-student-response.dto';
import { UpdateClassStudentRoleDto } from './dto/update-class-student-role.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassesService } from './classes.service';
import { ClassResponseDto } from './dto/class-response.dto';
import { ClassRosterResponseDto } from './dto/class-roster-response.dto';
import { ClassStudentsResponseDto } from './dto/class-students-response.dto';
import { ClassDeleteResponseDto } from './dto/class-delete-response.dto';
import { ClassStudentRoleResponseDto } from './dto/class-student-role-response.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post('workspaces/:workspaceId/classes')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async createClass(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateClassDto,
  ): Promise<ApiResponse<ClassResponseDto>> {
    const classEntity = await this.classesService.createClass(
      workspaceId,
      dto,
    );

    return ApiResponse.success(classEntity, 'Class created', 201);
  }

  @Get('workspaces/:workspaceId/classes')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeIdParam: 'workspaceId',
  })
  async listWorkspaceClasses(
    @Param('workspaceId') workspaceId: string,
  ): Promise<ApiResponse<ClassResponseDto[]>> {
    const result = await this.classesService.listWorkspaceClasses(
      workspaceId,
    );

    return ApiResponse.success(result, 'Workspace classes fetched');
  }

  @Get('classes/:classId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async getClassDetail(
    @Param('classId') classId: string,
  ): Promise<ApiResponse<ClassResponseDto>> {
    const result = await this.classesService.getClassDetail(classId);

    return ApiResponse.success(result, 'Class detail fetched');
  }

  @Get('classes/:classId/students')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async getClassStudents(
    @Param('classId') classId: string,
  ): Promise<ApiResponse<ClassRosterResponseDto>> {
    const result = await this.classesService.getClassStudents(classId);

    return ApiResponse.success(result, 'Class students fetched');
  }

  @Post('classes/:classId/students')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async addStudentsToClass(
    @Param('classId') classId: string,
    @Body() dto: AddClassStudentsDto,
  ): Promise<ApiResponse<ClassStudentsResponseDto>> {
    const result = await this.classesService.addStudentsToClass(
      classId,
      dto,
    );

    return ApiResponse.success(result, 'Students added to class');
  }

  @Post('classes/:classId/students/create')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async createStudentForClass(
    @Param('classId') classId: string,
    @Body() dto: CreateStudentDto,
  ): Promise<ApiResponse<CreateClassStudentResponseDto>> {
    const result = await this.classesService.createStudentForClass(
      classId,
      dto,
    );
    const statusCode = result.mode === 'already_assigned' ? 200 : 201;

    return ApiResponse.success(
      result,
      this.getClassStudentMessage(result.mode),
      statusCode,
    );
  }

  @Patch('classes/:classId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async updateClass(
    @Param('classId') classId: string,
    @Body() dto: UpdateClassDto,
  ): Promise<ApiResponse<ClassResponseDto>> {
    const result = await this.classesService.updateClass(
      classId,
      dto,
    );

    return ApiResponse.success(result, 'Class updated');
  }

  @Delete('classes/:classId/students/:studentId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async removeStudentFromClass(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ): Promise<ApiResponse<ClassStudentsResponseDto>> {
    const result = await this.classesService.removeStudentFromClass(
      classId,
      studentId,
    );

    return ApiResponse.success(result, 'Student removed from class');
  }

  @Delete('classes/:classId')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async deleteClass(
    @Param('classId') classId: string,
  ): Promise<ApiResponse<ClassDeleteResponseDto>> {
    const result = await this.classesService.deleteClass(classId);

    return ApiResponse.success(result, 'Class deleted');
  }

  @Patch('classes/:classId/students/:studentId/role')
  @UseGuards(RbacPermissionGuard, WorkspacePlanGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'class',
    scopeResourceIdParam: 'classId',
  })
  async updateClassStudentRole(
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateClassStudentRoleDto,
  ): Promise<ApiResponse<ClassStudentRoleResponseDto>> {
    const result = await this.classesService.updateClassStudentRole(
      classId,
      studentId,
      dto,
    );

    return ApiResponse.success(result, 'Class student role updated');
  }

  private getClassStudentMessage(
    mode: CreateClassStudentResponseDto['mode'],
  ): string {
    switch (mode) {
      case 'created':
        return 'Student created and added to class';
      case 'attached':
        return 'Existing student added to class';
      case 'already_assigned':
        return 'Student already exists in class';
    }
  }
}
