import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { SessionCreatedEvent } from 'src/sessions/events/session-created.event';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { SessionNotificationsListener } from './session-notifications.listener';

describe('SessionNotificationsListener', () => {
  let listener: SessionNotificationsListener;
  const sessionRepo = {
    findOne: jest.fn(),
  };
  const classStudentRepo = {
    find: jest.fn(),
  };
  const notificationsService = {
    createManyNotifications: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionNotificationsListener,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: sessionRepo,
        },
        {
          provide: getRepositoryToken(ClassStudent),
          useValue: classStudentRepo,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    listener = module.get<SessionNotificationsListener>(
      SessionNotificationsListener,
    );
  });

  it('creates one student notification per class member when a session is created', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      topic: 'Speaking Practice',
      timeStart: new Date('2026-03-24T08:00:00.000Z'),
      timeEnd: new Date('2026-03-24T10:00:00.000Z'),
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    });
    classStudentRepo.find.mockResolvedValue([
      { student: { id: 'student-1' } },
      { student: { id: 'student-2' } },
    ]);
    notificationsService.createManyNotifications.mockResolvedValue(undefined);

    await listener.handleSessionCreated(
      new SessionCreatedEvent('session-1', 'class-1'),
    );

    expect(notificationsService.createManyNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.SESSION_CREATED,
        dedupeKey: 'session-created:session-1:student-1',
      }),
      expect.objectContaining({
        recipientUserId: 'student-2',
        type: NotificationType.SESSION_CREATED,
        dedupeKey: 'session-created:session-1:student-2',
      }),
    ]);
  });
});
