import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { ClassStudentsAddedEvent } from 'src/classes/events/class-students-added.event';
import { User } from 'src/users/entities/user.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { ClassStudentNotificationsListener } from './class-student-notifications.listener';

describe('ClassStudentNotificationsListener', () => {
  let listener: ClassStudentNotificationsListener;
  const classRepo = {
    findOne: jest.fn(),
  };
  const userRepo = {
    find: jest.fn(),
  };
  const notificationsService = {
    createManyNotifications: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassStudentNotificationsListener,
        {
          provide: getRepositoryToken(ClassEntity),
          useValue: classRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepo,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    listener = module.get(ClassStudentNotificationsListener);
  });

  it('creates welcome notifications for newly added students', async () => {
    classRepo.findOne.mockResolvedValue({
      id: 'class-1',
      className: 'Grammar A',
    });
    userRepo.find.mockResolvedValue([{ id: 'student-1' }, { id: 'student-2' }]);

    await listener.handleClassStudentsAdded(
      new ClassStudentsAddedEvent(
        'workspace-1',
        'class-1',
        ['student-1', 'student-2'],
        '2026-03-24T07:00:00.000Z',
      ),
    );

    expect(notificationsService.createManyNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.CLASS_STUDENT_ADDED,
      }),
      expect.objectContaining({
        recipientUserId: 'student-2',
        type: NotificationType.CLASS_STUDENT_ADDED,
      }),
    ]);
  });
});
