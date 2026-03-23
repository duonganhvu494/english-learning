import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  Material,
} from 'src/materials/entities/material.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { S3StorageService } from 'src/storage/s3-storage.service';
import { User } from 'src/users/entities/user.entity';
import { LectureEntity } from './entities/lecture.entity';
import { LectureMaterial } from './entities/lecture-material.entity';
import { LecturesService } from './lectures.service';

describe('LecturesService', () => {
  let service: LecturesService;
  let lectureRepo: {
    find: jest.Mock;
    findOne: jest.Mock;
    manager: {
      transaction: jest.Mock;
    };
  };
  let lectureMaterialRepo: {
    findOne: jest.Mock;
  };
  let sessionRepo: {
    findOne: jest.Mock;
  };
  let userRepo: {
    findOne: jest.Mock;
  };
  let s3StorageService: {
    createSignedDownloadUrl: jest.Mock;
  };
  let lectureRepoInTransaction: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let lectureMaterialRepoInTransaction: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    lectureRepoInTransaction = {
      create: jest.fn((input: Partial<LectureEntity>) => input),
      save: jest.fn((input: Partial<LectureEntity>) =>
        Promise.resolve({
          id: 'lecture-1',
          ...input,
        }),
      ),
    };
    lectureMaterialRepoInTransaction = {
      create: jest.fn((input: Partial<LectureMaterial>) => input),
      save: jest.fn((input: Partial<LectureMaterial>[]) =>
        Promise.resolve(input),
      ),
      delete: jest.fn(() => Promise.resolve({ affected: 1 })),
    };
    lectureRepo = {
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      manager: {
        transaction: jest.fn(
          (
            callback: (manager: {
              getRepository: (
                entity: typeof LectureEntity | typeof LectureMaterial,
              ) =>
                | typeof lectureRepoInTransaction
                | typeof lectureMaterialRepoInTransaction;
            }) => Promise<unknown>,
          ) =>
            callback({
              getRepository: jest.fn(
                (
                  entity: typeof LectureEntity | typeof LectureMaterial,
                ) => {
                  if (entity === LectureEntity) {
                    return lectureRepoInTransaction;
                  }

                  if (entity === LectureMaterial) {
                    return lectureMaterialRepoInTransaction;
                  }

                  throw new Error('Unexpected repository in transaction');
                },
              ),
            }),
        ),
      },
    };
    lectureMaterialRepo = {
      findOne: jest.fn(),
    };
    sessionRepo = {
      findOne: jest.fn(),
    };
    userRepo = {
      findOne: jest.fn(),
    };
    s3StorageService = {
      createSignedDownloadUrl: jest
        .fn()
        .mockResolvedValue('https://signed-lecture-download'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LecturesService,
        {
          provide: getRepositoryToken(LectureEntity),
          useValue: lectureRepo,
        },
        {
          provide: getRepositoryToken(LectureMaterial),
          useValue: lectureMaterialRepo,
        },
        {
          provide: getRepositoryToken(Material),
          useValue: {},
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
          provide: S3StorageService,
          useValue: s3StorageService,
        },
      ],
    }).compile();

    service = module.get<LecturesService>(LecturesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a lecture with a generated scoped code', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      classEntity: { id: 'class-1', workspace: { id: 'workspace-1' } },
    });
    userRepo.findOne.mockResolvedValue({ id: 'teacher-1' });
    lectureRepo.find.mockResolvedValue([
      {
        id: 'lecture-existing',
        title: 'Pronunciation Warmup',
        code: 'LEC-001',
      },
    ]);
    jest.spyOn(service, 'getLectureDetail').mockResolvedValue({
      id: 'lecture-1',
      code: 'LEC-002',
    } as never);

    const result = await service.createLecture(
      'session-1',
      {
        title: '  Present Simple Overview  ',
      },
      'teacher-1',
    );

    expect(lectureRepoInTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Present Simple Overview',
        code: 'LEC-002',
        createdBy: expect.objectContaining({ id: 'teacher-1' }),
      }),
    );
    expect(result).toEqual({
      id: 'lecture-1',
      code: 'LEC-002',
    });
  });

  it('rejects createLecture when the same title already exists in a session', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      classEntity: { id: 'class-1', workspace: { id: 'workspace-1' } },
    });
    userRepo.findOne.mockResolvedValue({ id: 'teacher-1' });
    lectureRepo.find.mockResolvedValue([
      {
        id: 'lecture-existing',
        title: 'Present Simple Overview',
        code: 'LEC-001',
      },
    ]);

    await expect(
      service.createLecture(
        'session-1',
        {
          title: 'present simple overview',
        },
        'teacher-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(lectureRepo.manager.transaction).not.toHaveBeenCalled();
  });

  it('returns a remote target for lecture materials stored on S3', async () => {
    lectureMaterialRepo.findOne.mockResolvedValue({
      material: {
        status: 'ready',
        bucket: 'bucket-1',
        objectKey: 'workspace/1/lecture/video.mp4',
        fileName: 'video.mp4',
      },
    });

    const result = await service.getLectureMaterialDownloadTarget(
      'lecture-1',
      'material-1',
    );

    expect(s3StorageService.createSignedDownloadUrl).toHaveBeenCalledWith({
      bucket: 'bucket-1',
      objectKey: 'workspace/1/lecture/video.mp4',
      fileName: 'video.mp4',
    });
    expect(result).toEqual({
      type: 'remote',
      url: 'https://signed-lecture-download',
    });
  });

  it('rejects when lecture material is not attached', async () => {
    lectureMaterialRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getLectureMaterialDownloadTarget('lecture-1', 'material-1'),
    ).rejects.toThrow(
      new BadRequestException('Material is not attached to this lecture'),
    );
  });

  it('rejects when lecture material is not ready', async () => {
    lectureMaterialRepo.findOne.mockResolvedValue({
      material: {
        status: 'pending',
        bucket: 'bucket-1',
        objectKey: 'workspace/1/lecture/video.mp4',
        fileName: 'video.mp4',
      },
    });

    await expect(
      service.getLectureMaterialDownloadTarget('lecture-1', 'material-1'),
    ).rejects.toThrow(
      new BadRequestException('Lecture material is not ready for download'),
    );
  });
});
