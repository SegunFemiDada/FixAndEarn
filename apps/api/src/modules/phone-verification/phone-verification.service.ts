import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import * as argon2 from "argon2";
import { randomInt } from "crypto";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { SmsService } from "../sms/sms.service";

@Injectable()
export class PhoneVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sms: SmsService,
  ) {}

  async sendCode(userId: string, phone: string) {
    const normalized = phone.trim();

    if (!normalized) {
      throw new BadRequestException("PHONE_REQUIRED");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        phoneVerifiedAt: true,
        phone: true,
      },
    });

    if (!user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    if (user.phoneVerifiedAt) {
      throw new BadRequestException("PHONE_ALREADY_VERIFIED");
    }

    const existing = await this.prisma.user.findFirst({
      where: {
        phone: normalized,
        id: { not: userId },
      },
    });

    if (existing) {
      throw new BadRequestException("PHONE_ALREADY_USED");
    }

    const code = randomInt(100000, 1000000).toString();
    const codeHash = await argon2.hash(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: normalized,
        phoneVerifyCode: codeHash,
        phoneVerifyCodeExpiresAt: expiresAt,
      },
    });

    await this.sms.sendVerificationCode(normalized, code);

    return { ok: true };
  }

  async verifyCode(userId: string, code: string) {
    const normalizedCode = String(code ?? "").trim();

    if (!/^\d{6}$/.test(normalizedCode)) {
      throw new BadRequestException("INVALID_CODE");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        phoneVerifyCode: true,
        phoneVerifyCodeExpiresAt: true,
        phoneVerifiedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("USER_NOT_FOUND");
    }

    if (user.phoneVerifiedAt) {
      throw new BadRequestException("ALREADY_VERIFIED");
    }

    if (!user.phoneVerifyCode || !user.phoneVerifyCodeExpiresAt) {
      throw new BadRequestException("NO_CODE_SENT");
    }

    if (new Date() > user.phoneVerifyCodeExpiresAt) {
      throw new BadRequestException("CODE_EXPIRED");
    }

    const isValid = await argon2.verify(
      user.phoneVerifyCode,
      normalizedCode,
    );

    if (!isValid) {
      throw new BadRequestException("INVALID_CODE");
    }

    const now = new Date();

    const consumed = await this.prisma.user.updateMany({
      where: {
        id: userId,
        phoneVerifiedAt: null,
        phoneVerifyCode: user.phoneVerifyCode,
        phoneVerifyCodeExpiresAt: {
          gt: now,
        },
      },
      data: {
        phoneVerifiedAt: now,
        phoneVerifyCode: null,
        phoneVerifyCodeExpiresAt: null,
      },
    });

    if (consumed.count !== 1) {
      throw new BadRequestException("INVALID_OR_EXPIRED_CODE");
    }

    return { ok: true };
  }
}