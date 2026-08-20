import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";

import { RedisService } from "src/common/redis/redis.service";
import { parseDurationToSeconds } from "src/common/utils/duration.util";

export type PendingRegistration = {
  registrationId: string;
  fullName: string;
  userName: string;
  email: string;
  hashedPassword: string;
  createdAt: string;
};

@Injectable()
export class PendingRegistrationService {
  constructor(
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
  ) {}

  async create(input: {
    fullName: string;
    userName: string;
    email: string;
    hashedPassword: string;
  }): Promise<PendingRegistration> {
    const registrationId = randomUUID();

    const pendingRegistration: PendingRegistration = {
      registrationId,
      fullName: input.fullName,
      userName: input.userName,
      email: input.email,
      hashedPassword: input.hashedPassword,
      createdAt: new Date().toISOString(),
    };

    const ttlSeconds = this.getTtlSeconds();

    await this.redisService.withClient(async (client) => {
      await client.set(
        this.buildKey(registrationId),
        JSON.stringify(pendingRegistration),
        "EX",
        ttlSeconds,
      );
    });

    return pendingRegistration;
  }

  async find(registrationId: string): Promise<PendingRegistration | null> {
    const payload = await this.redisService.withClient(async (client) => {
      return client.get(this.buildKey(registrationId));
    });

    if (!payload) {
      return null;
    }

    try {
      return JSON.parse(payload) as PendingRegistration;
    } catch {
      await this.remove(registrationId);
      return null;
    }
  }

  async remove(registrationId: string): Promise<void> {
    await this.redisService.withClient(async (client) => {
      await client.del(this.buildKey(registrationId));
    });
  }

  private getTtlSeconds(): number {
    return parseDurationToSeconds(
      this.config.get<string>("AUTH_PENDING_REGISTRATION_EXPIRES_IN", "15m"),
      15 * 60,
    );
  }

  private buildKey(registrationId: string): string {
    return `auth:pending-registration:${registrationId}`;
  }
}
