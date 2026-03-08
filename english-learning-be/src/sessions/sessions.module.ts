import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacModule } from 'src/rbac/rbac.module';
import { ClassEntity } from 'src/classes/entities/class.entity';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { SessionEntity } from './entities/session.entity';

@Module({
  imports: [
    RbacModule,
    TypeOrmModule.forFeature([SessionEntity, ClassEntity]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
