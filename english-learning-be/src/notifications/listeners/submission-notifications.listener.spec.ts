import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { SubmissionReviewedEvent } from 'src/submissions/events/submission-reviewed.event';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';
import { SubmissionNotificationsListener } from './submission-notifications.listener';

describe('SubmissionNotificationsListener', () => {
  let listener: SubmissionNotificationsListener;
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
        SubmissionNotificationsListener,
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

    listener = module.get<SubmissionNotificationsListener>(
      SubmissionNotificationsListener,
    );
  });

  it('creates a student notification when a submission is reviewed', async () => {
    submissionRepo.findOne.mockResolvedValue({
      assignment: {
        id: 'assignment-1',
        title: 'Homework 01',
        session: {
          id: 'session-1',
          classEntity: {
            id: 'class-1',
            workspace: { id: 'workspace-1' },
          },
        },
      },
      student: { id: 'student-1' },
      grade: 8.5,
      feedback: 'Strong work',
    });
    notificationsService.createNotification.mockResolvedValue(undefined);

    await listener.handleSubmissionReviewed(
      new SubmissionReviewedEvent(
        'assignment-1',
        'student-1',
        'teacher-1',
        '2026-03-24T12:00:00.000Z',
      ),
    );

    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'student-1',
        type: NotificationType.SUBMISSION_REVIEWED,
        dedupeKey:
          'submission-reviewed:assignment-1:student-1:2026-03-24T12:00:00.000Z',
      }),
    );
  });
});
