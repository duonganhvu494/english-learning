import { Module } from '@nestjs/common';
import { RedisModule } from 'src/rbac/redis/redis.module';
import { AuthOtpService } from './auth-otp.service';
import { AuthSessionsService } from './auth-sessions.service';

@Module({
  imports: [RedisModule],
  providers: [AuthSessionsService, AuthOtpService],
  exports: [AuthSessionsService, AuthOtpService],
})
export class AuthRedisModule {}
