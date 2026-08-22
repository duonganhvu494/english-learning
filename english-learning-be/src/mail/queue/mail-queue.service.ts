import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

import { MAIL_JOBS, MAIL_QUEUE } from "./mail-queue.constants";

@Injectable()
export class MailQueueService {
  constructor(
    @InjectQueue(MAIL_QUEUE)
    private readonly mailQueue: Queue,
  ) {}

  async enqueueEmailVerificationOtp(input: {
    email: string;
    fullName: string;
    otp: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.mailQueue.add(
      MAIL_JOBS.EMAIL_VERIFICATION_OTP,
      {
        email: input.email,
        fullName: input.fullName,
        otp: input.otp,
        expiresAt: input.expiresAt.toISOString(),
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async enqueuePasswordResetOtp(input: {
    email: string;
    fullName: string;
    otp: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.mailQueue.add(
      MAIL_JOBS.PASSWORD_RESET_OTP,
      {
        email: input.email,
        fullName: input.fullName,
        otp: input.otp,
        expiresAt: input.expiresAt.toISOString(),
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
  }

  async enqueueStudentCredentials(input: {
  email: string;
  fullName: string;
  userName: string;
  temporaryPassword: string;
}): Promise<void> {
  await this.mailQueue.add(
    MAIL_JOBS.STUDENT_CREDENTIALS,
    input,
    {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
  );
}
}
