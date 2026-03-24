import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionReviewedEvent } from 'src/submissions/events/submission-reviewed.event';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../entities/notification.entity';

@Injectable()
export class SubmissionNotificationsListener {
  constructor(
    @InjectRepository(SubmissionEntity)
    private readonly submissionRepo: Repository<SubmissionEntity>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(SubmissionReviewedEvent.eventName)
  async handleSubmissionReviewed(
    event: SubmissionReviewedEvent,
  ): Promise<void> {
    const submission = await this.submissionRepo.findOne({
      where: {
        assignment: { id: event.assignmentId },
        student: { id: event.studentId },
      },
      relations: {
        assignment: {
          session: {
            classEntity: {
              workspace: true,
            },
          },
        },
        student: true,
      },
    });

    if (!submission) {
      return;
    }

    const title =
      submission.grade !== null
        ? 'Your submission was graded'
        : 'Your submission was reviewed';
    const body =
      submission.grade !== null
        ? `You received ${submission.grade} for ${submission.assignment.title}.`
        : `${submission.assignment.title} has new feedback from your teacher.`;

    await this.notificationsService.createNotification({
      recipientUserId: submission.student.id,
      type: NotificationType.SUBMISSION_REVIEWED,
      title,
      body,
      data: {
        workspaceId: submission.assignment.session.classEntity.workspace.id,
        classId: submission.assignment.session.classEntity.id,
        sessionId: submission.assignment.session.id,
        assignmentId: submission.assignment.id,
        studentId: submission.student.id,
        reviewerUserId: event.reviewerUserId,
        grade: submission.grade,
        feedback: submission.feedback,
      },
      dedupeKey: `submission-reviewed:${submission.assignment.id}:${submission.student.id}:${event.reviewedAt}`,
    });
  }
}
