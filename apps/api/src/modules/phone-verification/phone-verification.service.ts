import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { SmsService } from "../sms/sms.service";

@Injectable()
export class PhoneVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  async sendCode(userId: string, phone: string) {
    // Normalize phone number
    const normalized = phone.trim();
    if (!normalized) throw new BadRequestException("PHONE_REQUIRED");

    // Check if already verified
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerifiedAt: true, phone: true },
    });
    if (!user) throw new NotFoundException("USER_NOT_FOUND");
    if (user.phoneVerifiedAt) throw new BadRequestException("PHONE_ALREADY_VERIFIED");

    // Check if phone is already used by another user
    const existing = await this.prisma.user.findFirst({
      where: { phone: normalized, id: { not: userId } },
    });
    if (existing) throw new BadRequestException("PHONE_ALREADY_USED");

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: normalized,
        phoneVerifyCode: code,
        phoneVerifyCodeExpiresAt: expiresAt,
      },
    });

    await this.sms.sendVerificationCode(normalized, code);
    return { ok: true };
  }

  async verifyCode(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerifyCode: true, phoneVerifyCodeExpiresAt: true, phoneVerifiedAt: true },
    });
    if (!user) throw new NotFoundException("USER_NOT_FOUND");
    if (user.phoneVerifiedAt) throw new BadRequestException("ALREADY_VERIFIED");

    if (!user.phoneVerifyCode || !user.phoneVerifyCodeExpiresAt) {
      throw new BadRequestException("NO_CODE_SENT");
    }
    if (user.phoneVerifyCode !== code) throw new BadRequestException("INVALID_CODE");
    if (new Date() > user.phoneVerifyCodeExpiresAt) throw new BadRequestException("CODE_EXPIRED");

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerifiedAt: new Date(),
        phoneVerifyCode: null,
        phoneVerifyCodeExpiresAt: null,
      },
    });

    return { ok: true };
  }
}