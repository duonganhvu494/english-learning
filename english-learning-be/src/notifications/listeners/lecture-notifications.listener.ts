import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { LectureCreatedEvent } from 'src/lectures/events/lecture-created.event';
import { LectureEntity } from 'src/lectures/entities/lecture.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class LectureNotificationsListener {
  constructor(
    @InjectRepository(LectureEntity)
    private readonly lectureRepo: Repository<LectureEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(LectureCreatedEvent.eventName)
  async handleLectureCreated(event: LectureCreatedEvent): Promise<void> {
    const lecture = await this.lectureRepo.findOne({
      where: { id: event.lectureId },
      relations: {
        session: {
          classEntity: {
            workspace: true,
          },
        },
      },
    });
    if (!lecture) {
      return;
    }

    const classStudents = await this.classStudentRepo.find({
      where: {
        classEntity: { id: lecture.session.classEntity.id },
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
        type: NotificationType.LECTURE_CREATED,
        title: 'New lecture published',
        body: `${lecture.title} has been added to ${lecture.session.topic}.`,
        data: {
          workspaceId: lecture.session.classEntity.workspace.id,
          classId: lecture.session.classEntity.id,
          sessionId: lecture.session.id,
          lectureId: lecture.id,
          actorUserId: event.actorUserId,
        },
        dedupeKey: `lecture-created:${lecture.id}:${classStudent.student.id}`,
      })),
    );
  }
}
