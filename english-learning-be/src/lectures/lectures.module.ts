import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from 'src/materials/entities/material.entity';
import { RbacModule } from 'src/rbac/rbac.module';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { StorageModule } from 'src/storage/storage.module';
import { User } from 'src/users/entities/user.entity';
import { LectureEntity } from './entities/lecture.entity';
import { LectureMaterial } from './entities/lecture-material.entity';
import { LecturesController } from './lectures.controller';
import { LecturesService } from './lectures.service';

@Module({
  imports: [
    RbacModule,
    StorageModule,
    TypeOrmModule.forFeature([
      LectureEntity,
      LectureMaterial,
      Material,
      SessionEntity,
      User,
    ]),
  ],
  controllers: [LecturesController],
  providers: [LecturesService],
})
export class LecturesModule {}
