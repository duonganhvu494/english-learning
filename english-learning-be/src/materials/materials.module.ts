import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentMaterial } from 'src/assignments/entities/assignment-material.entity';
import { AssignmentQuizQuestionEntity } from 'src/assignments/entities/assignment-quiz-question.entity';
import { LectureMaterial } from 'src/lectures/entities/lecture-material.entity';
import { RbacModule } from 'src/rbac/rbac.module';
import { StorageModule } from 'src/storage/storage.module';
import { SubmissionEntity } from 'src/submissions/entities/submission.entity';
import { User } from 'src/users/entities/user.entity';
import { Material } from './entities/material.entity';
import { MaterialUploadSession } from './entities/material-upload-session.entity';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';

@Module({
  imports: [
    RbacModule,
    StorageModule,
    TypeOrmModule.forFeature([
      Material,
      MaterialUploadSession,
      LectureMaterial,
      AssignmentMaterial,
      AssignmentQuizQuestionEntity,
      SubmissionEntity,
      User,
    ]),
  ],
  controllers: [MaterialsController],
  providers: [MaterialsService],
  exports: [TypeOrmModule, MaterialsService],
})
export class MaterialsModule {}
