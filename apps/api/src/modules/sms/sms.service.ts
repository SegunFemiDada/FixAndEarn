import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendVerificationCode(phone: string, code: string): Promise<void> {
    // In production, integrate with Termii, Twilio, etc.
    this.logger.log(`📱 SMS to ${phone}: Your FixAndEarn verification code is ${code}`);
    // For development, we just log; in production, actually send.
  }
}