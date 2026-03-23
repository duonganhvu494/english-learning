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
import { AssignmentDeleteResponseDto } from './dto/assignment-delete-response.dto';
import { AssignmentQuizAttemptResponseDto } from './dto/assignment-quiz-attempt-response.dto';
import { AssignmentQuizManagementResponseDto } from './dto/assignment-quiz-management-response.dto';
import { AssignmentQuizOptionDeleteResponseDto } from './dto/assignment-quiz-option-delete-response.dto';
import { AssignmentQuizQuestionDeleteResponseDto } from './dto/assignment-quiz-question-delete-response.dto';
import { AssignmentQuizQuestionManagementResponseDto } from './dto/assignment-quiz-question-management-response.dto';
import { AssignmentQuizResponseDto } from './dto/assignment-quiz-response.dto';
import { AssignmentResponseDto } from './dto/assignment-response.dto';
import { CreateAssignmentQuizOptionDto } from './dto/create-assignment-quiz-option.dto';
import { CreateAssignmentQuizQuestionDto } from './dto/create-assignment-quiz-question.dto';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentQuizAttemptDto } from './dto/submit-assignment-quiz-attempt.dto';
import { UpdateAssignmentQuizOptionDto } from './dto/update-assignment-quiz-option.dto';
import { UpdateAssignmentQuizQuestionDto } from './dto/update-assignment-quiz-question.dto';

