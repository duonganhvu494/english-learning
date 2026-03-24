import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AttendanceStatus } from 'src/attendances/entities/attendance.entity';
import { AttendanceUpdatedEvent } from 'src/attendances/events/attendance-updated.event';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { AttendanceNotificationsListener } from './attendance-notifications.listener';

describe('AttendanceNotificationsListener', () => {
  let listener: AttendanceNotificationsListener;
  const sessionRepo = {
    findOne: jest.fn(),
  };
  const notificationsService = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceNotificationsListener,
        {
          provide: getRepositoryToken(SessionEntity),
          useValue: sessionRepo,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    listener = module.get(AttendanceNotificationsListener);
  });

  it('creates a student notification when attendance is updated', async () => {
    sessionRepo.findOne.mockResolvedValue({
      id: 'session-1',
      topic: 'Speaking Practice',
      classEntity: {
        id: 'class-1',
        workspace: { id: 'workspace-1' },
      },
    });

    await listener.handleAttendanceUpdated(
      new AttendanceUpdatedEvent(
        'session-1',
        'student-1',
        AttendanceStatus.LATE,
        '2026-03-24T07:00:00.000Z',
      ),
    );

    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.ATTENDANCE_UPDATED,
      }),
    );
  });
});
