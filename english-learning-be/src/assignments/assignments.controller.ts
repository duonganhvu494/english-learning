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
import { RequirePermission } from 'src/rbac/decorators/require-permission.decorator';
import { RequireRoles } from 'src/rbac/decorators/require-roles.decorator';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { AssignmentsQuizService } from './assignments-quiz.service';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentQuizOptionDto } from './dto/create-assignment-quiz-option.dto';
import { CreateAssignmentQuizQuestionDto } from './dto/create-assignment-quiz-question.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentQuizAttemptDto } from './dto/submit-assignment-quiz-attempt.dto';
import { UpdateAssignmentQuizOptionDto } from './dto/update-assignment-quiz-option.dto';
import { UpdateAssignmentQuizQuestionDto } from './dto/update-assignment-quiz-question.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(
    private readonly assignmentsService: AssignmentsService,
    private readonly assignmentsQuizService: AssignmentsQuizService,
  ) {}

  @Post('sessions/:sessionId/assignments')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'session',
    scopeResourceIdParam: 'sessionId',
  })
  async createAssignment(
    @Param('sessionId') sessionId: string,
    @Body() dto: CreateAssignmentDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.assignmentsService.createAssignment(
      sessionId,
      dto,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Assignment created', 201);
  }

  @Get('sessions/:sessionId/assignments')
  @UseGuards(RbacPermissionGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'session',
      scopeResourceIdParam: 'sessionId',
    }),
    requirePermissionAccess('read', 'assignment', {
      scopeType: 'class',
      scopeResourceType: 'session',
      scopeResourceIdParam: 'sessionId',
    }),
  ])
  async listSessionAssignments(@Param('sessionId') sessionId: string) {
    const result = await this.assignmentsService.listSessionAssignments(
      sessionId,
    );

    return ApiResponse.success(result, 'Session assignments fetched');
  }

  @Get('assignments/:assignmentId')
  @UseGuards(RbacPermissionGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'assignment',
      scopeResourceIdParam: 'assignmentId',
    }),
    requirePermissionAccess('read', 'assignment', {
      scopeType: 'class',
      scopeResourceType: 'assignment',
      scopeResourceIdParam: 'assignmentId',
    }),
  ])
  async getAssignmentDetail(@Param('assignmentId') assignmentId: string) {
    const result = await this.assignmentsService.getAssignmentDetail(
      assignmentId,
    );

    return ApiResponse.success(result, 'Assignment detail fetched');
  }

  @Get('assignments/:assignmentId/quiz/manage')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async getQuizManagement(@Param('assignmentId') assignmentId: string) {
    const result = await this.assignmentsQuizService.getQuizManagement(
      assignmentId,
    );

    return ApiResponse.success(result, 'Assignment quiz management fetched');
  }

  @Get('assignments/:assignmentId/quiz')
  @UseGuards(RbacPermissionGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'assignment',
      scopeResourceIdParam: 'assignmentId',
    }),
    requirePermissionAccess('read', 'assignment', {
      scopeType: 'class',
      scopeResourceType: 'assignment',
      scopeResourceIdParam: 'assignmentId',
    }),
  ])
  async getQuiz(@Param('assignmentId') assignmentId: string) {
    const result = await this.assignmentsQuizService.getQuiz(assignmentId);

    return ApiResponse.success(result, 'Assignment quiz fetched');
  }

  @Post('assignments/:assignmentId/quiz/questions')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async createQuizQuestion(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: CreateAssignmentQuizQuestionDto,
  ) {
    const result = await this.assignmentsQuizService.createQuizQuestion(
      assignmentId,
      dto,
    );

    return ApiResponse.success(result, 'Assignment quiz question created', 201);
  }

  @Patch('assignments/:assignmentId/quiz/questions/:questionId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async updateQuizQuestion(
    @Param('assignmentId') assignmentId: string,
    @Param('questionId') questionId: string,
    @Body() dto: UpdateAssignmentQuizQuestionDto,
  ) {
    const result = await this.assignmentsQuizService.updateQuizQuestion(
      assignmentId,
      questionId,
      dto,
    );

    return ApiResponse.success(result, 'Assignment quiz question updated');
  }

  @Delete('assignments/:assignmentId/quiz/questions/:questionId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async deleteQuizQuestion(
    @Param('assignmentId') assignmentId: string,
    @Param('questionId') questionId: string,
  ) {
    const result = await this.assignmentsQuizService.deleteQuizQuestion(
      assignmentId,
      questionId,
    );

    return ApiResponse.success(result, 'Assignment quiz question deleted');
  }

  @Post('assignments/:assignmentId/quiz/questions/:questionId/options')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async createQuizOption(
    @Param('assignmentId') assignmentId: string,
    @Param('questionId') questionId: string,
    @Body() dto: CreateAssignmentQuizOptionDto,
  ) {
    const result = await this.assignmentsQuizService.createQuizOption(
      assignmentId,
      questionId,
      dto,
    );

    return ApiResponse.success(result, 'Assignment quiz option created', 201);
  }

  @Patch('assignments/:assignmentId/quiz/options/:optionId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async updateQuizOption(
    @Param('assignmentId') assignmentId: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateAssignmentQuizOptionDto,
  ) {
    const result = await this.assignmentsQuizService.updateQuizOption(
      assignmentId,
      optionId,
      dto,
    );

    return ApiResponse.success(result, 'Assignment quiz option updated');
  }

  @Delete('assignments/:assignmentId/quiz/options/:optionId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async deleteQuizOption(
    @Param('assignmentId') assignmentId: string,
    @Param('optionId') optionId: string,
  ) {
    const result = await this.assignmentsQuizService.deleteQuizOption(
      assignmentId,
      optionId,
    );

    return ApiResponse.success(result, 'Assignment quiz option deleted');
  }

  @Get(
    'assignments/:assignmentId/quiz/questions/:questionId/materials/:materialId/download',
  )
  @UseGuards(RbacPermissionGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'assignment',
      scopeResourceIdParam: 'assignmentId',
    }),
    requirePermissionAccess('read', 'assignment', {
      scopeType: 'class',
      scopeResourceType: 'assignment',
      scopeResourceIdParam: 'assignmentId',
    }),
  ])
  async downloadQuizQuestionMaterial(
    @Param('assignmentId') assignmentId: string,
    @Param('questionId') questionId: string,
    @Param('materialId') materialId: string,
    @Res() res: Response,
  ) {
    const result =
      await this.assignmentsQuizService.getQuizQuestionMaterialDownloadTarget(
        assignmentId,
        questionId,
        materialId,
      );

    return res.redirect(result.url);
  }

  @Post('assignments/:assignmentId/quiz/attempts/me/start')
  @UseGuards(RbacPermissionGuard)
  @RequirePermission('read', 'assignment', {
    scopeType: 'class',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async startMyQuizAttempt(
    @Param('assignmentId') assignmentId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.assignmentsQuizService.startMyQuizAttempt(
      assignmentId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'Assignment quiz attempt started', 201);
  }

  @Get('assignments/:assignmentId/quiz/attempts/me')
  @UseGuards(RbacPermissionGuard)
  @RequirePermission('read', 'assignment', {
    scopeType: 'class',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async getMyQuizAttempt(
    @Param('assignmentId') assignmentId: string,
    @Req() req: AuthRequest,
  ) {
    const result = await this.assignmentsQuizService.getMyQuizAttempt(
      assignmentId,
      req.user.userId,
    );

    return ApiResponse.success(result, 'My assignment quiz attempt fetched');
  }

  @Post('assignments/:assignmentId/quiz/attempts/me/submit')
  @UseGuards(RbacPermissionGuard)
  @RequirePermission('read', 'assignment', {
    scopeType: 'class',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async submitMyQuizAttempt(
    @Param('assignmentId') assignmentId: string,
    @Body() dto: SubmitAssignmentQuizAttemptDto,
    @Req() req: AuthRequest,
  ) {
    const result = await this.assignmentsQuizService.submitMyQuizAttempt(
      assignmentId,
      req.user.userId,
      dto,
    );

    return ApiResponse.success(result, 'Assignment quiz submitted');
  }

  @Get('assignments/:assignmentId/quiz/attempts')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async listQuizAttempts(@Param('assignmentId') assignmentId: string) {
    const result = await this.assignmentsQuizService.listQuizAttempts(
      assignmentId,
    );

    return ApiResponse.success(result, 'Assignment quiz attempts fetched');
  }

  @Get('assignments/:assignmentId/quiz/attempts/:studentId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async getQuizAttempt(
    @Param('assignmentId') assignmentId: string,
    @Param('studentId') studentId: string,
  ) {
    const result = await this.assignmentsQuizService.getQuizAttempt(
      assignmentId,
      studentId,
    );

    return ApiResponse.success(result, 'Assignment quiz attempt fetched');
  }

  @Get('assignments/:assignmentId/materials/:materialId/download')
  @UseGuards(RbacPermissionGuard)
  @RequireAnyAccess([
    requireRoleAccess(['owner'], {
      scopeType: 'workspace',
      scopeResourceType: 'assignment',
      scopeResourceIdParam: 'assignmentId',
    }),
    requirePermissionAccess('read', 'assignment', {
      scopeType: 'class',
      scopeResourceType: 'assignment',
      scopeResourceIdParam: 'assignmentId',
    }),
  ])
  async downloadAssignmentMaterial(
    @Param('assignmentId') assignmentId: string,
    @Param('materialId') materialId: string,
    @Res() res: Response,
  ) {
    const result = await this.assignmentsService.getAssignmentMaterialDownloadTarget(
      assignmentId,
      materialId,
    );
    return res.redirect(result.url);
  }

  @Delete('assignments/:assignmentId')
  @UseGuards(RbacPermissionGuard)
  @RequireRoles(['owner'], {
    scopeType: 'workspace',
    scopeResourceType: 'assignment',
    scopeResourceIdParam: 'assignmentId',
  })
  async deleteAssignment(@Param('assignmentId') assignmentId: string) {
    const result = await this.assignmentsService.deleteAssignment(assignmentId);

    return ApiResponse.success(result, 'Assignment deleted');
  }
}
