import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssignmentMaterial } from 'src/assignments/entities/assignment-material.entity';
import { AssignmentQuizQuestionEntity } from 'src/assignments/entities/assignment-quiz-question.entity';
import { LectureMaterial } from 'src/lectures/entities/lecture-material.entity';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { S3StorageService } from 'src/storage/s3-storage.service';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Material,
  MaterialCategory,
  MaterialStatus,
} from './entities/material.entity';
import {
  MaterialUploadSession,
  MaterialUploadSessionStatus,
} from './entities/material-upload-session.entity';
import { MaterialsService } from './materials.service';

describe('MaterialsService', () => {
  let service: MaterialsService;

  type MockEntity = Record<string, unknown>;

  let materialRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
    find: jest.Mock;
  };
  let lectureMaterialRepo: {
    count: jest.Mock;
  };
  let assignmentMaterialRepo: {
    count: jest.Mock;
  };
  let assignmentQuizQuestionRepo: {
    count: jest.Mock;
  };
  let userRepo: {
    findOne: jest.Mock;
  };
  let submissionRepo: {
    count: jest.Mock;
  };
  let uploadSessionRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
  };
  let workspaceAccessService: {
    assertTeacherWorkspaceOwner: jest.Mock;
  };
  let s3StorageService: {
    multipartPartSize: number;
    uploadSessionExpiresInSeconds: number;
    maxUploadSizeBytes: number;
    maxMultipartParts: number;
    allowedMimeTypes: string[];
    buildMaterialObjectKey: jest.Mock;
    createMultipartUpload: jest.Mock;
    signUploadPart: jest.Mock;
    completeMultipartUpload: jest.Mock;
    abortMultipartUpload: jest.Mock;
    createSignedDownloadUrl: jest.Mock;
  };

  const workspace = {
    id: 'workspace-1',
  };
  const actor = {
    id: 'user-1',
  };

  beforeEach(async () => {
    materialRepo = {
      create: jest.fn((input: MockEntity) => input),
      save: jest.fn((input: MockEntity) =>
        Promise.resolve({
          id: input.id ?? 'material-1',
          createdAt: input.createdAt ?? new Date('2026-03-16T00:00:00.000Z'),
          updatedAt: new Date('2026-03-16T00:00:00.000Z'),
          ...input,
        }),
      ),
      findOne: jest.fn(),
      delete: jest.fn(),
      find: jest.fn(),
    };
    lectureMaterialRepo = {
      count: jest.fn().mockResolvedValue(0),
    };
    assignmentMaterialRepo = {
      count: jest.fn().mockResolvedValue(0),
    };
    assignmentQuizQuestionRepo = {
      count: jest.fn().mockResolvedValue(0),
    };
    userRepo = {
      findOne: jest.fn(),
    };
    submissionRepo = {
      count: jest.fn().mockResolvedValue(0),
    };
    uploadSessionRepo = {
      create: jest.fn((input: MockEntity) => input),
      save: jest.fn((input: MockEntity) =>
        Promise.resolve({
          id: input.id ?? 'upload-session-1',
          createdAt: input.createdAt ?? new Date('2026-03-16T00:00:00.000Z'),
          updatedAt: new Date('2026-03-16T00:00:00.000Z'),
          ...input,
        }),
      ),
      findOne: jest.fn(),
    };
    workspaceAccessService = {
      assertTeacherWorkspaceOwner: jest.fn().mockResolvedValue(workspace),
    };
    s3StorageService = {
      multipartPartSize: 10,
      uploadSessionExpiresInSeconds: 3600,
      maxUploadSizeBytes: 1000,
      maxMultipartParts: 10000,
      allowedMimeTypes: ['video/*', 'application/pdf'],
      buildMaterialObjectKey: jest
        .fn()
        .mockReturnValue('workspace/workspace-1/lecture/2026/03/video.mp4'),
      createMultipartUpload: jest
        .fn()
        .mockResolvedValue({ bucket: 'bucket-1', uploadId: 'upload-1' }),
      signUploadPart: jest.fn().mockResolvedValue('https://signed-upload-url'),
      completeMultipartUpload: jest.fn().mockResolvedValue(undefined),
      abortMultipartUpload: jest.fn().mockResolvedValue(undefined),
      createSignedDownloadUrl: jest
        .fn()
        .mockResolvedValue('https://signed-download-url'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaterialsService,
        {
          provide: getRepositoryToken(Material),
          useValue: materialRepo,
        },
        {
          provide: getRepositoryToken(LectureMaterial),
          useValue: lectureMaterialRepo,
        },
        {
          provide: getRepositoryToken(AssignmentMaterial),
          useValue: assignmentMaterialRepo,
        },
        {
          provide: getRepositoryToken(AssignmentQuizQuestionEntity),
          useValue: assignmentQuizQuestionRepo,
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
          provide: getRepositoryToken(MaterialUploadSession),
          useValue: uploadSessionRepo,
        },
        {
          provide: WorkspaceAccessService,
          useValue: workspaceAccessService,
        },
        {
          provide: S3StorageService,
          useValue: s3StorageService,
        },
      ],
    }).compile();

    service = module.get<MaterialsService>(MaterialsService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('initializes a pending S3 material upload session', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-16T10:00:00.000Z'));
    userRepo.findOne.mockResolvedValue(actor);

    const result = await service.initMaterialUpload(
      'workspace-1',
      {
        title: '  Video bai giang buoi 1  ',
        fileName: 'lesson-1.mp4',
        mimeType: 'video/mp4',
        size: 25,
        category: MaterialCategory.LECTURE,
      },
      'user-1',
    );

    expect(s3StorageService.buildMaterialObjectKey).toHaveBeenCalledWith({
      workspaceId: 'workspace-1',
      category: MaterialCategory.LECTURE,
      fileName: 'lesson-1.mp4',
    });
    expect(materialRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workspace,
        title: 'Video bai giang buoi 1',
        status: MaterialStatus.PENDING,
        bucket: 'bucket-1',
        objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      }),
    );
    expect(uploadSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        material: expect.objectContaining({ id: 'material-1' }),
        workspace,
        uploadedBy: actor,
        uploadId: 'upload-1',
        partSize: 10,
        totalParts: 3,
        status: MaterialUploadSessionStatus.INITIATED,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        materialId: 'material-1',
        uploadSessionId: 'upload-session-1',
        uploadId: 'upload-1',
        objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
        partSize: 10,
        totalParts: 3,
        expiresAt: new Date('2026-03-16T11:00:00.000Z'),
      }),
    );
  });

  it('signs an upload part and advances the upload session to uploading', async () => {
    const uploadSession = {
      id: 'upload-session-1',
      uploadId: 'upload-1',
      objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      totalParts: 4,
      status: MaterialUploadSessionStatus.INITIATED,
      expiresAt: new Date('2099-03-16T12:00:00.000Z'),
      material: {
        id: 'material-1',
      },
    };
    uploadSessionRepo.findOne.mockResolvedValue(uploadSession);

    const result = await service.signMaterialUploadPart(
      'workspace-1',
      {
        materialId: 'material-1',
        uploadSessionId: 'upload-session-1',
        uploadId: 'upload-1',
        objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
        partNumber: 2,
      },
      'user-1',
    );

    expect(uploadSessionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'upload-session-1',
        status: MaterialUploadSessionStatus.UPLOADING,
      }),
    );
    expect(s3StorageService.signUploadPart).toHaveBeenCalledWith({
      objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      uploadId: 'upload-1',
      partNumber: 2,
    });
    expect(result).toEqual({
      partNumber: 2,
      url: 'https://signed-upload-url',
    });
  });

  it('rejects material upload initialization when mimeType is not allowed', async () => {
    userRepo.findOne.mockResolvedValue(actor);

    await expect(
      service.initMaterialUpload(
        'workspace-1',
        {
          fileName: 'script.sh',
          mimeType: 'application/x-sh',
          size: 25,
        },
        'user-1',
      ),
    ).rejects.toMatchObject({
      response: {
        message: 'mimeType is not allowed',
        code: 'STORAGE_UPLOAD_MIME_TYPE_NOT_ALLOWED',
      },
    });

    expect(s3StorageService.createMultipartUpload).not.toHaveBeenCalled();
  });

  it('rejects material upload initialization when upload requires too many parts', async () => {
    userRepo.findOne.mockResolvedValue(actor);
    s3StorageService.maxMultipartParts = 2;

    await expect(
      service.initMaterialUpload(
        'workspace-1',
        {
          fileName: 'lesson-1.mp4',
          mimeType: 'video/mp4',
          size: 25,
        },
        'user-1',
      ),
    ).rejects.toMatchObject({
      response: {
        message:
          'Upload requires too many parts. Increase part size or reduce file size',
        code: 'STORAGE_UPLOAD_TOO_MANY_PARTS',
      },
    });

    expect(s3StorageService.createMultipartUpload).not.toHaveBeenCalled();
  });

  it('completes a multipart upload and marks the material ready', async () => {
    const uploadSession = {
      id: 'upload-session-1',
      uploadId: 'upload-1',
      objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      totalParts: 2,
      status: MaterialUploadSessionStatus.UPLOADING,
      expiresAt: new Date('2099-03-16T12:00:00.000Z'),
      completedAt: null,
      material: {
        id: 'material-1',
        workspace,
        uploadedBy: actor,
        title: 'Video bai giang buoi 1',
        status: MaterialStatus.PENDING,
        bucket: 'bucket-1',
        objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
        fileName: 'lesson-1.mp4',
        mimeType: 'video/mp4',
        size: 25,
        category: MaterialCategory.LECTURE,
        createdAt: new Date('2026-03-16T00:00:00.000Z'),
        updatedAt: new Date('2026-03-16T00:00:00.000Z'),
      },
    };
    uploadSessionRepo.findOne.mockResolvedValue(uploadSession);
    materialRepo.findOne.mockResolvedValue({
      ...uploadSession.material,
      status: MaterialStatus.READY,
      updatedAt: new Date('2026-03-16T10:05:00.000Z'),
    });

    const result = await service.completeMaterialUpload(
      'workspace-1',
      {
        materialId: 'material-1',
        uploadSessionId: 'upload-session-1',
        uploadId: 'upload-1',
        objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
        parts: [
          { partNumber: 2, etag: '"etag-2"' },
          { partNumber: 1, etag: '"etag-1"' },
        ],
      },
      'user-1',
    );

    expect(s3StorageService.completeMultipartUpload).toHaveBeenCalledWith({
      objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      uploadId: 'upload-1',
      parts: [
        { partNumber: 1, etag: '"etag-1"' },
        { partNumber: 2, etag: '"etag-2"' },
      ],
    });
    expect(uploadSessionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'upload-session-1',
        status: MaterialUploadSessionStatus.COMPLETED,
        completedAt: expect.any(Date),
      }),
    );
    expect(materialRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'material-1',
        status: MaterialStatus.READY,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'material-1',
        status: MaterialStatus.READY,
      }),
    );
  });

  it('aborts an upload session and marks the material failed', async () => {
    const uploadSession = {
      id: 'upload-session-1',
      uploadId: 'upload-1',
      objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      totalParts: 2,
      status: MaterialUploadSessionStatus.UPLOADING,
      expiresAt: new Date('2099-03-16T12:00:00.000Z'),
      completedAt: null,
      material: {
        id: 'material-1',
        status: MaterialStatus.PENDING,
      },
    };
    uploadSessionRepo.findOne.mockResolvedValue(uploadSession);

    const result = await service.abortMaterialUpload(
      'workspace-1',
      {
        materialId: 'material-1',
        uploadSessionId: 'upload-session-1',
        uploadId: 'upload-1',
        objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      },
      'user-1',
    );

    expect(s3StorageService.abortMultipartUpload).toHaveBeenCalledWith({
      objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      uploadId: 'upload-1',
    });
    expect(uploadSessionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'upload-session-1',
        status: MaterialUploadSessionStatus.ABORTED,
      }),
    );
    expect(materialRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'material-1',
        status: MaterialStatus.FAILED,
      }),
    );
    expect(result).toEqual({
      materialId: 'material-1',
      uploadSessionId: 'upload-session-1',
      status: MaterialUploadSessionStatus.ABORTED,
    });
  });

  it('returns a signed download target for S3 materials', async () => {
    materialRepo.findOne.mockResolvedValue({
      id: 'material-1',
      workspace,
      uploadedBy: actor,
      fileName: 'lesson-1.mp4',
      objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      bucket: 'bucket-1',
      status: MaterialStatus.READY,
    });

    const result = await service.getMaterialDownloadTarget('material-1');

    expect(s3StorageService.createSignedDownloadUrl).toHaveBeenCalledWith({
      bucket: 'bucket-1',
      objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      fileName: 'lesson-1.mp4',
    });
    expect(result).toEqual({
      type: 'remote',
      url: 'https://signed-download-url',
    });
  });

  it('rejects download when material is not ready', async () => {
    materialRepo.findOne.mockResolvedValue({
      id: 'material-1',
      workspace,
      uploadedBy: actor,
      fileName: 'lesson-1.mp4',
      objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      bucket: 'bucket-1',
      status: MaterialStatus.PENDING,
    });

    await expect(service.getMaterialDownloadTarget('material-1')).rejects.toThrow(
      new BadRequestException('Material is not ready for download'),
    );
  });

  it('rejects signing a part beyond the declared totalParts', async () => {
    uploadSessionRepo.findOne.mockResolvedValue({
      id: 'upload-session-1',
      uploadId: 'upload-1',
      objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
      totalParts: 2,
      status: MaterialUploadSessionStatus.INITIATED,
      expiresAt: new Date('2099-03-16T12:00:00.000Z'),
      material: {
        id: 'material-1',
      },
    });

    await expect(
      service.signMaterialUploadPart(
        'workspace-1',
        {
          materialId: 'material-1',
          uploadSessionId: 'upload-session-1',
          uploadId: 'upload-1',
          objectKey: 'workspace/workspace-1/lecture/2026/03/video.mp4',
          partNumber: 3,
        },
        'user-1',
      ),
    ).rejects.toThrow(new BadRequestException('partNumber exceeds totalParts'));
  });

  it('rejects deleting a material that is still attached to quiz questions', async () => {
    materialRepo.findOne.mockResolvedValue({
      id: 'material-1',
      workspace,
      uploadedBy: actor,
      fileName: 'question-image.png',
      objectKey: 'workspace/workspace-1/general/question-image.png',
      bucket: 'bucket-1',
      status: MaterialStatus.READY,
    });
    assignmentQuizQuestionRepo.count.mockResolvedValue(1);

    await expect(service.deleteMaterial('material-1')).rejects.toThrow(
      new BadRequestException(
        'Cannot delete material while it is still attached to quiz questions',
      ),
    );

    expect(materialRepo.delete).not.toHaveBeenCalled();
  });
});
