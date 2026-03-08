import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthSessionsModule } from 'src/auth-sessions/auth-sessions.module';
import { SuperAdminGuard } from 'src/auth/guards/super-admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User]), AuthSessionsModule],
  providers: [UsersService, SuperAdminGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
