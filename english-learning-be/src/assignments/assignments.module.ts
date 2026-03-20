import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { Material } from 'src/materials/entities/material.entity';
import { RbacModule } from 'src/rbac/rbac.module';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { StorageModule } from 'src/storage/storage.module';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import { AssignmentsQuizService } from './assignments-quiz.service';
import { AssignmentEntity } from './entities/assignment.entity';
import { AssignmentMaterial } from './entities/assignment-material.entity';
import { AssignmentQuizAttemptEntity } from './entities/assignment-quiz-attempt.entity';
import { AssignmentQuizAttemptAnswerEntity } from './entities/assignment-quiz-attempt-answer.entity';
import { AssignmentQuizOptionEntity } from './entities/assignment-quiz-option.entity';
import { AssignmentQuizQuestionEntity } from './entities/assignment-quiz-question.entity';
import { AssignmentsController } from './assignments.controller';
import { AssignmentsService } from './assignments.service';

@Module({
  imports: [
    RbacModule,
    StorageModule,
    TypeOrmModule.forFeature([
      AssignmentEntity,
      AssignmentMaterial,
      AssignmentQuizQuestionEntity,
      AssignmentQuizOptionEntity,
      AssignmentQuizAttemptEntity,
      AssignmentQuizAttemptAnswerEntity,
      Material,
      SessionEntity,
      SubmissionEntity,
      User,
      ClassStudent,
    ]),
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService, AssignmentsQuizService],
})
export class AssignmentsModule {}
