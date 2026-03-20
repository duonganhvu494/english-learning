import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RbacService } from 'src/rbac/rbac.service';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

describe('SubmissionsController', () => {
  let controller: SubmissionsController;
  let submissionsService: {
    initMySubmissionUpload: jest.Mock;
    getMySubmission: jest.Mock;
    getMySubmissionDownloadTarget: jest.Mock;
    reviewSubmission: jest.Mock;
  };

  beforeEach(async () => {
    submissionsService = {
      initMySubmissionUpload: jest.fn(),
      getMySubmission: jest.fn(),
      getMySubmissionDownloadTarget: jest.fn(),
      reviewSubmission: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubmissionsController],
      providers: [
        {
          provide: SubmissionsService,
          useValue: submissionsService,
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

    controller = module.get<SubmissionsController>(SubmissionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('initializes the current student submission upload and wraps the response', async () => {
    submissionsService.initMySubmissionUpload.mockResolvedValue({
      materialId: 'material-1',
      uploadId: 'upload-1',
    });

    const result = await controller.initMySubmissionUpload(
      'assignment-1',
      {
        fileName: 'essay.mp4',
        mimeType: 'video/mp4',
        size: 2048,
      },
      { user: { userId: 'student-1' } } as never,
    );

    expect(submissionsService.initMySubmissionUpload).toHaveBeenCalledWith(
      'assignment-1',
      'student-1',
      {
        fileName: 'essay.mp4',
        mimeType: 'video/mp4',
        size: 2048,
      },
    );
    expect(result).toEqual({
      statusCode: 201,
      message: 'Submission upload initialized',
      result: {
        materialId: 'material-1',
        uploadId: 'upload-1',
      },
    });
  });

  it('returns my submission through the success envelope', async () => {
    submissionsService.getMySubmission.mockResolvedValue({
      assignmentId: 'assignment-1',
      submitted: false,
    });

    const result = await controller.getMySubmission(
      'assignment-1',
      { user: { userId: 'student-1' } } as never,
    );

    expect(submissionsService.getMySubmission).toHaveBeenCalledWith(
      'assignment-1',
      'student-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'My submission fetched',
      result: {
        assignmentId: 'assignment-1',
        submitted: false,
      },
    });
  });

  it('redirects my submission download to the signed url', async () => {
    const res = { redirect: jest.fn() };
    submissionsService.getMySubmissionDownloadTarget.mockResolvedValue({
      type: 'remote',
      url: 'https://signed-submission-download',
    });

    await controller.downloadMySubmission(
      'assignment-1',
      { user: { userId: 'student-1' } } as never,
      res as never,
    );

    expect(submissionsService.getMySubmissionDownloadTarget).toHaveBeenCalledWith(
      'assignment-1',
      'student-1',
    );
    expect(res.redirect).toHaveBeenCalledWith(
      'https://signed-submission-download',
    );
  });

  it('reviews a submission through the owner route', async () => {
    submissionsService.reviewSubmission.mockResolvedValue({
      assignmentId: 'assignment-1',
      studentId: 'student-2',
      grade: 9,
    });

    const result = await controller.reviewSubmission(
      'assignment-1',
      'student-2',
      { grade: 9, feedback: 'Strong work' },
    );

    expect(submissionsService.reviewSubmission).toHaveBeenCalledWith(
      'assignment-1',
      'student-2',
      { grade: 9, feedback: 'Strong work' },
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Submission reviewed',
      result: {
        assignmentId: 'assignment-1',
        studentId: 'student-2',
        grade: 9,
      },
    });
  });
});
