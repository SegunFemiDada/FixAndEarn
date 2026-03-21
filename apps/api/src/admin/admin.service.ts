import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AdminRepo } from "./admin.repo";
import { CryptoService } from "../common/crypto/crypto.service";
import { authenticator } from "otplib";
import * as argon2 from "argon2";
import { AdminRole } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { AdminAuditService } from "./audit/admin-audit.service";

authenticator.options = { window: 1 };

@Injectable()
export class AdminService {
  constructor(
    private readonly repo: AdminRepo,
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    private readonly cfg: ConfigService,
    private readonly audit: AdminAuditService
  ) {}

  async bootstrapCreateSuperAdmin(args: {
    email: string;
    fullName: string;
    password: string;
  }): Promise<{ ok: true; totpSecret: string }> {
    const enabled = this.cfg.get<string>("ADMIN_CREATE_BOOTSTRAP_ENABLED", "false") === "true";
    if (!enabled) throw new ForbiddenException("BOOTSTRAP_DISABLED");

    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) throw new BadRequestException("INVALID_EMAIL");
    if (args.password.length < 10) throw new BadRequestException("PASSWORD_TOO_SHORT");

    const existing = await this.repo.findByEmail(email);
    if (existing) throw new BadRequestException("ADMIN_ALREADY_EXISTS");

    const totpSecret = authenticator.generateSecret();
    const enc = this.crypto.encryptAes256Gcm(totpSecret);

    const passwordHash = await argon2.hash(args.password);

    const admin = await this.repo.createAdmin({
      email,
      fullName: args.fullName.trim(),
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      totpSecretEncrypted: enc.ciphertextB64,
      totpSecretIv: enc.ivB64
    });

    await this.audit.log({
      actorAdminId: admin.id,
      action: "ADMIN_BOOTSTRAP_CREATE",
      description: "Created initial SUPER_ADMIN via bootstrap endpoint",
      metadata: { email }
    });

    return { ok: true, totpSecret };
  }

  async login(args: {
    email: string;
    password: string;
    totp: string;
    ip?: string;
    userAgent?: string;
  }) {
    const email = args.email.trim().toLowerCase();
    const admin = await this.repo.findByEmail(email);

    if (!admin) {
      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    if (!admin.isActive) {
      await this.audit.log({
        actorAdminId: admin.id,
        action: "ADMIN_LOGIN_BLOCKED_INACTIVE",
        description: "Blocked admin login attempt for inactive admin account",
        ip: args.ip,
        userAgent: args.userAgent,
        metadata: { email }
      });

      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    const ok = await argon2.verify(admin.passwordHash, args.password);
    if (!ok) {
      await this.audit.log({
        actorAdminId: admin.id,
        action: "ADMIN_LOGIN_FAILED_PASSWORD",
        description: "Failed admin login due to invalid password",
        ip: args.ip,
        userAgent: args.userAgent,
        metadata: { email }
      });

      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    if (admin.is2faEnabled) {
      const secret = this.crypto.decryptAes256Gcm(
        admin.totpSecretEncrypted,
        admin.totpSecretIv
      );
      const totpOk = authenticator.check(args.totp, secret);

      if (!totpOk) {
        await this.audit.log({
          actorAdminId: admin.id,
          action: "ADMIN_LOGIN_FAILED_TOTP",
          description: "Failed admin login due to invalid TOTP",
          ip: args.ip,
          userAgent: args.userAgent,
          metadata: { email }
        });

        throw new UnauthorizedException("INVALID_TOTP");
      }
    }

    const token = await this.jwt.signAsync({
      sub: admin.id,
      role: admin.role,
      email: admin.email,
      typ: "admin"
    });

    await this.audit.log({
      actorAdminId: admin.id,
      action: "ADMIN_LOGIN",
      description: "Admin logged in",
      ip: args.ip,
      userAgent: args.userAgent
    });

    return {
      accessToken: token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role
      }
    };
  }
}