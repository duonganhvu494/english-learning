import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { SessionCreatedEvent } from 'src/sessions/events/session-created.event';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class SessionNotificationsListener {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(SessionCreatedEvent.eventName)
  async handleSessionCreated(event: SessionCreatedEvent): Promise<void> {
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
        type: NotificationType.SESSION_CREATED,
        title: 'New class session scheduled',
        body: `${session.topic} has been scheduled for your class.`,
        data: {
          workspaceId: session.classEntity.workspace.id,
          classId: session.classEntity.id,
          sessionId: session.id,
          topic: session.topic,
          timeStart: session.timeStart.toISOString(),
          timeEnd: session.timeEnd.toISOString(),
        },
        dedupeKey: `session-created:${session.id}:${classStudent.student.id}`,
      })),
    );
  }
}
