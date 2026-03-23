import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { SessionEntity } from './entities/session.entity';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  let service: SessionsService;
  let sessionRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    delete: jest.Mock;
  };
  let classRepo: {
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    sessionRepo = {
      create: jest.fn((input: Partial<SessionEntity>) => input),
      save: jest.fn((input: Partial<SessionEntity>) =>
        Promise.resolve({
          id: 'session-1',
          ...input,
        }),
      ),
      find: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
      delete: jest.fn(() => Promise.resolve({ affected: 1 })),
    };
    classRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: sessionRepo,
        },
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: classRepo,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a session with a trimmed topic and generated scoped code', async () => {
    classRepo.findOne.mockResolvedValue({
      id: 'class-1',
      workspace: { id: 'workspace-1' },
    });
    sessionRepo.find.mockResolvedValue([
      {
        id: 'session-existing',
        topic: 'Grammar revision',
        timeStart: new Date('2026-03-20T08:00:00.000Z'),
        timeEnd: new Date('2026-03-20T10:00:00.000Z'),
        code: 'SES-001',
      },
    ]);

    const result = await service.createSession('class-1', {
      timeStart: '2026-03-21T08:00:00.000Z',
      timeEnd: '2026-03-21T10:00:00.000Z',
      topic: '  Speaking Practice  ',
    });

    expect(sessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Speaking Practice',
        code: 'SES-002',
        timeStart: new Date('2026-03-21T08:00:00.000Z'),
        timeEnd: new Date('2026-03-21T10:00:00.000Z'),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'session-1',
        code: 'SES-002',
        topic: 'Speaking Practice',
      }),
    );
  });

  it('rejects createSession when the same topic and time window already exist in a class', async () => {
    classRepo.findOne.mockResolvedValue({
      id: 'class-1',
      workspace: { id: 'workspace-1' },
    });
    sessionRepo.find.mockResolvedValue([
      {
        id: 'session-existing',
        topic: 'Speaking Practice',
        timeStart: new Date('2026-03-21T08:00:00.000Z'),
        timeEnd: new Date('2026-03-21T10:00:00.000Z'),
        code: 'SES-001',
      },
    ]);

    await expect(
      service.createSession('class-1', {
        timeStart: '2026-03-21T08:00:00.000Z',
        timeEnd: '2026-03-21T10:00:00.000Z',
        topic: 'speaking practice',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(sessionRepo.save).not.toHaveBeenCalled();
  });

  it('assigns a code when updating a legacy session without one', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      topic: 'Grammar revision',
      timeStart: new Date('2026-03-22T08:00:00.000Z'),
      timeEnd: new Date('2026-03-22T10:00:00.000Z'),
      code: null,
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    });
    sessionRepo.find.mockResolvedValue([
      {
        id: 'session-1',
        topic: 'Grammar revision',
        timeStart: new Date('2026-03-22T08:00:00.000Z'),
        timeEnd: new Date('2026-03-22T10:00:00.000Z'),
        code: null,
      },
      {
        id: 'session-2',
        topic: 'Reading practice',
        timeStart: new Date('2026-03-23T08:00:00.000Z'),
        timeEnd: new Date('2026-03-23T10:00:00.000Z'),
        code: 'SES-002',
      },
    ]);

    const result = await service.updateSession('session-1', {
      topic: 'Grammar revision advanced',
    });

    expect(sessionRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'session-1',
        code: 'SES-003',
        topic: 'Grammar revision advanced',
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'session-1',
        code: 'SES-003',
      }),
    );
  });
});
