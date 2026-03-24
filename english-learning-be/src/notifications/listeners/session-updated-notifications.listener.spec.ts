import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { SessionUpdatedEvent } from 'src/sessions/events/session-updated.event';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { SessionUpdatedNotificationsListener } from './session-updated-notifications.listener';

describe('SessionUpdatedNotificationsListener', () => {
  let listener: SessionUpdatedNotificationsListener;
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
        SessionUpdatedNotificationsListener,
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

    listener = module.get(SessionUpdatedNotificationsListener);
  });

  it('creates one student notification per class member when a session is updated', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      topic: 'Speaking Practice Advanced',
      timeStart: new Date('2026-03-24T09:00:00.000Z'),
      timeEnd: new Date('2026-03-24T11:00:00.000Z'),
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    });
    classStudentRepo.find.mockResolvedValue([
      { student: { id: 'student-1' } },
      { student: { id: 'student-2' } },
    ]);

    await listener.handleSessionUpdated(
      new SessionUpdatedEvent(
        'session-1',
        'Speaking Practice',
        '2026-03-24T08:00:00.000Z',
        '2026-03-24T10:00:00.000Z',
        '2026-03-24T07:00:00.000Z',
      ),
    );

    expect(notificationsService.createManyNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.SESSION_UPDATED,
      }),
      expect.objectContaining({
        recipientUserId: 'student-2',
        type: NotificationType.SESSION_UPDATED,
      }),
    ]);
  });
});
