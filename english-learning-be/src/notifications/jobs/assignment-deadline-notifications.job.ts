import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  AssignmentEntity,
  AssignmentType,
} from 'src/assignments/entities/assignment.entity';
import {
  AssignmentQuizAttemptEntity,
  AssignmentQuizAttemptStatus,
} from 'src/assignments/entities/assignment-quiz-attempt.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class AssignmentDeadlineNotificationsJob {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    @InjectRepository(SubmissionEntity)
    private readonly submissionRepo: Repository<SubmissionEntity>,

    @InjectRepository(AssignmentQuizAttemptEntity)
    private readonly quizAttemptRepo: Repository<AssignmentQuizAttemptEntity>,

    private readonly notificationsService: NotificationsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('*/10 * * * *')
  async handleAssignmentDeadlines(): Promise<void> {
    await this.sendDueReminderNotifications();
    await this.sendMissedNotifications();
  }

  async sendDueReminderNotifications(referenceTime = new Date()): Promise<void> {
    const reminderMinutes = this.getReminderMinutes();
    const reminderWindowEnd = new Date(
      referenceTime.getTime() + reminderMinutes * 60 * 1000,
    );

    const assignments = await this.assignmentRepo.find({
      where: {
        timeEnd: Between(referenceTime, reminderWindowEnd),
      },
      relations: {
        session: {
          classEntity: {
            workspace: true,
          },
        },
      },
    });

    for (const assignment of assignments) {
      await this.notifyIncompleteStudents(
        assignment,
        NotificationType.ASSIGNMENT_DUE_REMINDER,
      );
    }
  }

  async sendMissedNotifications(referenceTime = new Date()): Promise<void> {
    const lookbackDays = this.getMissedLookbackDays();
    const lookbackStart = new Date(
      referenceTime.getTime() - lookbackDays * 24 * 60 * 60 * 1000,
    );

    const assignments = await this.assignmentRepo.find({
      where: {
        timeEnd: Between(lookbackStart, referenceTime),
      },
      relations: {
        session: {
          classEntity: {
            workspace: true,
          },
        },
      },
    });

    for (const assignment of assignments) {
      await this.notifyIncompleteStudents(
        assignment,
        NotificationType.ASSIGNMENT_MISSED,
      );
    }
  }

  private async notifyIncompleteStudents(
    assignment: AssignmentEntity,
    type: NotificationType.ASSIGNMENT_DUE_REMINDER | NotificationType.ASSIGNMENT_MISSED,
  ): Promise<void> {
    const classStudents = await this.classStudentRepo.find({
      where: {
        classEntity: { id: assignment.session.classEntity.id },
      },
      relations: {
        student: true,
      },
    });
    if (classStudents.length === 0) {
      return;
    }

    const completedStudentIds = await this.getCompletedStudentIds(assignment);
    const recipientStudents = classStudents.filter(
      (classStudent) => !completedStudentIds.has(classStudent.student.id),
    );
    if (recipientStudents.length === 0) {
      return;
    }

    const title =
      type === NotificationType.ASSIGNMENT_DUE_REMINDER
        ? 'Assignment due soon'
        : 'Assignment deadline missed';
    const body =
      type === NotificationType.ASSIGNMENT_DUE_REMINDER
        ? `${assignment.title} is due soon.`
        : `You missed the deadline for ${assignment.title}.`;

    await this.notificationsService.createManyNotifications(
      recipientStudents.map((classStudent) => ({
        recipientUserId: classStudent.student.id,
        type,
        title,
        body,
        data: {
          workspaceId: assignment.session.classEntity.workspace.id,
          classId: assignment.session.classEntity.id,
          sessionId: assignment.session.id,
          assignmentId: assignment.id,
          assignmentType: assignment.type,
          timeStart: assignment.timeStart.toISOString(),
          timeEnd: assignment.timeEnd.toISOString(),
        },
        dedupeKey:
          type === NotificationType.ASSIGNMENT_DUE_REMINDER
            ? `assignment-due-reminder:${assignment.id}:${classStudent.student.id}`
            : `assignment-missed:${assignment.id}:${classStudent.student.id}`,
      })),
    );
  }

  private async getCompletedStudentIds(
    assignment: AssignmentEntity,
  ): Promise<Set<string>> {
    if (assignment.type === AssignmentType.QUIZ) {
      const submittedAttempts = await this.quizAttemptRepo.find({
        where: {
          assignment: { id: assignment.id },
          status: AssignmentQuizAttemptStatus.SUBMITTED,
        },
        relations: {
          student: true,
        },
      });

      return new Set(
        submittedAttempts.map((attempt) => attempt.student.id),
      );
    }

    const submissions = await this.submissionRepo.find({
      where: {
        assignment: { id: assignment.id },
      },
      relations: {
        student: true,
      },
    });

    return new Set(submissions.map((submission) => submission.student.id));
  }

  private getReminderMinutes(): number {
    const rawValue = this.configService.get<string>(
      'NOTIFICATION_ASSIGNMENT_DUE_REMINDER_MINUTES',
    );
    const parsedValue = Number.parseInt(rawValue ?? '1440', 10);
    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      return 1440;
    }

    return parsedValue;
  }

  private getMissedLookbackDays(): number {
    const rawValue = this.configService.get<string>(
      'NOTIFICATION_ASSIGNMENT_MISSED_LOOKBACK_DAYS',
    );
    const parsedValue = Number.parseInt(rawValue ?? '30', 10);
    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      return 30;
    }

    return parsedValue;
  }
}
