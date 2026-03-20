import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import {
  Material,
  MaterialStatus,
} from 'src/materials/entities/material.entity';
import { S3StorageService } from 'src/storage/s3-storage.service';
import { AccountType } from 'src/users/entities/user.entity';
import { AssignmentsQuizService } from './assignments-quiz.service';
import {
  AssignmentEntity,
  AssignmentType,
} from './entities/assignment.entity';
import {
  AssignmentQuizAttemptEntity,
  AssignmentQuizAttemptStatus,
} from './entities/assignment-quiz-attempt.entity';
import { AssignmentQuizAttemptAnswerEntity } from './entities/assignment-quiz-attempt-answer.entity';
import { AssignmentQuizOptionEntity } from './entities/assignment-quiz-option.entity';
import {
  AssignmentQuizQuestionEntity,
  AssignmentQuizQuestionType,
} from './entities/assignment-quiz-question.entity';

describe('AssignmentsQuizService', () => {
  let service: AssignmentsQuizService;

  let assignmentRepo: {
    findOne: jest.Mock;
  };
  let questionRepo: {
    create: jest.Mock;
    count: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let optionRepo: {
    count: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let attemptRepo: {
    count: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    manager: {
      transaction: jest.Mock;
    };
  };
  let attemptAnswerRepo: Record<string, never>;
  let materialRepo: {
    findOne: jest.Mock;
  };
  let classStudentRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let s3StorageService: {
    createSignedDownloadUrl: jest.Mock;
  };

  const student = {
    id: 'student-1',
    fullName: 'Nguyen Van A',
    accountType: AccountType.STUDENT,
  };

  beforeEach(async () => {
    questionRepo = {
      create: jest.fn((input: Partial<AssignmentQuizQuestionEntity>) => input),
      count: jest.fn(),
      save: jest.fn((input: Partial<AssignmentQuizQuestionEntity>) =>
        Promise.resolve({
          id: input.id ?? 'question-1',
          ...input,
        }),
      ),
      findOne: jest.fn(),
    };
    optionRepo = {
      count: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(undefined),
      })),
    };
    attemptRepo = {
      count: jest.fn().mockResolvedValue(0),
      findOne: jest.fn(),
      create: jest.fn((input: Partial<AssignmentQuizAttemptEntity>) => input),
      save: jest.fn((input: Partial<AssignmentQuizAttemptEntity>) =>
        Promise.resolve({
          id: input.id ?? 'attempt-1',
          ...input,
        }),
      ),
      find: jest.fn(),
      manager: {
        transaction: jest.fn(
          (
            callback: (manager: {
              getRepository: (
                entity:
                  | typeof AssignmentQuizAttemptEntity
                  | typeof AssignmentQuizAttemptAnswerEntity,
              ) => {
                save: jest.Mock;
                delete: jest.Mock;
                create?: jest.Mock;
              };
            }) => Promise<unknown>,
          ) =>
            callback({
              getRepository: jest.fn(
                (
                  entity:
                    | typeof AssignmentQuizAttemptEntity
                    | typeof AssignmentQuizAttemptAnswerEntity,
                ) => {
                  if (entity === AssignmentQuizAttemptEntity) {
                    return { save: attemptRepo.save, delete: jest.fn() };
                  }

                  if (entity === AssignmentQuizAttemptAnswerEntity) {
                    return {
                      delete: jest.fn().mockResolvedValue({ affected: 0 }),
                      save: jest.fn().mockResolvedValue(undefined),
                      create: jest.fn(
                        (
                          input: Partial<AssignmentQuizAttemptAnswerEntity>,
                        ) => input,
                      ),
                    };
                  }

                  throw new Error('Unexpected repository in transaction');
                },
              ),
            }),
        ),
      },
    };
    assignmentRepo = {
      findOne: jest.fn(),
    };
    attemptAnswerRepo = {};
    materialRepo = {
      findOne: jest.fn(),
    };
    classStudentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    s3StorageService = {
      createSignedDownloadUrl: jest
        .fn()
        .mockResolvedValue('https://signed-quiz-material'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsQuizService,
        {
          provide: getRepositoryToken(AssignmentEntity),
          useValue: assignmentRepo,
        },
        {
          provide: getRepositoryToken(AssignmentQuizQuestionEntity),
          useValue: questionRepo,
        },
        {
          provide: getRepositoryToken(AssignmentQuizOptionEntity),
          useValue: optionRepo,
        },
        {
          provide: getRepositoryToken(AssignmentQuizAttemptEntity),
          useValue: attemptRepo,
        },
        {
          provide: getRepositoryToken(AssignmentQuizAttemptAnswerEntity),
          useValue: attemptAnswerRepo,
        },
        {
          provide: getRepositoryToken(Material),
          useValue: materialRepo,
        },
        {
          provide: getRepositoryToken(ClassStudent),
          useValue: classStudentRepo,
        },
        {
          provide: S3StorageService,
          useValue: s3StorageService,
        },
      ],
    }).compile();

    service = module.get<AssignmentsQuizService>(AssignmentsQuizService);
  });

  it('returns a public quiz response without leaking correct-answer metadata', async () => {
    assignmentRepo.findOne.mockResolvedValue({
      id: 'assignment-1',
      type: AssignmentType.QUIZ,
      title: 'Quiz 01',
      timeStart: new Date('2020-03-19T10:00:00.000Z'),
      timeEnd: new Date('2099-03-20T10:00:00.000Z'),
      session: {
        classEntity: {
          id: 'class-1',
        },
      },
      quizQuestions: [
        {
          id: 'question-1',
          content: '2 + 2 = ?',
          type: AssignmentQuizQuestionType.SINGLE_CHOICE,
          points: 1,
          sortOrder: 0,
          material: null,
          options: [
            {
              id: 'option-1',
              content: '3',
              sortOrder: 0,
              isCorrect: false,
            },
            {
              id: 'option-2',
              content: '4',
              sortOrder: 1,
              isCorrect: true,
            },
          ],
        },
      ],
    });

    const result = await service.getQuiz('assignment-1');

    expect(result).toEqual({
      assignmentId: 'assignment-1',
      title: 'Quiz 01',
      timeStart: new Date('2020-03-19T10:00:00.000Z'),
      timeEnd: new Date('2099-03-20T10:00:00.000Z'),
      status: 'open',
      questions: [
        {
          id: 'question-1',
          content: '2 + 2 = ?',
          type: AssignmentQuizQuestionType.SINGLE_CHOICE,
          points: 1,
          sortOrder: 0,
          material: null,
          options: [
            {
              id: 'option-1',
              content: '3',
              sortOrder: 0,
            },
            {
              id: 'option-2',
              content: '4',
              sortOrder: 1,
            },
          ],
        },
      ],
    });
    expect(
      result.questions.flatMap((question) => question.options).every(
        (option) => !Object.hasOwn(option, 'isCorrect'),
      ),
    ).toBe(true);
  });

  it('creates a single-choice quiz question with an optional ready material', async () => {
    assignmentRepo.findOne.mockResolvedValue({
      id: 'assignment-1',
      type: AssignmentType.QUIZ,
      session: {
        classEntity: {
          id: 'class-1',
          workspace: { id: 'workspace-1' },
        },
      },
      quizQuestions: [],
    });
    materialRepo.findOne.mockResolvedValue({
      id: 'material-1',
      status: MaterialStatus.READY,
      bucket: 'bucket-1',
      objectKey: 'workspace-1/quiz/question-material.png',
      fileName: 'question-material.png',
      workspace: { id: 'workspace-1' },
    });
    questionRepo.count.mockResolvedValue(0);
    questionRepo.findOne.mockResolvedValue({
      id: 'question-1',
      content: 'What do you see in the picture?',
      type: AssignmentQuizQuestionType.SINGLE_CHOICE,
      points: 1,
      sortOrder: 0,
      material: {
        id: 'material-1',
        title: 'Question image',
        fileName: 'question-material.png',
        mimeType: 'image/png',
        size: 123,
        category: 'general',
        status: MaterialStatus.READY,
      },
      options: [],
    });

    const result = await service.createQuizQuestion('assignment-1', {
      content: '  What do you see in the picture?  ',
      materialId: 'material-1',
    });

    expect(questionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        assignment: expect.objectContaining({ id: 'assignment-1' }),
        content: 'What do you see in the picture?',
        type: AssignmentQuizQuestionType.SINGLE_CHOICE,
        points: 1,
        sortOrder: 0,
        material: expect.objectContaining({ id: 'material-1' }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'question-1',
        content: 'What do you see in the picture?',
        type: AssignmentQuizQuestionType.SINGLE_CHOICE,
        sortOrder: 0,
        material: expect.objectContaining({
          id: 'material-1',
          downloadUrl:
            '/assignments/assignment-1/quiz/questions/question-1/materials/material-1/download',
        }),
      }),
    );
  });

  it('auto-grades a submitted quiz attempt', async () => {
    assignmentRepo.findOne.mockResolvedValue({
      id: 'assignment-1',
      type: AssignmentType.QUIZ,
      title: 'Quiz 01',
      timeStart: new Date('2020-03-19T10:00:00.000Z'),
      timeEnd: new Date('2099-03-20T10:00:00.000Z'),
      session: {
        classEntity: {
          id: 'class-1',
          workspace: { id: 'workspace-1' },
        },
      },
      quizQuestions: [
        {
          id: 'question-1',
          content: 'Capital of France?',
          type: AssignmentQuizQuestionType.SINGLE_CHOICE,
          points: 2,
          sortOrder: 0,
          material: null,
          options: [
            {
              id: 'option-1',
              content: 'Paris',
              sortOrder: 0,
              isCorrect: true,
            },
            {
              id: 'option-2',
              content: 'Rome',
              sortOrder: 1,
              isCorrect: false,
            },
          ],
        },
        {
          id: 'question-2',
          content: 'Capital of Italy?',
          type: AssignmentQuizQuestionType.SINGLE_CHOICE,
          points: 1,
          sortOrder: 1,
          material: null,
          options: [
            {
              id: 'option-3',
              content: 'Madrid',
              sortOrder: 0,
              isCorrect: false,
            },
            {
              id: 'option-4',
              content: 'Rome',
              sortOrder: 1,
              isCorrect: true,
            },
          ],
        },
      ],
    });
    classStudentRepo.findOne.mockResolvedValue({ student });
    attemptRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'attempt-1',
        assignment: { id: 'assignment-1' },
        student,
        status: AssignmentQuizAttemptStatus.SUBMITTED,
        startedAt: new Date('2026-03-17T10:00:00.000Z'),
        submittedAt: new Date('2026-03-17T10:05:00.000Z'),
        score: 2,
        maxScore: 3,
        correctCount: 1,
        totalQuestions: 2,
        answers: [
          {
            question: { id: 'question-1' },
            selectedOption: { id: 'option-1' },
            isCorrect: true,
            awardedPoints: 2,
          },
          {
            question: { id: 'question-2' },
            selectedOption: { id: 'option-3' },
            isCorrect: false,
            awardedPoints: 0,
          },
        ],
      });

    const result = await service.submitMyQuizAttempt('assignment-1', 'student-1', {
      answers: [
        { questionId: 'question-1', selectedOptionId: 'option-1' },
        { questionId: 'question-2', selectedOptionId: 'option-3' },
      ],
    });

    expect(attemptRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        assignment: expect.objectContaining({ id: 'assignment-1' }),
        student,
        status: AssignmentQuizAttemptStatus.IN_PROGRESS,
        maxScore: 3,
        totalQuestions: 2,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        assignmentId: 'assignment-1',
        studentId: 'student-1',
        status: AssignmentQuizAttemptStatus.SUBMITTED,
        score: 2,
        maxScore: 3,
        correctCount: 1,
        totalQuestions: 2,
      }),
    );
  });

  it('rejects creating quiz question with a material that is not ready', async () => {
    assignmentRepo.findOne.mockResolvedValue({
      id: 'assignment-1',
      type: AssignmentType.QUIZ,
      session: {
        classEntity: {
          id: 'class-1',
          workspace: { id: 'workspace-1' },
        },
      },
      quizQuestions: [],
    });
    materialRepo.findOne.mockResolvedValue({
      id: 'material-1',
      status: MaterialStatus.PENDING,
      bucket: 'bucket-1',
      objectKey: 'workspace-1/quiz/question-material.png',
      fileName: 'question-material.png',
      workspace: { id: 'workspace-1' },
    });

    await expect(
      service.createQuizQuestion('assignment-1', {
        content: 'Question with pending material',
        materialId: 'material-1',
      }),
    ).rejects.toThrow(
      new BadRequestException('Question material is not ready to use'),
    );
  });
});
