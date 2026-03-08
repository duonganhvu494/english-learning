import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassStudent } from 'src/classes/entities/class-student.entity';
import { RbacModule } from 'src/rbac/rbac.module';
import { SessionEntity } from 'src/sessions/entities/session.entity';
import { AttendancesController } from './attendances.controller';
import { AttendancesService } from './attendances.service';
import { AttendanceEntity } from './entities/attendance.entity';

@Module({
  imports: [
    RbacModule,
    TypeOrmModule.forFeature([AttendanceEntity, SessionEntity, ClassStudent]),
  ],
  controllers: [AttendancesController],
  providers: [AttendancesService],
})
export class AttendancesModule {}
