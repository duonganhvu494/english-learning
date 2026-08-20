import { Logger } from "@nestjs/common";
import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";

import { MailService } from "../mail.service";
import { MAIL_JOBS, MAIL_QUEUE } from "./mail-queue.constants";

@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case MAIL_JOBS.EMAIL_VERIFICATION_OTP:
        await this.mailService.sendEmailVerificationOtp({
          email: job.data.email,
          fullName: job.data.fullName,
          otp: job.data.otp,
          expiresAt: new Date(job.data.expiresAt),
        });

        return;

      case MAIL_JOBS.PASSWORD_RESET_OTP:
        await this.mailService.sendPasswordResetOtp({
          email: job.data.email,
          fullName: job.data.fullName,
          otp: job.data.otp,
          expiresAt: new Date(job.data.expiresAt),
        });

        return;

      case MAIL_JOBS.STUDENT_CREDENTIALS:
        await this.mailService.sendStudentProvisionedCredentials({
          email: job.data.email,
          fullName: job.data.fullName,
          userName: job.data.userName,
          temporaryPassword: job.data.temporaryPassword,
        });

        return;

      default:
        throw new Error(`Unknown mail job: ${job.name}`);
    }
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job) {
    this.logger.log(`Mail job ${job.id} completed`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job | undefined, error: Error) {
    this.logger.error(
      `Mail job ${job?.id ?? "unknown"} failed: ${error.message}`,
    );
  }
}
