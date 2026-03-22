import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Material,
} from 'src/materials/entities/material.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { S3StorageService } from 'src/storage/s3-storage.service';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import {
  AssignmentEntity,
  AssignmentType,
} from './entities/assignment.entity';
import { AssignmentQuizAttemptEntity } from './entities/assignment-quiz-attempt.entity';
import { AssignmentMaterial } from './entities/assignment-material.entity';
import { AssignmentsService } from './assignments.service';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let assignmentRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    manager: {
      transaction: jest.Mock;
    };
  };
  let assignmentMaterialRepo: {
    findOne: jest.Mock;
  };
  let materialRepo: {
    find: jest.Mock;
  };
  let sessionRepo: {
    findOne: jest.Mock;
  };
  let userRepo: {
    findOne: jest.Mock;
  };
  let submissionRepo: {
    count: jest.Mock;
  };
  let attemptRepo: {
    count: jest.Mock;
  };
  let s3StorageService: {
    createSignedDownloadUrl: jest.Mock;
  };
  let assignmentRepoInTransaction: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let assignmentMaterialRepoInTransaction: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    assignmentRepoInTransaction = {
      create: jest.fn((input: Partial<AssignmentEntity>) => input),
      save: jest.fn((input: Partial<AssignmentEntity>) =>
        Promise.resolve({
          id: 'assignment-1',
          ...input,
        }),
      ),
    };
    assignmentMaterialRepoInTransaction = {
      create: jest.fn((input: Partial<AssignmentMaterial>) => input),
      save: jest.fn((input: Partial<AssignmentMaterial>[]) =>
        Promise.resolve(input),
      ),
      delete: jest.fn(() => Promise.resolve({ affected: 1 })),
    };

    assignmentRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      delete: jest.fn(() => Promise.resolve({ affected: 1 })),
      manager: {
        transaction: jest.fn(
          (
            callback: (manager: {
              getRepository: (
                entity: typeof AssignmentEntity | typeof AssignmentMaterial,
              ) =>
                | typeof assignmentRepoInTransaction
                | typeof assignmentMaterialRepoInTransaction;
            }) => Promise<unknown>,
          ) =>
            callback({
              getRepository: jest.fn(
                (
                  entity: typeof AssignmentEntity | typeof AssignmentMaterial,
                ) => {
                  if (entity === AssignmentEntity) {
                    return assignmentRepoInTransaction;
                  }

                  if (entity === AssignmentMaterial) {
                    return assignmentMaterialRepoInTransaction;
                  }

                  throw new Error('Unexpected repository in transaction');
                },
              ),
            }),
        ),
      },
    };
    assignmentMaterialRepo = {
      findOne: jest.fn(),
    };
    materialRepo = {
      find: jest.fn(),
    };
    sessionRepo = {
      findOne: jest.fn(),
    };
    userRepo = {
      findOne: jest.fn(),
    };
    submissionRepo = {
      count: jest.fn().mockResolvedValue(0),
    };
    attemptRepo = {
      count: jest.fn().mockResolvedValue(0),
    };
    s3StorageService = {
      createSignedDownloadUrl: jest
        .fn()
        .mockResolvedValue('https://signed-assignment-download'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: getRepositoryToken(AssignmentEntity),
          useValue: assignmentRepo,
        },
        {
          provide: getRepositoryToken(AssignmentMaterial),
          useValue: assignmentMaterialRepo,
        },
        {
          provide: getRepositoryToken(Material),
          useValue: materialRepo,
        },
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: sessionRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: getRepositoryToken(SubmissionEntity),
          useValue: submissionRepo,
        },
        {
          provide: getRepositoryToken(AssignmentQuizAttemptEntity),
          useValue: attemptRepo,
        },
        {
          provide: S3StorageService,
          useValue: s3StorageService,
        },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates an assignment with normalized fields and attached materials', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    });
    userRepo.findOne.mockResolvedValue({ id: 'teacher-1' });
    materialRepo.find.mockResolvedValue([
      {
        id: 'material-1',
        status: 'ready',
        bucket: 'bucket-1',
        objectKey: 'workspace/1/assignment/material-1.pdf',
      },
      {
        id: 'material-2',
        status: 'ready',
        bucket: 'bucket-1',
        objectKey: 'workspace/1/assignment/material-2.pdf',
      },
    ]);
    jest.spyOn(service, 'getAssignmentDetail').mockResolvedValue({
      id: 'assignment-1',
    } as never);

    const result = await service.createAssignment(
      'session-1',
      {
        title: '  Homework 01  ',
        description: '  Read and summarize the text  ',
        timeStart: '2026-03-19T10:00:00.000Z',
        timeEnd: '2026-03-20T10:00:00.000Z',
        materialIds: ['material-1', 'material-2'],
      },
      'teacher-1',
    );

    expect(assignmentRepoInTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        session: expect.objectContaining({ id: 'session-1' }),
        code: 'ASM-001',
        title: 'Homework 01',
        description: 'Read and summarize the text',
        timeStart: new Date('2026-03-19T10:00:00.000Z'),
        timeEnd: new Date('2026-03-20T10:00:00.000Z'),
        createdBy: expect.objectContaining({ id: 'teacher-1' }),
        updatedBy: expect.objectContaining({ id: 'teacher-1' }),
      }),
    );
    expect(assignmentMaterialRepoInTransaction.save).toHaveBeenCalledWith([
      expect.objectContaining({
        material: expect.objectContaining({ id: 'material-1' }),
        sortOrder: 0,
      }),
      expect.objectContaining({
        material: expect.objectContaining({ id: 'material-2' }),
        sortOrder: 1,
      }),
    ]);
    expect(result).toEqual({ id: 'assignment-1' });
  });

  it('creates a quiz assignment when type is explicitly provided', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    });
    userRepo.findOne.mockResolvedValue({ id: 'teacher-1' });
    materialRepo.find.mockResolvedValue([]);
    jest.spyOn(service, 'getAssignmentDetail').mockResolvedValue({
      id: 'assignment-quiz-1',
      type: AssignmentType.QUIZ,
    } as never);

    const result = await service.createAssignment(
      'session-1',
      {
        title: '  Vocabulary Quiz  ',
        timeStart: '2026-03-19T10:00:00.000Z',
        timeEnd: '2026-03-20T10:00:00.000Z',
        type: AssignmentType.QUIZ,
      },
      'teacher-1',
    );

    expect(assignmentRepoInTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'ASM-001',
        type: AssignmentType.QUIZ,
        title: 'Vocabulary Quiz',
      }),
    );
    expect(result).toEqual({
      id: 'assignment-quiz-1',
      type: AssignmentType.QUIZ,
    });
  });

  it('rejects createAssignment when one or more materials are outside the workspace', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    });
    userRepo.findOne.mockResolvedValue({ id: 'teacher-1' });
    materialRepo.find.mockResolvedValue([
      {
        id: 'material-1',
        status: 'ready',
        bucket: 'bucket-1',
        objectKey: 'workspace/1/assignment/material-1.pdf',
      },
    ]);

    await expect(
      service.createAssignment(
        'session-1',
        {
          title: 'Homework 01',
          timeStart: '2026-03-19T10:00:00.000Z',
          timeEnd: '2026-03-20T10:00:00.000Z',
          materialIds: ['material-1', 'material-2'],
        },
        'teacher-1',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(assignmentRepo.manager.transaction).not.toHaveBeenCalled();
  });

  it('rejects createAssignment when one or more materials are not ready', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    });
    userRepo.findOne.mockResolvedValue({ id: 'teacher-1' });
    materialRepo.find.mockResolvedValue([
      {
        id: 'material-1',
        status: 'pending',
        bucket: 'bucket-1',
        objectKey: 'workspace/1/assignment/homework.pdf',
      },
    ]);

    await expect(
      service.createAssignment(
        'session-1',
        {
          title: 'Homework 01',
          timeStart: '2026-03-19T10:00:00.000Z',
          timeEnd: '2026-03-20T10:00:00.000Z',
          materialIds: ['material-1'],
        },
        'teacher-1',
      ),
    ).rejects.toThrow(
      new BadRequestException('One or more materials are not ready to use'),
    );

    expect(assignmentRepo.manager.transaction).not.toHaveBeenCalled();
  });

  it('rejects createAssignment when time window is invalid', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    });
    userRepo.findOne.mockResolvedValue({ id: 'teacher-1' });
    materialRepo.find.mockResolvedValue([]);

    await expect(
      service.createAssignment(
        'session-1',
        {
          title: 'Homework 01',
          timeStart: '2026-03-20T10:00:00.000Z',
          timeEnd: '2026-03-19T10:00:00.000Z',
        },
        'teacher-1',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(assignmentRepo.manager.transaction).not.toHaveBeenCalled();
  });

  it('rejects createAssignment when the same title already exists in a session', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    });
    userRepo.findOne.mockResolvedValue({ id: 'teacher-1' });
    materialRepo.find.mockResolvedValue([]);
    assignmentRepo.find.mockResolvedValue([
      {
        id: 'assignment-existing',
        title: 'Homework 01',
        code: 'ASM-001',
      },
    ]);

    await expect(
      service.createAssignment(
        'session-1',
        {
          title: 'homework 01',
          timeStart: '2026-03-19T10:00:00.000Z',
          timeEnd: '2026-03-20T10:00:00.000Z',
        },
        'teacher-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(assignmentRepo.manager.transaction).not.toHaveBeenCalled();
  });

  it('blocks deleting assignment when manual submissions already exist', async () => {
    assignmentRepo.findOne.mockResolvedValue({
      id: 'assignment-1',
    });
    submissionRepo.count.mockResolvedValue(1);

    await expect(service.deleteAssignment('assignment-1')).rejects.toThrow(
      new BadRequestException(
        'Cannot delete assignment after students have submitted work',
      ),
    );

    expect(assignmentRepo.delete).not.toHaveBeenCalled();
  });

  it('blocks deleting assignment when quiz attempts already exist', async () => {
    assignmentRepo.findOne.mockResolvedValue({
      id: 'assignment-1',
    });
    attemptRepo.count.mockResolvedValue(1);

    await expect(service.deleteAssignment('assignment-1')).rejects.toThrow(
      new BadRequestException(
        'Cannot delete assignment after students have started quiz attempts',
      ),
    );

    expect(assignmentRepo.delete).not.toHaveBeenCalled();
  });

  it('returns a remote download target when material belongs to assignment on S3', async () => {
    assignmentMaterialRepo.findOne.mockResolvedValue({
      material: {
        status: 'ready',
        bucket: 'bucket-1',
        objectKey: 'workspace/1/assignment/homework.pdf',
        fileName: 'homework.pdf',
        mimeType: 'application/pdf',
      },
    });

    const result = await service.getAssignmentMaterialDownloadTarget(
      'assignment-1',
      'material-1',
    );

    expect(result).toEqual({
      type: 'remote',
      url: 'https://signed-assignment-download',
    });
    expect(s3StorageService.createSignedDownloadUrl).toHaveBeenCalledWith({
      bucket: 'bucket-1',
      objectKey: 'workspace/1/assignment/homework.pdf',
      fileName: 'homework.pdf',
    });
  });

  it('rejects download when material is not attached to assignment', async () => {
    assignmentMaterialRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getAssignmentMaterialDownloadTarget('assignment-1', 'material-1'),
    ).rejects.toThrow(BadRequestException);
  });
});
