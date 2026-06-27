//path: apps/api/src/admin/admin.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
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

  private getTotpIssuer() {
    return this.cfg.get<string>("ADMIN_TOTP_ISSUER", "FixAndEarn Admin");
  }

  async getBootstrapStatus() {
    const enabled = this.cfg.get<string>("ADMIN_CREATE_BOOTSTRAP_ENABLED", "false") === "true";
    const totalAdmins = await this.repo.countAdmins();
    const hasAnyAdmin = totalAdmins > 0;
    const hasSuperAdmin = (await this.repo.countSuperAdmins()) > 0;

    return {
      enabled,
      totalAdmins,
      hasAnyAdmin,
      hasSuperAdmin,
      allowBootstrap: enabled && !hasSuperAdmin,
    };
  }

  async bootstrapCreateSuperAdmin(args: {
    email: string;
    fullName: string;
    password: string;
  }): Promise<{ ok: true; totpSecret: string; totpProvisioningUri: string }> {
    const enabled = this.cfg.get<string>("ADMIN_CREATE_BOOTSTRAP_ENABLED", "false") === "true";
    if (!enabled) throw new ForbiddenException("BOOTSTRAP_DISABLED");

    const existingSuperAdmins = await this.repo.countSuperAdmins();
    if (existingSuperAdmins > 0) throw new ForbiddenException("SUPER_ADMIN_ALREADY_EXISTS");

    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) throw new BadRequestException("INVALID_EMAIL");
    if (args.password.length < 10) throw new BadRequestException("PASSWORD_TOO_SHORT");

    const existing = await this.repo.findByEmail(email);
    if (existing) throw new BadRequestException("ADMIN_ALREADY_EXISTS");

    const totpSecret = authenticator.generateSecret();
    const totpProvisioningUri = authenticator.keyuri(email, this.getTotpIssuer(), totpSecret);
    const enc = this.crypto.encryptAes256Gcm(totpSecret);

    const passwordHash = await argon2.hash(args.password);

    const admin = await this.repo.createAdmin({
      email,
      fullName: args.fullName.trim(),
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
      totpSecretEncrypted: enc.ciphertextB64,
      totpSecretIv: enc.ivB64,
    });

    await this.audit.log({
      actorAdminId: admin.id,
      action: "ADMIN_BOOTSTRAP_CREATE",
      description: "Created initial SUPER_ADMIN via bootstrap endpoint",
      metadata: { email },
    });

    return { ok: true, totpSecret, totpProvisioningUri };
  }

  async createAdmin(args: {
    actorAdminId: string;
    email: string;
    fullName: string;
    password: string;
    role: AdminRole;
  }): Promise<{
    ok: true;
    admin: {
      id: string;
      email: string;
      fullName: string;
      role: AdminRole;
      isActive: boolean;
      is2faEnabled: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    totpSecret: string;
    totpProvisioningUri: string;
  }> {
    const email = args.email.trim().toLowerCase();
    if (!email.includes("@")) throw new BadRequestException("INVALID_EMAIL");
    if (args.password.length < 10) throw new BadRequestException("PASSWORD_TOO_SHORT");
    if (!args.fullName.trim()) throw new BadRequestException("FULL_NAME_REQUIRED");

    const existing = await this.repo.findByEmail(email);
    if (existing) throw new BadRequestException("ADMIN_ALREADY_EXISTS");

    const totpSecret = authenticator.generateSecret();
    const totpProvisioningUri = authenticator.keyuri(email, this.getTotpIssuer(), totpSecret);
    const enc = this.crypto.encryptAes256Gcm(totpSecret);
    const passwordHash = await argon2.hash(args.password);

    const admin = await this.repo.createAdmin({
      email,
      fullName: args.fullName.trim(),
      passwordHash,
      role: args.role,
      totpSecretEncrypted: enc.ciphertextB64,
      totpSecretIv: enc.ivB64,
    });

    await this.audit.log({
      actorAdminId: args.actorAdminId,
      action: "ADMIN_CREATE",
      description: `Created admin account with role ${args.role}`,
      metadata: {
        createdAdminId: admin.id,
        createdAdminEmail: admin.email,
        createdAdminRole: admin.role,
      },
    });

    return {
      ok: true,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isActive: admin.isActive,
        is2faEnabled: admin.is2faEnabled,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      totpSecret,
      totpProvisioningUri,
    };
  }

  async listAdmins() {
    return this.repo.listAdmins();
  }

  async getOwn2faStatus(adminId: string) {
    const admin = await this.repo.findById(adminId);
    if (!admin) throw new NotFoundException("ADMIN_NOT_FOUND");

    return {
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isActive: admin.isActive,
        is2faEnabled: admin.is2faEnabled,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      },
      policy: {
        enforced: true,
        backupCodesSupported: false,
      },
    };
  }

  async verifyOwn2fa(args: {
    adminId: string;
    totp: string;
    ip?: string;
    userAgent?: string;
  }) {
    const admin = await this.repo.findById(args.adminId);
    if (!admin) throw new NotFoundException("ADMIN_NOT_FOUND");
    if (!admin.isActive) throw new UnauthorizedException("ADMIN_INACTIVE");
    if (!admin.is2faEnabled) throw new BadRequestException("ADMIN_2FA_DISABLED");

    const code = args.totp.trim();
    const secret = this.crypto.decryptAes256Gcm(admin.totpSecretEncrypted, admin.totpSecretIv);
    const totpOk = authenticator.check(code, secret);

    if (!totpOk) {
      await this.audit.log({
        actorAdminId: admin.id,
        action: "ADMIN_2FA_VERIFY_FAILED",
        description: "Admin 2FA verification test failed",
        ip: args.ip,
        userAgent: args.userAgent,
      });

      throw new UnauthorizedException("INVALID_TOTP");
    }

    await this.audit.log({
      actorAdminId: admin.id,
      action: "ADMIN_2FA_VERIFY_SUCCESS",
      description: "Admin 2FA verification test succeeded",
      ip: args.ip,
      userAgent: args.userAgent,
    });

    return {
      ok: true,
      verified: true,
    };
  }

  async rotateOwn2fa(args: {
    adminId: string;
    reason?: string;
    ip?: string;
    userAgent?: string;
  }): Promise<{
    ok: true;
    totpSecret: string;
    totpProvisioningUri: string;
  }> {
    const admin = await this.repo.findById(args.adminId);
    if (!admin) throw new NotFoundException("ADMIN_NOT_FOUND");
    if (!admin.isActive) throw new UnauthorizedException("ADMIN_INACTIVE");

    const totpSecret = authenticator.generateSecret();
    const totpProvisioningUri = authenticator.keyuri(admin.email, this.getTotpIssuer(), totpSecret);
    const enc = this.crypto.encryptAes256Gcm(totpSecret);

    await this.repo.updateAdmin(admin.id, {
      totpSecretEncrypted: enc.ciphertextB64,
      totpSecretIv: enc.ivB64,
      is2faEnabled: true,
    });
    await this.repo.incrementSessionVersion(admin.id);

    await this.audit.log({
      actorAdminId: admin.id,
      action: "ADMIN_2FA_ROTATE_SELF",
      description: "Admin rotated own TOTP secret",
      ip: args.ip,
      userAgent: args.userAgent,
      metadata: {
        reason: args.reason?.trim() || null,
      },
    });

    return {
      ok: true,
      totpSecret,
      totpProvisioningUri,
    };
  }

  async deactivateAdmin(args: {
    actorAdminId: string;
    targetAdminId: string;
    reason?: string;
  }) {
    if (args.actorAdminId === args.targetAdminId) {
      throw new BadRequestException("CANNOT_DEACTIVATE_SELF");
    }

    const target = await this.repo.findById(args.targetAdminId);
    if (!target) throw new NotFoundException("ADMIN_NOT_FOUND");

    if (!target.isActive) {
      return { ok: true, status: "INACTIVE" as const };
    }

    if (target.role === AdminRole.SUPER_ADMIN) {
      const activeSuperAdmins = await this.repo.countSuperAdmins({ isActive: true });
      if (activeSuperAdmins <= 1) {
        throw new ForbiddenException("CANNOT_DEACTIVATE_LAST_ACTIVE_SUPER_ADMIN");
      }
    }

    await this.repo.updateAdmin(args.targetAdminId, {
      isActive: false,
    });
    await this.repo.incrementSessionVersion(target.id);

    await this.audit.log({
      actorAdminId: args.actorAdminId,
      action: "ADMIN_DEACTIVATE",
      description: "Deactivated admin account",
      metadata: {
        targetAdminId: target.id,
        targetAdminEmail: target.email,
        targetAdminRole: target.role,
        reason: args.reason?.trim() || null,
      },
    });

    return { ok: true, status: "INACTIVE" as const };
  }

  async reactivateAdmin(args: {
    actorAdminId: string;
    targetAdminId: string;
    reason?: string;
  }) {
    const target = await this.repo.findById(args.targetAdminId);
    if (!target) throw new NotFoundException("ADMIN_NOT_FOUND");

    if (target.isActive) {
      return { ok: true, status: "ACTIVE" as const };
    }

    await this.repo.updateAdmin(args.targetAdminId, {
      isActive: true,
    });
    await this.repo.incrementSessionVersion(target.id);

    await this.audit.log({
      actorAdminId: args.actorAdminId,
      action: "ADMIN_REACTIVATE",
      description: "Reactivated admin account",
      metadata: {
        targetAdminId: target.id,
        targetAdminEmail: target.email,
        targetAdminRole: target.role,
        reason: args.reason?.trim() || null,
      },
    });

    return { ok: true, status: "ACTIVE" as const };
  }

  async rotateAdminTotp(args: {
    actorAdminId: string;
    targetAdminId: string;
    reason?: string;
  }): Promise<{
    ok: true;
    targetAdminId: string;
    totpSecret: string;
    totpProvisioningUri: string;
  }> {
    const target = await this.repo.findById(args.targetAdminId);
    if (!target) throw new NotFoundException("ADMIN_NOT_FOUND");

    const totpSecret = authenticator.generateSecret();
    const totpProvisioningUri = authenticator.keyuri(target.email, this.getTotpIssuer(), totpSecret);
    const enc = this.crypto.encryptAes256Gcm(totpSecret);

    await this.repo.updateAdmin(args.targetAdminId, {
      totpSecretEncrypted: enc.ciphertextB64,
      totpSecretIv: enc.ivB64,
      is2faEnabled: true,
    });
    await this.repo.incrementSessionVersion(target.id);

    await this.audit.log({
      actorAdminId: args.actorAdminId,
      action: "ADMIN_ROTATE_TOTP",
      description: "Rotated admin TOTP secret",
      metadata: {
        targetAdminId: target.id,
        targetAdminEmail: target.email,
        targetAdminRole: target.role,
        reason: args.reason?.trim() || null,
      },
    });

    return {
      ok: true,
      targetAdminId: target.id,
      totpSecret,
      totpProvisioningUri,
    };
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
        metadata: { email },
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
        metadata: { email },
      });

      throw new UnauthorizedException("INVALID_CREDENTIALS");
    }

    if (admin.is2faEnabled) {
      const secret = this.crypto.decryptAes256Gcm(admin.totpSecretEncrypted, admin.totpSecretIv);
      const totpOk = authenticator.check(args.totp, secret);

      if (!totpOk) {
        await this.audit.log({
          actorAdminId: admin.id,
          action: "ADMIN_LOGIN_FAILED_TOTP",
          description: "Failed admin login due to invalid TOTP",
          ip: args.ip,
          userAgent: args.userAgent,
          metadata: { email },
        });

        throw new UnauthorizedException("INVALID_TOTP");
      }
    }

  const token = await this.jwt.signAsync({
  sub: admin.id,
  role: admin.role,
  email: admin.email,
  typ: "admin",
  sv: admin.sessionVersion,
});

    await this.audit.log({
      actorAdminId: admin.id,
      action: "ADMIN_LOGIN",
      description: "Admin logged in",
      ip: args.ip,
      userAgent: args.userAgent,
    });

    return {
      accessToken: token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    };
  }
}