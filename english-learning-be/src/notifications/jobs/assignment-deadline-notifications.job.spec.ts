import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AssignmentEntity, AssignmentType } from 'src/assignments/entities/assignment.entity';
import {
  AssignmentQuizAttemptEntity,
  AssignmentQuizAttemptStatus,
} from 'src/assignments/entities/assignment-quiz-attempt.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { AssignmentDeadlineNotificationsJob } from './assignment-deadline-notifications.job';

describe('AssignmentDeadlineNotificationsJob', () => {
  let job: AssignmentDeadlineNotificationsJob;
  const assignmentRepo = {
    find: jest.fn(),
  };
  const classStudentRepo = {
    find: jest.fn(),
  };
  const submissionRepo = {
    find: jest.fn(),
  };
  const quizAttemptRepo = {
    find: jest.fn(),
  };
  const notificationsService = {
    createManyNotifications: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentDeadlineNotificationsJob,
        {
          provide: getRepositoryToken(AssignmentEntity),
          useValue: assignmentRepo,
        },
        {
          provide: getRepositoryToken(ClassStudent),
          useValue: classStudentRepo,
        },
        {
          provide: getRepositoryToken(SubmissionEntity),
          useValue: submissionRepo,
        },
        {
          provide: getRepositoryToken(AssignmentQuizAttemptEntity),
          useValue: quizAttemptRepo,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NOTIFICATION_ASSIGNMENT_DUE_REMINDER_MINUTES') {
                return '1440';
              }
              if (key === 'NOTIFICATION_ASSIGNMENT_MISSED_LOOKBACK_DAYS') {
                return '30';
              }

              return undefined;
            }),
          },
        },
      ],
    }).compile();

    job = module.get(AssignmentDeadlineNotificationsJob);
  });

  it('sends due reminder notifications to manual-assignment students without submissions', async () => {
    assignmentRepo.find.mockResolvedValue([
      {
        id: 'assignment-1',
        type: AssignmentType.MANUAL,
        title: 'Homework 01',
        timeStart: new Date('2026-03-24T08:00:00.000Z'),
        timeEnd: new Date('2026-03-25T08:00:00.000Z'),
        session: {
          id: 'session-1',
          classEntity: {
            id: 'class-1',
            workspace: { id: 'workspace-1' },
          },
        },
      },
    ]);
    classStudentRepo.find.mockResolvedValue([
      { student: { id: 'student-1' } },
      { student: { id: 'student-2' } },
    ]);
    submissionRepo.find.mockResolvedValue([{ student: { id: 'student-2' } }]);

    await job.sendDueReminderNotifications(new Date('2026-03-24T08:00:00.000Z'));

    expect(notificationsService.createManyNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.ASSIGNMENT_DUE_REMINDER,
      }),
    ]);
  });

  it('sends missed notifications to quiz students without submitted attempts', async () => {
    assignmentRepo.find.mockResolvedValue([
      {
        id: 'assignment-quiz-1',
        type: AssignmentType.QUIZ,
        title: 'Vocabulary Quiz',
        timeStart: new Date('2026-03-23T08:00:00.000Z'),
        timeEnd: new Date('2026-03-24T08:00:00.000Z'),
        session: {
          id: 'session-1',
          classEntity: {
            id: 'class-1',
            workspace: { id: 'workspace-1' },
          },
        },
      },
    ]);
    classStudentRepo.find.mockResolvedValue([
      { student: { id: 'student-1' } },
      { student: { id: 'student-2' } },
    ]);
    quizAttemptRepo.find.mockResolvedValue([
      {
        student: { id: 'student-2' },
        status: AssignmentQuizAttemptStatus.SUBMITTED,
      },
    ]);

    await job.sendMissedNotifications(new Date('2026-03-24T09:00:00.000Z'));

    expect(notificationsService.createManyNotifications).toHaveBeenCalledWith([
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.ASSIGNMENT_MISSED,
      }),
    ]);
  });
});
