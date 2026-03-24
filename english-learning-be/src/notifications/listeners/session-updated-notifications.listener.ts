import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { SessionUpdatedEvent } from 'src/sessions/events/session-updated.event';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class SessionUpdatedNotificationsListener {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(SessionUpdatedEvent.eventName)
  async handleSessionUpdated(event: SessionUpdatedEvent): Promise<void> {
    const session = await this.sessionRepo.findOne({
      where: { id: event.sessionId },
      relations: {
        classEntity: {
          workspace: true,
        },
      },
    });
    if (!session) {
      return;
    }

    const classStudents = await this.classStudentRepo.find({
      where: {
        classEntity: { id: session.classEntity.id },
      },
      relations: {
        student: true,
      },
    });
    if (classStudents.length === 0) {
      return;
    }

    await this.notificationsService.createManyNotifications(
      classStudents.map((classStudent) => ({
        recipientUserId: classStudent.student.id,
        type: NotificationType.SESSION_UPDATED,
        title: 'Class session updated',
        body: `${session.topic} has been updated. Please check the latest schedule.`,
        data: {
          workspaceId: session.classEntity.workspace.id,
          classId: session.classEntity.id,
          sessionId: session.id,
          topic: session.topic,
          timeStart: session.timeStart.toISOString(),
          timeEnd: session.timeEnd.toISOString(),
          previousTopic: event.previousTopic,
          previousTimeStart: event.previousTimeStart,
          previousTimeEnd: event.previousTimeEnd,
        },
        dedupeKey: `session-updated:${session.id}:${classStudent.student.id}:${event.updatedAt}`,
      })),
    );
  }
}
