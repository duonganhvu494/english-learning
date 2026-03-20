import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RbacService } from 'src/rbac/rbac.service';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { LecturesController } from './lectures.controller';
import { LecturesService } from './lectures.service';

describe('LecturesController', () => {
  let controller: LecturesController;
  let lecturesService: {
    createLecture: jest.Mock;
    listSessionLectures: jest.Mock;
    getLectureMaterialDownloadTarget: jest.Mock;
    updateLecture: jest.Mock;
  };

  beforeEach(async () => {
    lecturesService = {
      createLecture: jest.fn(),
      listSessionLectures: jest.fn(),
      getLectureMaterialDownloadTarget: jest.fn(),
      updateLecture: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LecturesController],
      providers: [
        {
          provide: LecturesService,
          useValue: lecturesService,
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

    controller = module.get<LecturesController>(LecturesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates a lecture for the current owner and wraps the response', async () => {
    lecturesService.createLecture.mockResolvedValue({ id: 'lecture-1' });

    const result = await controller.createLecture(
      'session-1',
      { title: 'Lecture 01', materialIds: ['material-1'] },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(lecturesService.createLecture).toHaveBeenCalledWith(
      'session-1',
      { title: 'Lecture 01', materialIds: ['material-1'] },
      'owner-1',
    );
    expect(result).toEqual({
      statusCode: 201,
      message: 'Lecture created',
      result: { id: 'lecture-1' },
    });
  });

  it('lists session lectures through the success envelope', async () => {
    lecturesService.listSessionLectures.mockResolvedValue([{ id: 'lecture-1' }]);

    const result = await controller.listSessionLectures('session-1');

    expect(lecturesService.listSessionLectures).toHaveBeenCalledWith('session-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'Session lectures fetched',
      result: [{ id: 'lecture-1' }],
    });
  });

  it('redirects lecture material download to the signed url', async () => {
    const res = { redirect: jest.fn() };
    lecturesService.getLectureMaterialDownloadTarget.mockResolvedValue({
      type: 'remote',
      url: 'https://signed-lecture-material',
    });

    await controller.downloadLectureMaterial(
      'lecture-1',
      'material-1',
      res as never,
    );

    expect(lecturesService.getLectureMaterialDownloadTarget).toHaveBeenCalledWith(
      'lecture-1',
      'material-1',
    );
    expect(res.redirect).toHaveBeenCalledWith(
      'https://signed-lecture-material',
    );
  });

  it('updates a lecture with the current owner id', async () => {
    lecturesService.updateLecture.mockResolvedValue({ id: 'lecture-1' });

    const result = await controller.updateLecture(
      'lecture-1',
      { title: 'Updated lecture' },
      { user: { userId: 'owner-1' } } as never,
    );

    expect(lecturesService.updateLecture).toHaveBeenCalledWith(
      'lecture-1',
      { title: 'Updated lecture' },
      'owner-1',
    );
    expect(result).toEqual({
      statusCode: 200,
      message: 'Lecture updated',
      result: { id: 'lecture-1' },
    });
  });
});
