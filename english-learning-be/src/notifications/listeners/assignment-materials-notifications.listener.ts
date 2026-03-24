import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentMaterialsPublishedEvent } from 'src/assignments/events/assignment-materials-published.event';
import { AssignmentEntity } from 'src/assignments/entities/assignment.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class AssignmentMaterialsNotificationsListener {
  constructor(
    @InjectRepository(AssignmentEntity)
    private readonly assignmentRepo: Repository<AssignmentEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(AssignmentMaterialsPublishedEvent.eventName)
  async handleAssignmentMaterialsPublished(
    event: AssignmentMaterialsPublishedEvent,
  ): Promise<void> {
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
        type: NotificationType.ASSIGNMENT_MATERIALS_PUBLISHED,
        title: 'New assignment materials available',
        body: `New materials were added to ${assignment.title}.`,
        data: {
          workspaceId: assignment.session.classEntity.workspace.id,
          classId: assignment.session.classEntity.id,
          sessionId: assignment.session.id,
          assignmentId: assignment.id,
          actorUserId: event.actorUserId,
          materialIds: event.materialIds,
          publishedAt: event.publishedAt,
        },
        dedupeKey: `assignment-materials-published:${assignment.id}:${classStudent.student.id}:${event.publishedAt}`,
      })),
    );
  }
}
