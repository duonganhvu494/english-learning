import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { RedisService } from "src/common/redis/redis.service";
import { parseDurationToSeconds } from "src/common/utils/duration.util";

export type PendingEmailChange = {
  userId: string;
  email: string;
};

@Injectable()
export class PendingEmailChangeService {
  constructor(
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
  ) {}

  async create(input: { userId: string; email: string }): Promise<void> {
    const ttlSeconds = this.getTtlSeconds();

    const payload: PendingEmailChange = {
      userId: input.userId,
      email: input.email,
    };

    await this.redisService.withClient(async (client) => {
      await client.set(
        this.buildKey(input.userId),
        JSON.stringify(payload),
        "EX",
        ttlSeconds,
      );
    });
  }

  async find(userId: string): Promise<PendingEmailChange | null> {
    const payload = await this.redisService.withClient(async (client) =>
      client.get(this.buildKey(userId)),
    );

    if (!payload) {
      return null;
    }

    try {
      return JSON.parse(payload) as PendingEmailChange;
    } catch {
      await this.remove(userId);
      return null;
    }
  }

  async remove(userId: string): Promise<void> {
    await this.redisService.withClient(async (client) => {
      await client.del(this.buildKey(userId));
    });
  }

  private getTtlSeconds(): number {
    return parseDurationToSeconds(
      this.config.get<string>("AUTH_PENDING_EMAIL_CHANGE_EXPIRES_IN", "15m"),
      15 * 60,
    );
  }

  private buildKey(userId: string): string {
    return `auth:pending-email-change:${userId}`;
  }
}
