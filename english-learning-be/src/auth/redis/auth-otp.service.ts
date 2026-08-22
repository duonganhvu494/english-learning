import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { parseDurationToSeconds } from "src/common/utils/duration.util";
import { RedisService } from "src/common/redis/redis.service";
import { generateOtpCode, hashOtp, verifyOtp } from "src/auth/utils/otp.util";

type OtpChallengeRecord = {
  expiresAt: string;
  hash: string;
};

type OtpVerificationStatus = "valid" | "invalid" | "expired";

@Injectable()
export class AuthOtpService {
  constructor(
    private readonly redisService: RedisService,
    private readonly config: ConfigService,
  ) {}

  issueEmailVerificationOtp(subjectId: string): Promise<{
    code: string;
    expiresAt: Date;
  }> {
    return this.issueOtpChallenge(
      this.buildEmailVerificationKey(subjectId),
      "AUTH_EMAIL_VERIFICATION_OTP_EXPIRES_IN",
      10 * 60,
    );
  }

  verifyEmailVerificationOtp(
    subjectId: string,
    otp: string,
  ): Promise<OtpVerificationStatus> {
    return this.verifyOtpChallenge(
      this.buildEmailVerificationKey(subjectId),
      otp,
    );
  }

  clearEmailVerificationOtp(subjectId: string): Promise<void> {
    return this.clearOtpChallenge(this.buildEmailVerificationKey(subjectId));
  }

  issuePasswordResetOtp(userId: string): Promise<{
    code: string;
    expiresAt: Date;
  }> {
    return this.issueOtpChallenge(
      this.buildPasswordResetKey(userId),
      "AUTH_PASSWORD_RESET_OTP_EXPIRES_IN",
      10 * 60,
    );
  }

  verifyPasswordResetOtp(
    userId: string,
    otp: string,
  ): Promise<OtpVerificationStatus> {
    return this.verifyOtpChallenge(this.buildPasswordResetKey(userId), otp);
  }

  clearPasswordResetOtp(userId: string): Promise<void> {
    return this.clearOtpChallenge(this.buildPasswordResetKey(userId));
  }

  private async issueOtpChallenge(
    redisKey: string,
    ttlConfigKey: string,
    fallbackTtlSeconds: number,
  ): Promise<{
    code: string;
    expiresAt: Date;
  }> {
    const ttlSeconds = parseDurationToSeconds(
      this.config.get<string>(ttlConfigKey),
      fallbackTtlSeconds,
    );

    const code = generateOtpCode();
    const hash = await hashOtp(code);

    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const payload: OtpChallengeRecord = {
      expiresAt: expiresAt.toISOString(),
      hash,
    };

    await this.redisService.withClient(async (client) => {
      await client.set(
        redisKey,
        JSON.stringify(payload),
        "EX",
        ttlSeconds + 3600,
      );
    });

    return {
      code,
      expiresAt,
    };
  }

  private async verifyOtpChallenge(
    redisKey: string,
    otp: string,
  ): Promise<OtpVerificationStatus> {
    const normalizedOtp = otp.trim();

    const payload = await this.redisService.withClient(async (client) => {
      return client.get(redisKey);
    });

    if (!payload) {
      return "invalid";
    }

    let challenge: OtpChallengeRecord;

    try {
      challenge = JSON.parse(payload) as OtpChallengeRecord;
    } catch {
      await this.clearOtpChallenge(redisKey);

      return "invalid";
    }

    const expiresAtMs = new Date(challenge.expiresAt).getTime();

    if (!Number.isFinite(expiresAtMs) || expiresAtMs < Date.now()) {
      await this.clearOtpChallenge(redisKey);

      return "expired";
    }

    const isValid = await verifyOtp(normalizedOtp, challenge.hash);

    if (!isValid) {
      return "invalid";
    }

    await this.clearOtpChallenge(redisKey);

    return "valid";
  }

  private async clearOtpChallenge(redisKey: string): Promise<void> {
    await this.redisService.withClient(async (client) => {
      await client.del(redisKey);
    });
  }

  private buildEmailVerificationKey(subjectId: string): string {
    return `auth:otp:email-verification:${subjectId}`;
  }

  private buildPasswordResetKey(userId: string): string {
    return `auth:otp:password-reset:${userId}`;
  }
}
