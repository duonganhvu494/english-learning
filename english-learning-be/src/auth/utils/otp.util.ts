import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';

export function generateOtpCode(): string {
  return randomInt(100000, 1000000).toString();
}

export function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export function verifyOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}
