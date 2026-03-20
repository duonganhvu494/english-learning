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
  let lectureMaterialRepo: {
    findOne: jest.Mock;
  };
  let s3StorageService: {
    createSignedDownloadUrl: jest.Mock;
  };

  beforeEach(async () => {
    lectureMaterialRepo = {
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
          useValue: {},
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
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
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
