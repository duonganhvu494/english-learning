import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentQuizAttemptEntity } from 'src/assignments/entities/assignment-quiz-attempt.entity';
import { AttendanceEntity } from 'src/attendances/entities/attendance.entity';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { AssignmentEntity } from 'src/assignments/entities/assignment.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { LectureEntity } from 'src/lectures/entities/lecture.entity';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import { UsersModule } from 'src/users/users.module';
import { AuthSessionsModule } from 'src/auth-sessions/auth-sessions.module';
import { NotificationEntity } from './entities/notification.entity';
import { AssignmentDeadlineNotificationsJob } from './jobs/assignment-deadline-notifications.job';
import { AssignmentMaterialsNotificationsListener } from './listeners/assignment-materials-notifications.listener';
import { AttendanceNotificationsListener } from './listeners/attendance-notifications.listener';
import { AssignmentNotificationsListener } from './listeners/assignment-notifications.listener';
import { ClassStudentNotificationsListener } from './listeners/class-student-notifications.listener';
import { LectureMaterialsNotificationsListener } from './listeners/lecture-materials-notifications.listener';
import { LectureNotificationsListener } from './listeners/lecture-notifications.listener';
import { SessionCancelledNotificationsListener } from './listeners/session-cancelled-notifications.listener';
import { SessionNotificationsListener } from './listeners/session-notifications.listener';
import { SessionUpdatedNotificationsListener } from './listeners/session-updated-notifications.listener';
import { SubmissionCreatedNotificationsListener } from './listeners/submission-created-notifications.listener';
import { SubmissionNotificationsListener } from './listeners/submission-notifications.listener';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './realtime/notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    AuthSessionsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
      }),
    }),
    TypeOrmModule.forFeature([
      NotificationEntity,
      User,
      AssignmentEntity,
      AssignmentQuizAttemptEntity,
      AttendanceEntity,
      ClassEntity,
      ClassStudent,
      LectureEntity,
      SessionEntity,
      SubmissionEntity,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    AssignmentDeadlineNotificationsJob,
    AssignmentMaterialsNotificationsListener,
    AttendanceNotificationsListener,
    NotificationsGateway,
    NotificationsService,
    AssignmentNotificationsListener,
    ClassStudentNotificationsListener,
    LectureMaterialsNotificationsListener,
    LectureNotificationsListener,
    SessionCancelledNotificationsListener,
    SessionNotificationsListener,
    SessionUpdatedNotificationsListener,
    SubmissionCreatedNotificationsListener,
    SubmissionNotificationsListener,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
