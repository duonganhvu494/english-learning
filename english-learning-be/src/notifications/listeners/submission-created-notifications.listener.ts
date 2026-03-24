import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { SubmissionCreatedEvent } from 'src/submissions/events/submission-created.event';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../entities/notification.entity';

@Injectable()
export class SubmissionCreatedNotificationsListener {
  constructor(
    @InjectRepository(SubmissionEntity)
    private readonly submissionRepo: Repository<SubmissionEntity>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(SubmissionCreatedEvent.eventName)
  async handleSubmissionCreated(
    event: SubmissionCreatedEvent,
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
              workspace: {
                owner: true,
              },
            },
          },
        },
        student: true,
      },
    });

    if (!submission?.assignment.session.classEntity.workspace.owner) {
      return;
    }

    const studentName = this.resolveStudentName(submission.student);
    const title = event.isResubmission
      ? 'Student resubmitted an assignment'
      : 'New assignment submission received';
    const body = event.isResubmission
      ? `${studentName} resubmitted ${submission.assignment.title}.`
      : `${studentName} submitted ${submission.assignment.title}.`;

    await this.notificationsService.createNotification({
      recipientUserId: submission.assignment.session.classEntity.workspace.owner.id,
      type: NotificationType.SUBMISSION_CREATED,
      title,
      body,
      data: {
        workspaceId: submission.assignment.session.classEntity.workspace.id,
        classId: submission.assignment.session.classEntity.id,
        sessionId: submission.assignment.session.id,
        assignmentId: submission.assignment.id,
        studentId: submission.student.id,
        submitterUserId: event.submitterUserId,
        submittedAt: event.submittedAt,
        isResubmission: event.isResubmission,
      },
      dedupeKey: `submission-created:${submission.assignment.id}:${submission.student.id}:${event.submittedAt}`,
    });
  }

  private resolveStudentName(student: {
    fullName?: string | null;
    userName?: string | null;
    email?: string | null;
    id: string;
  }): string {
    return student.fullName || student.userName || student.email || student.id;
  }
}
