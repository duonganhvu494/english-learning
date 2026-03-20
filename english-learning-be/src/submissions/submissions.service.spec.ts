import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  AssignmentEntity,
  AssignmentType,
} from 'src/assignments/entities/assignment.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { AbortMaterialUploadDto } from 'src/materials/dto/abort-material-upload.dto';
import { CompleteMaterialUploadDto } from 'src/materials/dto/complete-material-upload.dto';
import { SignMaterialUploadPartDto } from 'src/materials/dto/sign-material-upload-part.dto';
import {
  Material,
  MaterialCategory,
  MaterialStatus,
} from 'src/materials/entities/material.entity';
import {
  MaterialUploadSession,
  MaterialUploadSessionStatus,
} from 'src/materials/entities/material-upload-session.entity';
import { S3StorageService } from 'src/storage/s3-storage.service';
import { AccountType } from 'src/users/entities/user.entity';
import { SubmissionEntity } from './entities/submission.entity';
import { SubmissionsService } from './submissions.service';

describe('SubmissionsService', () => {
  let service: SubmissionsService;

  let submissionRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    manager: {
      transaction: jest.Mock;
    };
  };
  let assignmentRepo: {
    findOne: jest.Mock;
  };
  let classStudentRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
  };
  let materialRepo: {
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };
  let uploadSessionRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
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
    deleteObject: jest.Mock;
  };

  const assignment = {
    id: 'assignment-1',
    type: AssignmentType.MANUAL,
    title: 'Essay task',
    timeStart: new Date('2020-03-19T10:00:00.000Z'),
    timeEnd: new Date('2099-03-20T10:00:00.000Z'),
    session: {
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    },
  };
  const student = {
    id: 'student-1',
    fullName: 'Nguyen Van A',
    accountType: AccountType.STUDENT,
  };

  beforeEach(async () => {
    submissionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((input: Partial<SubmissionEntity>) => input),
      save: jest.fn((input: Partial<SubmissionEntity>) => Promise.resolve(input)),
      manager: {
        transaction: jest.fn(
          (
            callback: (manager: {
              getRepository: (
                entity:
                  | typeof SubmissionEntity
                  | typeof Material
                  | typeof MaterialUploadSession,
              ) => {
                save: jest.Mock;
              };
            }) => Promise<unknown>,
          ) =>
            callback({
              getRepository: jest.fn(
                (
                  entity:
                    | typeof SubmissionEntity
                    | typeof Material
                    | typeof MaterialUploadSession,
                ) => {
                  if (entity === SubmissionEntity) {
                    return { save: submissionRepo.save };
                  }

                  if (entity === Material) {
                    return { save: materialRepo.save };
                  }

                  if (entity === MaterialUploadSession) {
                    return { save: uploadSessionRepo.save };
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
    classStudentRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    materialRepo = {
      create: jest.fn((input: Partial<Material>) => input),
      save: jest.fn((input: Partial<Material>) =>
        Promise.resolve({
          id: input.id ?? 'material-1',
          ...input,
        }),
      ),
      delete: jest.fn(() => Promise.resolve({ affected: 1 })),
    };
    uploadSessionRepo = {
      create: jest.fn((input: Partial<MaterialUploadSession>) => input),
      save: jest.fn((input: Partial<MaterialUploadSession>) =>
        Promise.resolve({
          id: input.id ?? 'upload-session-1',
          ...input,
        }),
      ),
      findOne: jest.fn(),
    };
    s3StorageService = {
      multipartPartSize: 10,
      uploadSessionExpiresInSeconds: 3600,
      maxUploadSizeBytes: 1000,
      maxMultipartParts: 10000,
      allowedMimeTypes: ['video/*', 'application/pdf'],
      buildMaterialObjectKey: jest
        .fn()
        .mockReturnValue('workspace/workspace-1/submission/video.mp4'),
      createMultipartUpload: jest
        .fn()
        .mockResolvedValue({ bucket: 'bucket-1', uploadId: 'upload-1' }),
      signUploadPart: jest.fn().mockResolvedValue('https://signed-upload-url'),
      completeMultipartUpload: jest.fn().mockResolvedValue(undefined),
      abortMultipartUpload: jest.fn().mockResolvedValue(undefined),
      createSignedDownloadUrl: jest
        .fn()
        .mockResolvedValue('https://signed-submission-download'),
      deleteObject: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        {
          provide: getRepositoryToken(SubmissionEntity),
          useValue: submissionRepo,
        },
        {
          provide: getRepositoryToken(AssignmentEntity),
          useValue: assignmentRepo,
        },
        {
          provide: getRepositoryToken(ClassStudent),
          useValue: classStudentRepo,
        },
        {
          provide: getRepositoryToken(Material),
          useValue: materialRepo,
        },
        {
          provide: getRepositoryToken(MaterialUploadSession),
          useValue: uploadSessionRepo,
        },
        {
          provide: S3StorageService,
          useValue: s3StorageService,
        },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('initializes a pending multipart upload for a student submission', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-17T10:00:00.000Z'));
    assignmentRepo.findOne.mockResolvedValue(assignment);
    classStudentRepo.findOne.mockResolvedValue({ student });

    const result = await service.initMySubmissionUpload('assignment-1', 'student-1', {
      fileName: 'essay.mp4',
      mimeType: 'video/mp4',
      size: 25,
    });

    expect(materialRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Essay task - Nguyen Van A',
        status: MaterialStatus.PENDING,
        category: MaterialCategory.SUBMISSION,
      }),
    );
    expect(uploadSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        assignment,
        uploadedBy: student,
        totalParts: 3,
        status: MaterialUploadSessionStatus.INITIATED,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        materialId: 'material-1',
        uploadSessionId: 'upload-session-1',
        uploadId: 'upload-1',
        partSize: 10,
        totalParts: 3,
        expiresAt: new Date('2026-03-17T11:00:00.000Z'),
      }),
    );
  });

  it('rejects submission upload initialization when mimeType is not allowed', async () => {
    assignmentRepo.findOne.mockResolvedValue(assignment);
    classStudentRepo.findOne.mockResolvedValue({ student });

    await expect(
      service.initMySubmissionUpload('assignment-1', 'student-1', {
        fileName: 'essay.exe',
        mimeType: 'application/x-msdownload',
        size: 25,
      }),
    ).rejects.toMatchObject({
      response: {
        message: 'mimeType is not allowed',
        code: 'STORAGE_UPLOAD_MIME_TYPE_NOT_ALLOWED',
      },
    });

    expect(s3StorageService.createMultipartUpload).not.toHaveBeenCalled();
  });

  it('signs a submission upload part while the assignment is still open', async () => {
    assignmentRepo.findOne.mockResolvedValue(assignment);
    classStudentRepo.findOne.mockResolvedValue({ student });
    uploadSessionRepo.findOne.mockResolvedValue({
      id: 'upload-session-1',
      uploadId: 'upload-1',
      objectKey: 'workspace/workspace-1/submission/video.mp4',
      totalParts: 4,
      status: MaterialUploadSessionStatus.INITIATED,
      expiresAt: new Date('2099-03-17T12:00:00.000Z'),
      material: { id: 'material-1' },
    });

    const result = await service.signMySubmissionUploadPart(
      'assignment-1',
      'student-1',
      {
        materialId: 'material-1',
        uploadSessionId: 'upload-session-1',
        uploadId: 'upload-1',
        objectKey: 'workspace/workspace-1/submission/video.mp4',
        partNumber: 2,
      } satisfies SignMaterialUploadPartDto,
    );

    expect(uploadSessionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'upload-session-1',
        status: MaterialUploadSessionStatus.UPLOADING,
      }),
    );
    expect(result).toEqual({
      partNumber: 2,
      url: 'https://signed-upload-url',
    });
  });

  it('completes upload and creates a reviewed-empty submission', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-17T10:00:00.000Z'));
    assignmentRepo.findOne.mockResolvedValue(assignment);
    classStudentRepo.findOne.mockResolvedValue({ student });
    uploadSessionRepo.findOne.mockResolvedValue({
      id: 'upload-session-1',
      uploadId: 'upload-1',
      objectKey: 'workspace/workspace-1/submission/video.mp4',
      totalParts: 2,
      status: MaterialUploadSessionStatus.UPLOADING,
      expiresAt: new Date('2099-03-17T12:00:00.000Z'),
      completedAt: null,
      material: {
        id: 'material-1',
        title: 'Essay task - Nguyen Van A',
        fileName: 'essay.mp4',
        mimeType: 'video/mp4',
        size: 1234,
        category: MaterialCategory.SUBMISSION,
        status: MaterialStatus.PENDING,
        bucket: 'bucket-1',
        objectKey: 'workspace/workspace-1/submission/video.mp4',
      },
    });
    submissionRepo.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        assignment: { id: 'assignment-1' },
        student,
        material: {
          id: 'material-1',
          title: 'Essay task - Nguyen Van A',
          fileName: 'essay.mp4',
          mimeType: 'video/mp4',
          size: 1234,
          category: MaterialCategory.SUBMISSION,
        },
        submittedAt: new Date('2026-03-17T10:00:00.000Z'),
        grade: null,
        feedback: null,
      });

    const result = await service.completeMySubmissionUpload(
      'assignment-1',
      'student-1',
      {
        materialId: 'material-1',
        uploadSessionId: 'upload-session-1',
        uploadId: 'upload-1',
        objectKey: 'workspace/workspace-1/submission/video.mp4',
        parts: [
          { partNumber: 2, etag: '"etag-2"' },
          { partNumber: 1, etag: '"etag-1"' },
        ],
      } satisfies CompleteMaterialUploadDto,
    );

    expect(s3StorageService.completeMultipartUpload).toHaveBeenCalledWith({
      objectKey: 'workspace/workspace-1/submission/video.mp4',
      uploadId: 'upload-1',
      parts: [
        { partNumber: 1, etag: '"etag-1"' },
        { partNumber: 2, etag: '"etag-2"' },
      ],
    });
    expect(submissionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        submittedAt: new Date('2026-03-17T10:00:00.000Z'),
        grade: null,
        feedback: null,
      }),
    );
    expect(result.submitted).toBe(true);
    expect(result.grade).toBeNull();
    expect(result.feedback).toBeNull();
  });

  it('rejects completing submission after the assignment window has closed', async () => {
    assignmentRepo.findOne.mockResolvedValue({
      ...assignment,
      timeEnd: new Date('2026-03-16T10:00:00.000Z'),
    });
    classStudentRepo.findOne.mockResolvedValue({ student });

    await expect(
      service.completeMySubmissionUpload(
        'assignment-1',
        'student-1',
        {
          materialId: 'material-1',
          uploadSessionId: 'upload-session-1',
          uploadId: 'upload-1',
          objectKey: 'workspace/workspace-1/submission/video.mp4',
          parts: [{ partNumber: 1, etag: '"etag-1"' }],
        } satisfies CompleteMaterialUploadDto,
      ),
    ).rejects.toThrow(
      new BadRequestException('Assignment submission window has closed'),
    );
  });

  it('resubmission resets grade and feedback and cleans up the previous material', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-17T10:00:00.000Z'));
    jest.spyOn(service as never, 'cleanupMaterial').mockResolvedValue(undefined);
    assignmentRepo.findOne.mockResolvedValue(assignment);
    classStudentRepo.findOne.mockResolvedValue({ student });
    uploadSessionRepo.findOne.mockResolvedValue({
      id: 'upload-session-1',
      uploadId: 'upload-1',
      objectKey: 'workspace/workspace-1/submission/video-v2.mp4',
      totalParts: 1,
      status: MaterialUploadSessionStatus.UPLOADING,
      expiresAt: new Date('2099-03-17T12:00:00.000Z'),
      completedAt: null,
      material: {
        id: 'material-new',
        title: 'Essay task - Nguyen Van A',
        fileName: 'essay-v2.mp4',
        mimeType: 'video/mp4',
        size: 999,
        category: MaterialCategory.SUBMISSION,
        status: MaterialStatus.PENDING,
        bucket: 'bucket-1',
        objectKey: 'workspace/workspace-1/submission/video-v2.mp4',
      },
    });
    submissionRepo.findOne
      .mockResolvedValueOnce({
        assignment: { id: 'assignment-1' },
        student,
        material: {
          id: 'material-old',
          bucket: 'bucket-1',
          objectKey: 'workspace/workspace-1/submission/video-old.mp4',
        },
        grade: 8,
        feedback: 'Good',
      })
      .mockResolvedValueOnce({
        assignment: { id: 'assignment-1' },
        student,
        material: {
          id: 'material-new',
          title: 'Essay task - Nguyen Van A',
          fileName: 'essay-v2.mp4',
          mimeType: 'video/mp4',
          size: 999,
          category: MaterialCategory.SUBMISSION,
        },
        submittedAt: new Date('2026-03-17T10:00:00.000Z'),
        grade: null,
        feedback: null,
      });

    const result = await service.completeMySubmissionUpload(
      'assignment-1',
      'student-1',
      {
        materialId: 'material-new',
        uploadSessionId: 'upload-session-1',
        uploadId: 'upload-1',
        objectKey: 'workspace/workspace-1/submission/video-v2.mp4',
        parts: [{ partNumber: 1, etag: '"etag-1"' }],
      } satisfies CompleteMaterialUploadDto,
    );

    expect((service as never).cleanupMaterial).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'material-old' }),
    );
    expect(result.grade).toBeNull();
    expect(result.feedback).toBeNull();
  });

  it('returns empty my-submission response when student has not submitted yet', async () => {
    assignmentRepo.findOne.mockResolvedValue(assignment);
    classStudentRepo.findOne.mockResolvedValue({ student });
    submissionRepo.findOne.mockResolvedValue(null);

    const result = await service.getMySubmission('assignment-1', 'student-1');

    expect(result).toEqual({
      assignmentId: 'assignment-1',
      studentId: 'student-1',
      studentName: 'Nguyen Van A',
      submitted: false,
      submittedAt: null,
      grade: null,
      feedback: null,
      material: null,
    });
  });

  it('reviews an existing submission', async () => {
    submissionRepo.findOne
      .mockResolvedValueOnce({
        assignment: { id: 'assignment-1' },
        student,
        material: {
          id: 'material-1',
          title: 'Essay task - Nguyen Van A',
          fileName: 'essay.mp4',
          mimeType: 'video/mp4',
          size: 1234,
          category: MaterialCategory.SUBMISSION,
        },
        submittedAt: new Date('2026-03-17T10:00:00.000Z'),
        grade: null,
        feedback: null,
      })
      .mockResolvedValueOnce({
        assignment: { id: 'assignment-1' },
        student,
        material: {
          id: 'material-1',
          title: 'Essay task - Nguyen Van A',
          fileName: 'essay.mp4',
          mimeType: 'video/mp4',
          size: 1234,
          category: MaterialCategory.SUBMISSION,
        },
        submittedAt: new Date('2026-03-17T10:00:00.000Z'),
        grade: 9,
        feedback: 'Strong work',
      });

    const result = await service.reviewSubmission('assignment-1', 'student-1', {
      grade: 9,
      feedback: '  Strong work  ',
    });

    expect(submissionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        grade: 9,
        feedback: 'Strong work',
      }),
    );
    expect(result.grade).toBe(9);
    expect(result.feedback).toBe('Strong work');
  });

  it('returns a remote target for submission download when the file is on S3', async () => {
    assignmentRepo.findOne.mockResolvedValue(assignment);
    classStudentRepo.findOne.mockResolvedValue({ student });
    submissionRepo.findOne.mockResolvedValue({
      assignment: { id: 'assignment-1' },
      student,
      material: {
        status: MaterialStatus.READY,
        bucket: 'bucket-1',
        objectKey: 'workspace/workspace-1/submission/video.mp4',
        fileName: 'video.mp4',
      },
    });

    const result = await service.getMySubmissionDownloadTarget(
      'assignment-1',
      'student-1',
    );

    expect(result).toEqual({
      type: 'remote',
      url: 'https://signed-submission-download',
    });
  });

  it('rejects submission download when material is not ready', async () => {
    assignmentRepo.findOne.mockResolvedValue(assignment);
    classStudentRepo.findOne.mockResolvedValue({ student });
    submissionRepo.findOne.mockResolvedValue({
      assignment: { id: 'assignment-1' },
      student,
      material: {
        id: 'material-1',
        title: 'Essay task - Nguyen Van A',
        fileName: 'essay.mp4',
        mimeType: 'video/mp4',
        size: 1234,
        category: MaterialCategory.SUBMISSION,
        status: MaterialStatus.PENDING,
        bucket: 'bucket-1',
        objectKey: 'workspace/workspace-1/submission/video.mp4',
      },
      submittedAt: new Date('2026-03-17T10:00:00.000Z'),
      grade: null,
      feedback: null,
    });

    await expect(
      service.getMySubmissionDownloadTarget('assignment-1', 'student-1'),
    ).rejects.toThrow(
      new BadRequestException('Submission material is not ready for download'),
    );
  });

  it('rejects init upload when member is not a student account', async () => {
    assignmentRepo.findOne.mockResolvedValue(assignment);
    classStudentRepo.findOne.mockResolvedValue({
      student: {
        id: 'teacher-like-user',
        accountType: AccountType.TEACHER,
      },
    });

    await expect(
      service.initMySubmissionUpload('assignment-1', 'teacher-like-user', {
        fileName: 'essay.mp4',
        mimeType: 'video/mp4',
        size: 10,
      }),
    ).rejects.toThrow(
      new ForbiddenException('Only students can submit assignments'),
    );
  });

  it('aborts an in-progress submission upload', async () => {
    assignmentRepo.findOne.mockResolvedValue(assignment);
    classStudentRepo.findOne.mockResolvedValue({ student });
    uploadSessionRepo.findOne.mockResolvedValue({
      id: 'upload-session-1',
      uploadId: 'upload-1',
      objectKey: 'workspace/workspace-1/submission/video.mp4',
      totalParts: 2,
      status: MaterialUploadSessionStatus.UPLOADING,
      expiresAt: new Date('2099-03-17T12:00:00.000Z'),
      material: {
        id: 'material-1',
        status: MaterialStatus.PENDING,
      },
    });

    const result = await service.abortMySubmissionUpload(
      'assignment-1',
      'student-1',
      {
        materialId: 'material-1',
        uploadSessionId: 'upload-session-1',
        uploadId: 'upload-1',
        objectKey: 'workspace/workspace-1/submission/video.mp4',
      } satisfies AbortMaterialUploadDto,
    );

    expect(result).toEqual({
      materialId: 'material-1',
      uploadSessionId: 'upload-session-1',
      status: MaterialUploadSessionStatus.ABORTED,
    });
  });

  it('rejects file submission flow for quiz assignments', async () => {
    assignmentRepo.findOne.mockResolvedValue({
      ...assignment,
      type: AssignmentType.QUIZ,
    });

    await expect(
      service.initMySubmissionUpload('assignment-1', 'student-1', {
        fileName: 'essay.mp4',
        mimeType: 'video/mp4',
        size: 25,
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'File submissions are only available for manual assignments',
      ),
    );
  });
});
