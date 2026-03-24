import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { SessionCancelledEvent } from 'src/sessions/events/session-cancelled.event';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { SessionCancelledNotificationsListener } from './session-cancelled-notifications.listener';

describe('SessionCancelledNotificationsListener', () => {
  let listener: SessionCancelledNotificationsListener;
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
        SessionCancelledNotificationsListener,
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

    listener = module.get(SessionCancelledNotificationsListener);
  });

  it('creates cancellation notifications for class students', async () => {
    classStudentRepo.find.mockResolvedValue([
      { student: { id: 'student-1' } },
      { student: { id: 'student-2' } },
    ]);

    await listener.handleSessionCancelled(
      new SessionCancelledEvent(
        'session-1',
        'workspace-1',
        'class-1',
        'Speaking Practice',
        '2026-03-24T08:00:00.000Z',
        '2026-03-24T10:00:00.000Z',
        '2026-03-24T07:00:00.000Z',
      ),
    );

    expect(notificationsService.createManyNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.SESSION_CANCELLED,
      }),
      expect.objectContaining({
        recipientUserId: 'student-2',
        type: NotificationType.SESSION_CANCELLED,
      }),
    ]);
  });
});
