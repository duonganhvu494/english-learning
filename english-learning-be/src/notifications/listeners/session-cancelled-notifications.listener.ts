import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { SessionCancelledEvent } from 'src/sessions/events/session-cancelled.event';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class SessionCancelledNotificationsListener {
  constructor(
    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(SessionCancelledEvent.eventName)
  async handleSessionCancelled(event: SessionCancelledEvent): Promise<void> {
    const classStudents = await this.classStudentRepo.find({
      where: {
        classEntity: { id: event.classId },
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
        type: NotificationType.SESSION_CANCELLED,
        title: 'Class session cancelled',
        body: `${event.topic} has been cancelled.`,
        data: {
          workspaceId: event.workspaceId,
          classId: event.classId,
          sessionId: event.sessionId,
          topic: event.topic,
          timeStart: event.timeStart,
          timeEnd: event.timeEnd,
          cancelledAt: event.cancelledAt,
        },
        dedupeKey: `session-cancelled:${event.sessionId}:${classStudent.student.id}`,
      })),
    );
  }
}
