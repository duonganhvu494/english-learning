import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RbacService } from 'src/rbac/rbac.service';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { AssignmentsQuizService } from './assignments-quiz.service';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;
  let assignmentsService: {
    createAssignment: jest.Mock;
    getAssignmentDetail: jest.Mock;
  };
  let assignmentsQuizService: {
    getQuiz: jest.Mock;
    getQuizQuestionMaterialDownloadTarget: jest.Mock;
    submitMyQuizAttempt: jest.Mock;
  };

  beforeEach(async () => {
    assignmentsService = {
      createAssignment: jest.fn(),
      getAssignmentDetail: jest.fn(),
    };
    assignmentsQuizService = {
      getQuiz: jest.fn(),
      getQuizQuestionMaterialDownloadTarget: jest.fn(),
      submitMyQuizAttempt: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        {
          provide: AssignmentsService,
          useValue: assignmentsService,
        },
        {
          provide: AssignmentsQuizService,
          useValue: assignmentsQuizService,
        },
        {
          provide: RbacPermissionGuard,
          useValue: {},
        },
        {
          provide: Reflector,
          useValue: {},
        },
        {
          provide: RbacService,
          useValue: {},
        },
        {
          provide: WorkspaceAccessService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates an assignment for the current owner and wraps the response', async () => {
    assignmentsService.createAssignment.mockResolvedValue({ id: 'assignment-1' });

    const result = await controller.createAssignment(
      'session-1',
      {
        title: 'Homework 01',
        timeStart: '2026-03-19T10:00:00.000Z',
        timeEnd: '2026-03-20T10:00:00.000Z',
      },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(assignmentsService.createAssignment).toHaveBeenCalledWith(
      'session-1',
      {
        title: 'Homework 01',
        timeStart: '2026-03-19T10:00:00.000Z',
        timeEnd: '2026-03-20T10:00:00.000Z',
      },
      'owner-1',
    );
    expect(result).toEqual({
      statusCode: 201,
      message: 'Assignment created',
      result: { id: 'assignment-1' },
    });
  });

  it('returns the public quiz payload', async () => {
    assignmentsQuizService.getQuiz.mockResolvedValue({
      assignmentId: 'assignment-quiz-1',
      questions: [],
    });

    const result = await controller.getQuiz('assignment-quiz-1');

    expect(assignmentsQuizService.getQuiz).toHaveBeenCalledWith(
      'assignment-quiz-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Assignment quiz fetched',
      result: {
        assignmentId: 'assignment-quiz-1',
        questions: [],
      },
    });
  });

  it('redirects quiz question material download to the signed url', async () => {
    const res = { redirect: jest.fn() };
    assignmentsQuizService.getQuizQuestionMaterialDownloadTarget.mockResolvedValue({
      type: 'remote',
      url: 'https://signed-quiz-material',
    });

    await controller.downloadQuizQuestionMaterial(
      'assignment-1',
      'question-1',
      'material-1',
      res as never,
    );

    expect(
      assignmentsQuizService.getQuizQuestionMaterialDownloadTarget,
    ).toHaveBeenCalledWith('assignment-1', 'question-1', 'material-1');
    expect(res.redirect).toHaveBeenCalledWith('https://signed-quiz-material');
  });

  it('submits the current student quiz attempt', async () => {
    assignmentsQuizService.submitMyQuizAttempt.mockResolvedValue({
      assignmentId: 'assignment-1',
      studentId: 'student-1',
      status: 'submitted',
      score: 8,
    });

    const result = await controller.submitMyQuizAttempt(
      'assignment-1',
      {
        answers: [
          {
            questionId: 'question-1',
            selectedOptionId: 'option-1',
          },
        ],
      },
      { user: { userId: 'student-1' } } as never,
    );

    expect(assignmentsQuizService.submitMyQuizAttempt).toHaveBeenCalledWith(
      'assignment-1',
      'student-1',
      {
        answers: [
          {
            questionId: 'question-1',
            selectedOptionId: 'option-1',
          },
        ],
      },
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Assignment quiz submitted',
      result: {
        assignmentId: 'assignment-1',
        studentId: 'student-1',
        status: 'submitted',
        score: 8,
      },
    });
  });
});
