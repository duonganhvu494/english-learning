import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { SubmissionCreatedEvent } from 'src/submissions/events/submission-created.event';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { SubmissionCreatedNotificationsListener } from './submission-created-notifications.listener';

describe('SubmissionCreatedNotificationsListener', () => {
  let listener: SubmissionCreatedNotificationsListener;
  const submissionRepo = {
    findOne: jest.fn(),
  };
  const notificationsService = {
    createNotification: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionCreatedNotificationsListener,
        {
          provide: getRepositoryToken(SubmissionEntity),
          useValue: submissionRepo,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    listener = module.get<SubmissionCreatedNotificationsListener>(
      SubmissionCreatedNotificationsListener,
    );
  });

  it('creates a teacher notification for a new submission', async () => {
    submissionRepo.findOne.mockResolvedValue({
      assignment: {
        id: 'assignment-1',
        title: 'Homework 01',
        session: {
          id: 'session-1',
          classEntity: {
            id: 'class-1',
            workspace: {
              id: 'workspace-1',
              owner: { id: 'teacher-1' },
            },
          },
        },
      },
      student: { id: 'student-1', fullName: 'Nguyen Van A' },
    });
    notificationsService.createNotification.mockResolvedValue(undefined);

    await listener.handleSubmissionCreated(
      new SubmissionCreatedEvent(
        'assignment-1',
        'student-1',
        'student-1',
        '2026-03-24T12:00:00.000Z',
        false,
      ),
    );

    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'teacher-1',
        type: NotificationType.SUBMISSION_CREATED,
        title: 'New assignment submission received',
        dedupeKey:
          'submission-created:assignment-1:student-1:2026-03-24T12:00:00.000Z',
      }),
    );
  });

  it('uses resubmission copy when a student submits again', async () => {
    submissionRepo.findOne.mockResolvedValue({
      assignment: {
        id: 'assignment-1',
        title: 'Homework 01',
        session: {
          id: 'session-1',
          classEntity: {
            id: 'class-1',
            workspace: {
              id: 'workspace-1',
              owner: { id: 'teacher-1' },
            },
          },
        },
      },
      student: { id: 'student-1', fullName: 'Nguyen Van A' },
    });
    notificationsService.createNotification.mockResolvedValue(undefined);

    await listener.handleSubmissionCreated(
      new SubmissionCreatedEvent(
        'assignment-1',
        'student-1',
        'student-1',
        '2026-03-24T13:00:00.000Z',
        true,
      ),
    );

    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Student resubmitted an assignment',
        body: 'Nguyen Van A resubmitted Homework 01.',
      }),
    );
  });
});
