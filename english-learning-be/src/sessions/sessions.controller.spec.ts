import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { RbacPermissionGuard } from 'src/rbac/guards/rbac-permission.guard';
import { RbacService } from 'src/rbac/rbac.service';
import { WorkspaceAccessService } from 'src/rbac/workspace-access.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

describe('SessionsController', () => {
  let controller: SessionsController;
  let sessionsService: {
    createSession: jest.Mock;
    listClassSessions: jest.Mock;
    getSessionDetail: jest.Mock;
    deleteSession: jest.Mock;
  };

  beforeEach(async () => {
    sessionsService = {
      createSession: jest.fn(),
      listClassSessions: jest.fn(),
      getSessionDetail: jest.fn(),
      deleteSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: sessionsService,
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

    controller = module.get<SessionsController>(SessionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates a session for a class and returns the created envelope', async () => {
    sessionsService.createSession.mockResolvedValue({ id: 'session-1' });

    const result = await controller.createSession('class-1', {
      title: 'Buoi 1',
      timeStart: '2026-03-18T08:00:00.000Z',
      timeEnd: '2026-03-18T10:00:00.000Z',
    });

    expect(sessionsService.createSession).toHaveBeenCalledWith('class-1', {
      title: 'Buoi 1',
      timeStart: '2026-03-18T08:00:00.000Z',
      timeEnd: '2026-03-18T10:00:00.000Z',
    });
    expect(result).toEqual({
      statusCode: 201,
      message: 'Session created',
      result: { id: 'session-1' },
    });
  });

  it('lists class sessions', async () => {
    sessionsService.listClassSessions.mockResolvedValue([{ id: 'session-1' }]);

    const result = await controller.listClassSessions('class-1');

    expect(sessionsService.listClassSessions).toHaveBeenCalledWith('class-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'Class sessions fetched',
      result: [{ id: 'session-1' }],
    });
  });

  it('returns session detail', async () => {
    sessionsService.getSessionDetail.mockResolvedValue({ id: 'session-1' });

    const result = await controller.getSessionDetail('session-1');

    expect(sessionsService.getSessionDetail).toHaveBeenCalledWith('session-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'Session detail fetched',
      result: { id: 'session-1' },
    });
  });

  it('deletes a session', async () => {
    sessionsService.deleteSession.mockResolvedValue({ sessionId: 'session-1' });

    const result = await controller.deleteSession('session-1');

    expect(sessionsService.deleteSession).toHaveBeenCalledWith('session-1');
    expect(result).toEqual({
      statusCode: 200,
      message: 'Session deleted',
      result: { sessionId: 'session-1' },
    });
  });
});
