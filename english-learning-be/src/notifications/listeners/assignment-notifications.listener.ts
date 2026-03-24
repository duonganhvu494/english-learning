import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentCreatedEvent } from 'src/assignments/events/assignment-created.event';
import { AssignmentEntity } from 'src/assignments/entities/assignment.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { NotificationsService } from '../notifications.service';
import { NotificationType } from '../entities/notification.entity';

@Injectable()
export class AssignmentNotificationsListener {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(AssignmentCreatedEvent.eventName)
  async handleAssignmentCreated(event: AssignmentCreatedEvent): Promise<void> {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: event.assignmentId },
      relations: {
        session: {
          classEntity: {
            workspace: true,
          },
        },
      },
    });

    if (!assignment) {
      return;
    }

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

    await this.notificationsService.createManyNotifications(
      classStudents.map((classStudent) => ({
        recipientUserId: classStudent.student.id,
        type: NotificationType.ASSIGNMENT_CREATED,
        title: 'New assignment posted',
        body: `${assignment.title} has been posted for ${assignment.session.topic}.`,
        data: {
          workspaceId: assignment.session.classEntity.workspace.id,
          classId: assignment.session.classEntity.id,
          sessionId: assignment.session.id,
          assignmentId: assignment.id,
          actorUserId: event.actorUserId,
        },
        dedupeKey: `assignment-created:${assignment.id}:${classStudent.student.id}`,
      })),
    );
  }
}
