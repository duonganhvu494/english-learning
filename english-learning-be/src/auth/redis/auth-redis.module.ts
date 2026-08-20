import { Module } from '@nestjs/common';

import { AuthOtpService } from './auth-otp.service';
import { AuthSessionsService } from './auth-sessions.service';
import { PendingRegistrationService } from './pending-registration.service';
import { RedisModule } from 'src/common/redis/redis.module';
import { PendingEmailChangeService } from './pending-email-change.service';

@Module({
  imports: [RedisModule],
  providers: [
    AuthOtpService,
    AuthSessionsService,
    PendingRegistrationService,
    PendingEmailChangeService
  ],
  exports: [
    AuthOtpService,
    AuthSessionsService,
    PendingRegistrationService,
    PendingEmailChangeService
  ],
})
export class AuthRedisModule {}