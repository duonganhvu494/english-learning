import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import nodemailer, { type Transporter } from "nodemailer";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("mail.host", "").trim();

    const port = Number(this.config.get<string | number>("mail.port", 0));

    const secureValue = this.config.get<string | boolean>("mail.secure", false);

    const secure = secureValue === true || secureValue === "true";

    const user = this.config.get<string>("mail.user", "").trim();
    const pass = this.config.get<string>("mail.password", "");

    this.fromAddress = this.config.get<string>(
      "mail.from",
      "no-reply@example.local",
    );

    console.log("[MAIL CONFIG]", {
      host,
      port,
      secure,
      user,
      from: this.fromAddress,
      hasPassword: Boolean(pass),
    });

    if (!host || !Number.isFinite(port) || port <= 0) {
      this.logger.warn("Mail transport configuration is invalid");
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth:
        user && pass
          ? {
              user,
              pass,
            }
          : undefined,
    });
  }

  async sendEmailVerificationOtp(input: {
    email: string;
    fullName: string;
    otp: string;
    expiresAt: Date;
  }): Promise<void> {
    const subject = "Verify your email address";
    const expiresAtText = input.expiresAt.toISOString();
    const text = [
      `Hello ${input.fullName},`,
      "",
      "Use the OTP below to verify your email address:",
      input.otp,
      "",
      `This OTP expires at ${expiresAtText}.`,
    ].join("\n");

    console.log("text", text);

    await this.sendMail({
      to: input.email,
      subject,
      text,
    });
  }

  async sendPasswordResetOtp(input: {
    email: string;
    fullName: string;
    otp: string;
    expiresAt: Date;
  }): Promise<void> {
    const subject = "Reset your password";
    const expiresAtText = input.expiresAt.toISOString();
    const text = [
      `Hello ${input.fullName},`,
      "",
      "Use the OTP below to reset your password:",
      input.otp,
      "",
      `This OTP expires at ${expiresAtText}.`,
    ].join("\n");

    await this.sendMail({
      to: input.email,
      subject,
      text,
    });
  }

  async sendStudentProvisionedCredentials(input: {
    email: string;
    fullName: string;
    userName: string;
    temporaryPassword: string;
  }): Promise<void> {
    const subject = "Your student account has been created";
    const text = [
      `Hello ${input.fullName},`,
      "",
      "A student account has been created for you.",
      `Username: ${input.userName}`,
      `Temporary password: ${input.temporaryPassword}`,
      "",
      "Please sign in and change your password as soon as possible.",
    ].join("\n");

    await this.sendMail({
      to: input.email,
      subject,
      text,
    });
  }

  private async sendMail(input: {
    to: string;
    subject: string;
    text: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(
        `Mail transport is not configured. Email to ${input.to} was not delivered. Subject: ${input.subject}. Content: ${input.text}`,
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: input.to,
        subject: input.subject,
        text: input.text,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${input.to}: ${message}`);
    }
  }
}
