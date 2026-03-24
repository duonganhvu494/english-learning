import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { LectureEntity } from 'src/lectures/entities/lecture.entity';
import { LectureCreatedEvent } from 'src/lectures/events/lecture-created.event';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { LectureNotificationsListener } from './lecture-notifications.listener';

describe('LectureNotificationsListener', () => {
  let listener: LectureNotificationsListener;
  const lectureRepo = {
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
        LectureNotificationsListener,
        {
          provide: getRepositoryToken(LectureEntity),
          useValue: lectureRepo,
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

    listener = module.get(LectureNotificationsListener);
  });

  it('creates lecture notifications for class students', async () => {
    lectureRepo.findOne.mockResolvedValue({
      id: 'lecture-1',
      title: 'Present Simple Overview',
      session: {
        id: 'session-1',
        topic: 'Grammar Revision',
        classEntity: {
          id: 'class-1',
          workspace: { id: 'workspace-1' },
        },
      },
    });
    classStudentRepo.find.mockResolvedValue([{ student: { id: 'student-1' } }]);

    await listener.handleLectureCreated(
      new LectureCreatedEvent('lecture-1', 'session-1', 'teacher-1'),
    );

    expect(notificationsService.createManyNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.LECTURE_CREATED,
      }),
    ]);
  });
});
