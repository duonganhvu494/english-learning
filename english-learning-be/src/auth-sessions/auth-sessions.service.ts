import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseDurationToSeconds } from 'src/common/utils/duration.util';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class AuthSessionsService {
  constructor(
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
  ) {}

  async storeRefreshSession(userId: string, jti: string): Promise<void> {
    const refreshTtlSeconds = this.getRefreshTtlSeconds();
    const sessionKey = this.buildRefreshSessionKey(userId, jti);
    const userIndexKey = this.buildUserSessionIndexKey(userId);

    await this.redisService.withClient(async (client) => {
      await client
        .multi()
        .set(sessionKey, '1', 'EX', refreshTtlSeconds)
        .sadd(userIndexKey, jti)
        .expire(userIndexKey, refreshTtlSeconds)
        .exec();
    });
  }

  async hasRefreshSession(userId: string, jti: string): Promise<boolean> {
    const sessionKey = this.buildRefreshSessionKey(userId, jti);

    return this.redisService.withClient(async (client) => {
      const exists = await client.exists(sessionKey);
      return exists === 1;
    });
  }

  async replaceRefreshSession(
    userId: string,
    previousJti: string,
    nextJti: string,
  ): Promise<void> {
    const refreshTtlSeconds = this.getRefreshTtlSeconds();
    const previousSessionKey = this.buildRefreshSessionKey(userId, previousJti);
    const nextSessionKey = this.buildRefreshSessionKey(userId, nextJti);
    const userIndexKey = this.buildUserSessionIndexKey(userId);

    await this.redisService.withClient(async (client) => {
      await client
        .multi()
        .del(previousSessionKey)
        .srem(userIndexKey, previousJti)
        .set(nextSessionKey, '1', 'EX', refreshTtlSeconds)
        .sadd(userIndexKey, nextJti)
        .expire(userIndexKey, refreshTtlSeconds)
        .exec();
    });
  }

  async revokeRefreshSession(userId: string, jti: string): Promise<void> {
    const sessionKey = this.buildRefreshSessionKey(userId, jti);
    const userIndexKey = this.buildUserSessionIndexKey(userId);

    await this.redisService.withClient(async (client) => {
      await client.multi().del(sessionKey).srem(userIndexKey, jti).exec();
    });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const userIndexKey = this.buildUserSessionIndexKey(userId);

    await this.redisService.withClient(async (client) => {
      const jtis = await client.smembers(userIndexKey);
      const multi = client.multi();

      if (jtis.length > 0) {
        for (const jti of jtis) {
          multi.del(this.buildRefreshSessionKey(userId, jti));
        }
      }

      multi.del(userIndexKey);
      await multi.exec();
    });
  }

  async denyAccessToken(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }

    await this.redisService.withClient(async (client) => {
      await client.set(this.buildAccessDenylistKey(jti), '1', 'EX', ttlSeconds);
    });
  }

  async isAccessTokenDenied(jti: string): Promise<boolean> {
    return this.redisService.withClient(async (client) => {
      const exists = await client.exists(this.buildAccessDenylistKey(jti));
      return exists === 1;
    });
  }

  async isLoginRateLimited(userName: string, ip: string): Promise<boolean> {
    const attempts = await this.getLoginAttemptCount(userName, ip);
    return attempts >= this.getLoginRateLimitMaxAttempts();
  }

  async recordFailedLoginAttempt(userName: string, ip: string): Promise<void> {
    const attemptsKey = this.buildLoginAttemptsKey(userName, ip);
    const windowSeconds = this.getLoginRateLimitWindowSeconds();

    await this.redisService.withClient(async (client) => {
      const attempts = await client.incr(attemptsKey);
      if (attempts === 1) {
        await client.expire(attemptsKey, windowSeconds);
      }
    });
  }

  async clearLoginAttempts(userName: string, ip: string): Promise<void> {
    await this.redisService.withClient(async (client) => {
      await client.del(this.buildLoginAttemptsKey(userName, ip));
    });
  }

  private getRefreshTtlSeconds(): number {
    return parseDurationToSeconds(
      this.config.get<string>('jwt.refreshExpiresIn', '7d'),
      7 * 24 * 60 * 60,
    );
  }

  private getLoginRateLimitWindowSeconds(): number {
    return parseDurationToSeconds(
      this.config.get<string>('AUTH_LOGIN_RATE_LIMIT_WINDOW', '15m'),
      15 * 60,
    );
  }

  private getLoginRateLimitMaxAttempts(): number {
    const rawValue = this.config.get<string>('AUTH_LOGIN_RATE_LIMIT_MAX_ATTEMPTS');
    const parsedValue = Number.parseInt(rawValue || '5', 10);

    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 5;
  }

  private buildRefreshSessionKey(userId: string, jti: string): string {
    return `refresh:user:${userId}:${jti}`;
  }

  private buildUserSessionIndexKey(userId: string): string {
    return `refresh:user-sessions:${userId}`;
  }

  private buildAccessDenylistKey(jti: string): string {
    return `denylist:access:${jti}`;
  }

  private buildLoginAttemptsKey(userName: string, ip: string): string {
    return `auth:login-attempts:${this.normalizeKeyPart(ip)}:${this.normalizeKeyPart(
      userName,
    )}`;
  }

  private async getLoginAttemptCount(
    userName: string,
    ip: string,
  ): Promise<number> {
    const attemptsKey = this.buildLoginAttemptsKey(userName, ip);

    return this.redisService.withClient(async (client) => {
      const rawAttempts = await client.get(attemptsKey);
      const attempts = Number.parseInt(rawAttempts || '0', 10);
      return Number.isFinite(attempts) ? attempts : 0;
    });
  }

  private normalizeKeyPart(value: string): string {
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : 'unknown';
  }
}