@ApiTags('Assignments')
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
  @ApiOperation({
    summary: 'Create assignment',
    description: 'Creates a manual or quiz assignment for a session. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Assignment created successfully',
    model: AssignmentResponseDto,
    exampleMessage: 'Assignment created',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440800',
      code: 'ASM-001',
      sessionId: '550e8400-e29b-41d4-a716-446655440400',
      classId: '550e8400-e29b-41d4-a716-446655440200',
      type: 'manual',
      title: 'Homework 01',
      description: 'Complete the worksheet before class',
      timeStart: '2026-03-25T08:00:00.000Z',
      timeEnd: '2026-03-27T23:59:59.000Z',
      status: 'upcoming',
      materials: [],
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
    { status: 400, code: 'ASSIGNMENT_SESSION_NOT_FOUND', message: 'Session not found' },
    { status: 400, code: 'ASSIGNMENT_TITLE_REQUIRED', message: 'title can not be empty' },
    {
      status: 400,
      code: 'ASSIGNMENT_TITLE_ALREADY_EXISTS_IN_SESSION',
      message: 'An assignment with the same title already exists in this session',
    },
    { status: 400, code: 'ASSIGNMENT_TIME_START_INVALID', message: 'timeStart is invalid' },
    { status: 400, code: 'ASSIGNMENT_TIME_END_INVALID', message: 'timeEnd is invalid' },
    { status: 400, code: 'ASSIGNMENT_TIME_WINDOW_INVALID', message: 'timeEnd must be greater than timeStart' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
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
  @ApiOperation({
    summary: 'List session assignments',
    description:
      'Returns all assignments of a session when the user is the workspace owner or has class assignment read permission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Session assignments retrieved successfully',
    model: AssignmentResponseDto,
    isArray: true,
    exampleMessage: 'Session assignments fetched',
    exampleResult: [
      {
        id: '550e8400-e29b-41d4-a716-446655440800',
        code: 'ASM-001',
        sessionId: '550e8400-e29b-41d4-a716-446655440400',
        classId: '550e8400-e29b-41d4-a716-446655440200',
        type: 'manual',
        title: 'Homework 01',
        description: 'Complete the worksheet before class',
        timeStart: '2026-03-25T08:00:00.000Z',
        timeEnd: '2026-03-27T23:59:59.000Z',
        status: 'open',
        materials: [],
        createdAt: '2026-03-22T08:00:00.000Z',
        updatedAt: '2026-03-22T08:00:00.000Z',
      },
    ],
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have access to session assignments' })
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
  @ApiOperation({
    summary: 'Get assignment detail',
    description:
      'Returns assignment details when the user is the workspace owner or has class assignment read permission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment detail retrieved successfully',
    model: AssignmentResponseDto,
    exampleMessage: 'Assignment detail fetched',
    exampleResult: {
      id: '550e8400-e29b-41d4-a716-446655440800',
      code: 'ASM-001',
      sessionId: '550e8400-e29b-41d4-a716-446655440400',
      classId: '550e8400-e29b-41d4-a716-446655440200',
      type: 'manual',
      title: 'Homework 01',
      description: 'Complete the worksheet before class',
      timeStart: '2026-03-25T08:00:00.000Z',
      timeEnd: '2026-03-27T23:59:59.000Z',
      status: 'open',
      materials: [],
      createdAt: '2026-03-22T08:00:00.000Z',
      updatedAt: '2026-03-22T08:00:00.000Z',
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have access to this assignment' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 403, code: 'RBAC_PERMISSION_DENIED', message: 'Permission access denied' },
    { status: 400, code: 'ASSIGNMENT_NOT_FOUND', message: 'Assignment not found' },
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
  @ApiOperation({
    summary: 'Get quiz management detail',
    description: 'Returns full quiz management data for an assignment. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment quiz management retrieved successfully',
    model: AssignmentQuizManagementResponseDto,
    exampleMessage: 'Assignment quiz management fetched',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440801',
      title: 'Quiz 01',
      timeStart: '2026-03-25T08:00:00.000Z',
      timeEnd: '2026-03-27T23:59:59.000Z',
      questions: [
        {
          id: '550e8400-e29b-41d4-a716-446655440810',
          content: 'Choose the correct answer',
          type: 'single_choice',
          points: 1,
          sortOrder: 0,
          material: null,
          options: [
            {
              id: '550e8400-e29b-41d4-a716-446655440820',
              content: 'He goes to school every day.',
              isCorrect: true,
              sortOrder: 0,
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440821',
              content: 'He go to school every day.',
              isCorrect: false,
              sortOrder: 1,
            },
          ],
        },
      ],
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
    { status: 400, code: 'ASSIGNMENT_NOT_FOUND', message: 'Assignment not found' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_TYPE_REQUIRED', message: 'Assignment is not a quiz' },
  ])
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
  @ApiOperation({
    summary: 'Get quiz',
    description:
      'Returns the public quiz view when the user is the workspace owner or has class assignment read permission.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment quiz retrieved successfully',
    model: AssignmentQuizResponseDto,
    exampleMessage: 'Assignment quiz fetched',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440801',
      title: 'Quiz 01',
      timeStart: '2026-03-25T08:00:00.000Z',
      timeEnd: '2026-03-27T23:59:59.000Z',
      status: 'open',
      questions: [
        {
          id: '550e8400-e29b-41d4-a716-446655440810',
          content: 'Choose the correct answer',
          type: 'single_choice',
          points: 1,
          sortOrder: 0,
          material: null,
          options: [
            {
              id: '550e8400-e29b-41d4-a716-446655440820',
              content: 'He goes to school every day.',
              sortOrder: 0,
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440821',
              content: 'He go to school every day.',
              sortOrder: 1,
            },
          ],
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have access to this quiz' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_ROLE_DENIED', message: 'Role access denied' },
    { status: 403, code: 'RBAC_PERMISSION_DENIED', message: 'Permission access denied' },
    { status: 400, code: 'ASSIGNMENT_NOT_FOUND', message: 'Assignment not found' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_TYPE_REQUIRED', message: 'Assignment is not a quiz' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_NOT_READY', message: 'Quiz is not ready yet' },
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
  @ApiOperation({
    summary: 'Create quiz question',
    description: 'Creates a quiz question for an assignment. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Assignment quiz question created successfully',
    model: AssignmentQuizQuestionManagementResponseDto,
    exampleMessage: 'Assignment quiz question created',
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
    { status: 400, code: 'ASSIGNMENT_NOT_FOUND', message: 'Assignment not found' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_TYPE_REQUIRED', message: 'Assignment is not a quiz' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_ALREADY_STARTED', message: 'Cannot modify quiz after students have started attempting it' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
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
  @ApiOperation({
    summary: 'Update quiz question',
    description: 'Updates a quiz question. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment quiz question updated successfully',
    model: AssignmentQuizQuestionManagementResponseDto,
    exampleMessage: 'Assignment quiz question updated',
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
    { status: 400, code: 'ASSIGNMENT_QUIZ_QUESTION_NOT_FOUND', message: 'Quiz question not found' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_ALREADY_STARTED', message: 'Cannot modify quiz after students have started attempting it' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
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
  @ApiOperation({
    summary: 'Delete quiz question',
    description: 'Deletes a quiz question. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment quiz question deleted successfully',
    model: AssignmentQuizQuestionDeleteResponseDto,
    exampleMessage: 'Assignment quiz question deleted',
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
    { status: 400, code: 'ASSIGNMENT_QUIZ_QUESTION_NOT_FOUND', message: 'Quiz question not found' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_ALREADY_STARTED', message: 'Cannot modify quiz after students have started attempting it' },
  ])
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
  @ApiOperation({
    summary: 'Create quiz option',
    description: 'Creates an option for a quiz question. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Assignment quiz option created successfully',
    model: AssignmentQuizQuestionManagementResponseDto,
    exampleMessage: 'Assignment quiz option created',
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
    { status: 400, code: 'ASSIGNMENT_QUIZ_QUESTION_NOT_FOUND', message: 'Quiz question not found' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_ALREADY_STARTED', message: 'Cannot modify quiz after students have started attempting it' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
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
  @ApiOperation({
    summary: 'Update quiz option',
    description: 'Updates a quiz option. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment quiz option updated successfully',
    model: AssignmentQuizQuestionManagementResponseDto,
    exampleMessage: 'Assignment quiz option updated',
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
    { status: 400, code: 'ASSIGNMENT_QUIZ_OPTION_NOT_FOUND', message: 'Quiz option not found' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_ALREADY_STARTED', message: 'Cannot modify quiz after students have started attempting it' },
    { status: 400, code: 'VALIDATION_ERROR', message: 'Validation failed' },
  ])
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
  @ApiOperation({
    summary: 'Delete quiz option',
    description: 'Deletes a quiz option. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment quiz option deleted successfully',
    model: AssignmentQuizOptionDeleteResponseDto,
    exampleMessage: 'Assignment quiz option deleted',
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
    { status: 400, code: 'ASSIGNMENT_QUIZ_OPTION_NOT_FOUND', message: 'Quiz option not found' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_ALREADY_STARTED', message: 'Cannot modify quiz after students have started attempting it' },
  ])
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
  @ApiOperation({
    summary: 'Download quiz question material',
    description: 'Redirects to a signed URL for the material attached to a quiz question.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiFoundResponse({
    description: 'Returns a 302 redirect to the signed download URL for the quiz question material.',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'User does not have access to this material' })
  @ApiBusinessErrorResponses([
    {
      status: 400,
      code: 'ASSIGNMENT_QUIZ_QUESTION_MATERIAL_NOT_ATTACHED',
      message: 'Material is not attached to this quiz question',
    },
    {
      status: 400,
      code: 'ASSIGNMENT_QUIZ_QUESTION_MATERIAL_NOT_READY',
      message: 'Quiz question material is not ready for download',
    },
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
  @ApiOperation({
    summary: 'Start my quiz attempt',
    description: 'Starts the current student quiz attempt for an assignment.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 201,
    description: 'Assignment quiz attempt started successfully',
    model: AssignmentQuizAttemptResponseDto,
    exampleMessage: 'Assignment quiz attempt started',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440801',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      status: 'in_progress',
      attemptId: '550e8400-e29b-41d4-a716-446655440830',
      startedAt: '2026-03-25T08:10:00.000Z',
      submittedAt: null,
      score: null,
      maxScore: 10,
      correctCount: 0,
      totalQuestions: 10,
      answers: [],
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have permission to attempt this quiz' })
  @ApiBusinessErrorResponses([
    { status: 401, code: 'AUTH_UNAUTHORIZED', message: 'Unauthorized' },
    {
      status: 401,
      code: 'AUTH_PASSWORD_CHANGE_REQUIRED',
      message: 'Password change is required before accessing this resource',
    },
    { status: 403, code: 'RBAC_PERMISSION_DENIED', message: 'Permission access denied' },
    { status: 403, code: 'ASSIGNMENT_QUIZ_CLASS_MEMBERSHIP_REQUIRED', message: 'Student does not belong to this class' },
    { status: 403, code: 'ASSIGNMENT_QUIZ_STUDENT_ROLE_REQUIRED', message: 'Only students can take assignment quizzes' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_NOT_OPEN_YET', message: 'Assignment quiz has not opened yet' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_CLOSED', message: 'Assignment quiz window has closed' },
    { status: 400, code: 'ASSIGNMENT_QUIZ_NOT_READY', message: 'Quiz is not ready yet' },
  ])
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
  @ApiOperation({
    summary: 'Get my quiz attempt',
    description: 'Returns the current student quiz attempt for an assignment.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'My assignment quiz attempt retrieved successfully',
    model: AssignmentQuizAttemptResponseDto,
    exampleMessage: 'My assignment quiz attempt fetched',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440801',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      status: 'submitted',
      attemptId: '550e8400-e29b-41d4-a716-446655440830',
      startedAt: '2026-03-25T08:10:00.000Z',
      submittedAt: '2026-03-25T08:15:00.000Z',
      score: 8.5,
      maxScore: 10,
      correctCount: 8,
      totalQuestions: 10,
      answers: [
        {
          questionId: '550e8400-e29b-41d4-a716-446655440810',
          selectedOptionId: '550e8400-e29b-41d4-a716-446655440820',
          isCorrect: true,
          awardedPoints: 1,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have permission to access this quiz attempt' })
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
  @ApiOperation({
    summary: 'Submit my quiz attempt',
    description: 'Submits answers for the current student quiz attempt.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment quiz submitted successfully',
    model: AssignmentQuizAttemptResponseDto,
    exampleMessage: 'Assignment quiz submitted',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440801',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      status: 'submitted',
      attemptId: '550e8400-e29b-41d4-a716-446655440830',
      startedAt: '2026-03-25T08:10:00.000Z',
      submittedAt: '2026-03-25T08:15:00.000Z',
      score: 8.5,
      maxScore: 10,
      correctCount: 8,
      totalQuestions: 10,
      answers: [
        {
          questionId: '550e8400-e29b-41d4-a716-446655440810',
          selectedOptionId: '550e8400-e29b-41d4-a716-446655440820',
          isCorrect: true,
          awardedPoints: 1,
        },
      ],
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'User does not have permission to submit this quiz attempt' })
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
  @ApiOperation({
    summary: 'List quiz attempts',
    description: 'Returns all quiz attempts for an assignment. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment quiz attempts retrieved successfully',
    model: AssignmentQuizAttemptResponseDto,
    isArray: true,
    exampleMessage: 'Assignment quiz attempts fetched',
    exampleResult: [
      {
        assignmentId: '550e8400-e29b-41d4-a716-446655440801',
        studentId: '550e8400-e29b-41d4-a716-446655440010',
        status: 'submitted',
        attemptId: '550e8400-e29b-41d4-a716-446655440830',
        startedAt: '2026-03-25T08:10:00.000Z',
        submittedAt: '2026-03-25T08:15:00.000Z',
        score: 8.5,
        maxScore: 10,
        correctCount: 8,
        totalQuestions: 10,
        answers: [],
      },
    ],
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
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
  @ApiOperation({
    summary: 'Get student quiz attempt',
    description: 'Returns a specific student quiz attempt. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment quiz attempt retrieved successfully',
    model: AssignmentQuizAttemptResponseDto,
    exampleMessage: 'Assignment quiz attempt fetched',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440801',
      studentId: '550e8400-e29b-41d4-a716-446655440010',
      status: 'submitted',
      attemptId: '550e8400-e29b-41d4-a716-446655440830',
      startedAt: '2026-03-25T08:10:00.000Z',
      submittedAt: '2026-03-25T08:15:00.000Z',
      score: 8.5,
      maxScore: 10,
      correctCount: 8,
      totalQuestions: 10,
      answers: [],
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated or must change password first' })
  @ApiForbiddenResponse({ description: 'Owner role is required' })
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
  @ApiOperation({
    summary: 'Download assignment material',
    description: 'Redirects to a signed URL for a material attached to the assignment.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiFoundResponse({
    description: 'Returns a 302 redirect to the signed download URL for the assignment material.',
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ description: 'User does not have access to this assignment material' })
  @ApiBusinessErrorResponses([
    {
      status: 400,
      code: 'ASSIGNMENT_MATERIAL_NOT_ATTACHED',
      message: 'Material is not attached to this assignment',
    },
    {
      status: 400,
      code: 'ASSIGNMENT_MATERIAL_NOT_READY',
      message: 'Assignment material is not ready for download',
    },
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
  @ApiOperation({
    summary: 'Delete assignment',
    description: 'Deletes an assignment when business rules allow it. Owner access required.',
  })
  @ApiCookieAuth('cookieAuth')
  @ApiSecurity('csrfHeader')
  @ApiEnvelopeResponse({
    status: 200,
    description: 'Assignment deleted successfully',
    model: AssignmentDeleteResponseDto,
    exampleMessage: 'Assignment deleted',
    exampleResult: {
      assignmentId: '550e8400-e29b-41d4-a716-446655440800',
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
    { status: 400, code: 'ASSIGNMENT_NOT_FOUND', message: 'Assignment not found' },
    {
      status: 400,
      code: 'ASSIGNMENT_DELETE_BLOCKED_HAS_SUBMISSIONS',
      message: 'Cannot delete assignment after students have submitted work',
    },
    {
      status: 400,
      code: 'ASSIGNMENT_DELETE_BLOCKED_HAS_ATTEMPTS',
      message: 'Cannot delete assignment after students have started quiz attempts',
    },
  ])
  async deleteAssignment(@Param('assignmentId') assignmentId: string) {
    const result = await this.assignmentsService.deleteAssignment(assignmentId);

    return ApiResponse.success(result, 'Assignment deleted');
  }
}
