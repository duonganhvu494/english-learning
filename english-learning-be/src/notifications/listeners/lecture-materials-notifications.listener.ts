import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { LectureMaterialsPublishedEvent } from 'src/lectures/events/lecture-materials-published.event';
import { LectureEntity } from 'src/lectures/entities/lecture.entity';
import { NotificationType } from '../entities/notification.entity';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class LectureMaterialsNotificationsListener {
  constructor(
    @InjectRepository(LectureEntity)
    private readonly lectureRepo: Repository<LectureEntity>,

    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,

    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(LectureMaterialsPublishedEvent.eventName)
  async handleLectureMaterialsPublished(
    event: LectureMaterialsPublishedEvent,
  ): Promise<void> {
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
        type: NotificationType.LECTURE_MATERIALS_PUBLISHED,
        title: 'New lecture materials available',
        body: `New materials were added to ${lecture.title}.`,
        data: {
          workspaceId: lecture.session.classEntity.workspace.id,
          classId: lecture.session.classEntity.id,
          sessionId: lecture.session.id,
          lectureId: lecture.id,
          actorUserId: event.actorUserId,
          materialIds: event.materialIds,
          publishedAt: event.publishedAt,
        },
        dedupeKey: `lecture-materials-published:${lecture.id}:${classStudent.student.id}:${event.publishedAt}`,
      })),
    );
  }
}
