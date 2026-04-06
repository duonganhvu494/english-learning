import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { AuthRedisModule } from 'src/auth/redis/auth-redis.module';
import { SuperAdminGuard } from 'src/auth/guards/super-admin.guard';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthRedisModule,
    MailModule,
  ],
  providers: [UsersService, SuperAdminGuard],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
