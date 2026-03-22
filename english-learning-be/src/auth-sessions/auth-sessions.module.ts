import { Module } from '@nestjs/common';
import { AuthSessionsService } from './auth-sessions.service';
import { RedisModule } from 'src/rbac/redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [AuthSessionsService],
  exports: [AuthSessionsService],
})
export class AuthSessionsModule {}
