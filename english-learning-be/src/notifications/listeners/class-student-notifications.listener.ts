import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ClassStudentsAddedEvent } from 'src/classes/events/class-students-added.event';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { User } from 'src/users/entities/user.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class ClassStudentNotificationsListener {
  constructor(
    @InjectRepository(ClassEntity)
    private readonly classRepo: Repository<ClassEntity>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(ClassStudentsAddedEvent.eventName)
  async handleClassStudentsAdded(
    event: ClassStudentsAddedEvent,
  ): Promise<void> {
    if (event.studentIds.length === 0) {
      return;
    }

    const [classEntity, students] = await Promise.all([
      this.classRepo.findOne({
        where: { id: event.classId },
      }),
      this.userRepo.find({
        where: {
          id: In(event.studentIds),
        },
        select: {
          id: true,
        },
      }),
    ]);
    if (!classEntity || students.length === 0) {
      return;
    }

    await this.notificationsService.createManyNotifications(
      students.map((student) => ({
        recipientUserId: student.id,
        type: NotificationType.CLASS_STUDENT_ADDED,
        title: 'You were added to a class',
        body: `Welcome to ${classEntity.className}.`,
        data: {
          workspaceId: event.workspaceId,
          classId: event.classId,
          addedAt: event.addedAt,
        },
        dedupeKey: `class-student-added:${event.classId}:${student.id}:${event.addedAt}`,
      })),
    );
  }
}
