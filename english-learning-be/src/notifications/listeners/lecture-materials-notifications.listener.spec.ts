import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { LectureEntity } from 'src/lectures/entities/lecture.entity';
import { LectureMaterialsPublishedEvent } from 'src/lectures/events/lecture-materials-published.event';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { LectureMaterialsNotificationsListener } from './lecture-materials-notifications.listener';

describe('LectureMaterialsNotificationsListener', () => {
  let listener: LectureMaterialsNotificationsListener;
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
        LectureMaterialsNotificationsListener,
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

    listener = module.get(LectureMaterialsNotificationsListener);
  });

  it('creates lecture material notifications for class students', async () => {
    lectureRepo.findOne.mockResolvedValue({
      id: 'lecture-1',
      title: 'Present Simple Overview',
      session: {
        id: 'session-1',
        classEntity: {
          id: 'class-1',
          workspace: { id: 'workspace-1' },
        },
      },
    });
    classStudentRepo.find.mockResolvedValue([{ student: { id: 'student-1' } }]);

    await listener.handleLectureMaterialsPublished(
      new LectureMaterialsPublishedEvent(
        'lecture-1',
        'session-1',
        'teacher-1',
        ['material-1'],
        '2026-03-24T07:00:00.000Z',
      ),
    );

    expect(notificationsService.createManyNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.LECTURE_MATERIALS_PUBLISHED,
      }),
    ]);
  });
});
