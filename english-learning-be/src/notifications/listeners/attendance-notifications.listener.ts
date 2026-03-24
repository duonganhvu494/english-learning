import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttendanceUpdatedEvent } from 'src/attendances/events/attendance-updated.event';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class AttendanceNotificationsListener {
  constructor(
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(AttendanceUpdatedEvent.eventName)
  async handleAttendanceUpdated(event: AttendanceUpdatedEvent): Promise<void> {
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

    await this.notificationsService.createNotification({
      recipientUserId: event.studentId,
      type: NotificationType.ATTENDANCE_UPDATED,
      title: 'Your attendance was updated',
      body: `You were marked ${event.status} for ${session.topic}.`,
      data: {
        workspaceId: session.classEntity.workspace.id,
        classId: session.classEntity.id,
        sessionId: session.id,
        studentId: event.studentId,
        status: event.status,
        updatedAt: event.updatedAt,
      },
      dedupeKey: `attendance-updated:${event.sessionId}:${event.studentId}:${event.updatedAt}`,
    });
  }
}
