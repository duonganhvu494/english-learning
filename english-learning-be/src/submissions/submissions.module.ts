import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentEntity } from 'src/assignments/entities/assignment.entity';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { Material } from 'src/materials/entities/material.entity';
import { MaterialUploadSession } from 'src/materials/entities/material-upload-session.entity';
import { RbacModule } from 'src/rbac/rbac.module';
import { StorageModule } from 'src/storage/storage.module';
import { SubmissionEntity } from './entities/submission.entity';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

@Module({
  imports: [
    RbacModule,
    StorageModule,
    TypeOrmModule.forFeature([
      SubmissionEntity,
      AssignmentEntity,
      ClassStudent,
      Material,
      MaterialUploadSession,
    ]),
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
