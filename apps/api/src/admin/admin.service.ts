//path: apps/api/src/admin/admin.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { JwtPayload } from "jsonwebtoken";
import * as crypto from "crypto";
import { AdminRepo } from "./admin.repo";
import { CryptoService } from "../common/crypto/crypto.service";
import { authenticator } from "otplib";
import * as argon2 from "argon2";
import { AdminRole } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { AdminAuditService } from "./audit/admin-audit.service";
import { AdminRoleHierarchyService } from "./auth/admin-role-hierarchy.service";

authenticator.options = { window: 1 };

@Injectable()
export class AdminService {
  constructor(
    private readonly repo: AdminRepo,
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    private readonly cfg: ConfigService,
    private readonly audit: AdminAuditService,
    private readonly roleHierarchy: AdminRoleHierarchyService
  ) {}

  private getTotpIssuer() {
    return this.cfg.get<string>("ADMIN_TOTP_ISSUER", "FixAndEarn Admin");
  }
  private getRefreshCookieName() {
  return this.cfg.get<string>(
    "ADMIN_REFRESH_COOKIE_NAME",
    "admin_refresh"
  );
}

private getRefreshCookieOptions() {
  return {
    httpOnly: true,
    secure: this.cfg.get("NODE_ENV") === "production",
    sameSite: "strict" as const,
    path: "/admin/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}
  
private hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

private async createAccessToken(admin: {
  id: string;
  email: string;
  role: AdminRole;
  sessionVersion: number;
}) {
  return this.jwt.signAsync({
    sub: admin.id,
    email: admin.email,
    role: admin.role,
    typ: "admin",
    sv: admin.sessionVersion,
  });
}

private async createRefreshToken(admin: {
  id: string;
  sessionVersion: number;
}) {
  return this.jwt.signAsync(
    {
      sub: admin.id,
      typ: "admin-refresh",
      sv: admin.sessionVersion,
    },
    {
      secret: this.cfg.getOrThrow<string>("ADMIN_REFRESH_SECRET"),
      expiresIn: "30d",
    },
  );
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
  async changePassword(args: {
  adminId: string;
  currentPassword: string;
  newPassword: string;
  totp: string;
  ip?: string;
  userAgent?: string;
}) {
  const admin = await this.repo.findById(args.adminId);

  if (!admin) {
    throw new NotFoundException("ADMIN_NOT_FOUND");
  }

  if (!admin.isActive) {
    throw new UnauthorizedException("ADMIN_INACTIVE");
  }

  const passwordOk = await argon2.verify(
    admin.passwordHash,
    args.currentPassword
  );

  if (!passwordOk) {
    throw new UnauthorizedException("INVALID_CURRENT_PASSWORD");
  }

  const samePassword = await argon2.verify(
    admin.passwordHash,
    args.newPassword
  );

  if (samePassword) {
    throw new BadRequestException("PASSWORD_MUST_BE_DIFFERENT");
  }

  const secret = this.crypto.decryptAes256Gcm(
    admin.totpSecretEncrypted,
    admin.totpSecretIv
  );

  const totpOk = authenticator.check(args.totp.trim(), secret);

  if (!totpOk) {
    throw new UnauthorizedException("INVALID_TOTP");
  }

  const passwordHash = await argon2.hash(args.newPassword);

  await this.repo.updateAdmin(admin.id, {
    passwordHash,
    failedLoginAttempts: 0,
    lockedUntil: null,
  });

  await this.repo.incrementSessionVersion(admin.id);

  await this.repo.deleteRefreshTokensForAdmin(admin.id);

  await this.audit.log({
    actorAdminId: admin.id,
    action: "ADMIN_PASSWORD_CHANGED",
    description: "Admin changed account password",
    ip: args.ip,
    userAgent: args.userAgent,
  });

  return {
    ok: true,
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
    const now = new Date();

if (admin.lockedUntil && admin.lockedUntil > now) {
  await this.audit.log({
    actorAdminId: admin.id,
    action: "ADMIN_LOGIN_BLOCKED_LOCKED",
    description: "Blocked login because the admin account is temporarily locked",
    ip: args.ip,
    userAgent: args.userAgent,
  });

  throw new UnauthorizedException("ACCOUNT_TEMPORARILY_LOCKED");
}

    const ok = await argon2.verify(admin.passwordHash, args.password);

if (!ok) {
  const attempts = admin.failedLoginAttempts + 1;

  if (attempts >= 5) {
    const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);

    await this.repo.recordFailedLogin(admin.id, lockedUntil);

    await this.audit.log({
      actorAdminId: admin.id,
      action: "ADMIN_ACCOUNT_LOCKED",
      description: "Admin account temporarily locked after repeated failed logins",
      ip: args.ip,
      userAgent: args.userAgent,
      metadata: {
      attempts,
      lockedUntil: lockedUntil.toISOString(),
},
    });

    throw new UnauthorizedException("ACCOUNT_TEMPORARILY_LOCKED");
  }

  await this.repo.recordFailedLogin(admin.id);

  await this.audit.log({
    actorAdminId: admin.id,
    action: "ADMIN_LOGIN_FAILED_PASSWORD",
    description: "Failed admin login due to invalid password",
    ip: args.ip,
    userAgent: args.userAgent,
    metadata: {
      email,
      attempts,
    },
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
    await this.repo.resetFailedLogins(admin.id);

 const accessToken = await this.createAccessToken(admin);
const refreshToken = await this.createRefreshToken(admin);

const refreshTokenHash = this.hashRefreshToken(refreshToken);

await this.repo.createRefreshToken({
  adminId: admin.id,
  tokenHash: refreshTokenHash,
  expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
});

await this.audit.log({
  actorAdminId: admin.id,
  action: "ADMIN_LOGIN",
  description: "Admin logged in",
  ip: args.ip,
  userAgent: args.userAgent,
});

return {
  accessToken,
  refreshToken,
  admin: {
    id: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
  },
  };

  }
  async refresh(args: {
  refreshToken: string;
  ip?: string;
  userAgent?: string;
}) {
  let payload: JwtPayload & {
    sub: string;
    typ: string;
    sv: number;
  };

  try {
    payload = await this.jwt.verifyAsync(args.refreshToken, {
      secret: this.cfg.getOrThrow<string>("ADMIN_REFRESH_SECRET"),
    });
  } catch {
    throw new UnauthorizedException("INVALID_REFRESH_TOKEN");
  }

  if (payload.typ !== "admin-refresh") {
    throw new UnauthorizedException("INVALID_REFRESH_TOKEN");
  }

  const admin = await this.repo.findById(payload.sub);

  if (!admin || !admin.isActive) {
    throw new UnauthorizedException("INVALID_REFRESH_TOKEN");
  }

  if (admin.sessionVersion !== payload.sv) {
    throw new UnauthorizedException("ADMIN_SESSION_EXPIRED");
  }

  const refreshTokenHash = this.hashRefreshToken(args.refreshToken);

 const storedToken =
  await this.repo.findRefreshTokenByHash(refreshTokenHash);

if (!storedToken) {
  throw new UnauthorizedException("INVALID_REFRESH_TOKEN");
}

if (storedToken.adminId !== admin.id) {
  throw new UnauthorizedException("INVALID_REFRESH_TOKEN");
}

  if (storedToken.expiresAt.getTime() < Date.now()) {
    throw new UnauthorizedException("REFRESH_TOKEN_EXPIRED");
  }
  await this.repo.touchRefreshToken(storedToken.id);
  
  await this.repo.deleteRefreshToken(storedToken.id);

  const accessToken = await this.createAccessToken(admin);

  const refreshToken = await this.createRefreshToken(admin);

  await this.repo.createRefreshToken({
    adminId: admin.id,
    tokenHash: this.hashRefreshToken(refreshToken),
    expiresAt: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ),
  });

  await this.audit.log({
    actorAdminId: admin.id,
    action: "ADMIN_REFRESH_TOKEN",
    description: "Admin refreshed authentication token",
    ip: args.ip,
    userAgent: args.userAgent,
  });

  return {
    accessToken,
    refreshToken,
  };
}
async logout(refreshToken: string) {
  let payload: {
    sub: string;
    typ: string;
  };

  try {
    payload = await this.jwt.verifyAsync(refreshToken, {
      secret: this.cfg.getOrThrow<string>("ADMIN_REFRESH_SECRET"),
    });
  } catch {
    return {
      ok: true,
    };
  }

  if (payload.typ !== "admin-refresh") {
    return {
      ok: true,
    };
  }

  const tokenHash = this.hashRefreshToken(refreshToken);

  const stored =
    await this.repo.findRefreshTokenByHash(tokenHash);

  if (stored) {
    await this.repo.deleteRefreshToken(stored.id);

    await this.audit.log({
      actorAdminId: stored.adminId,
      action: "ADMIN_LOGOUT",
      description: "Admin logged out",
    });
  }

  return {
    ok: true,
  };
}
async logoutAll(adminId: string) {
  await this.repo.deleteRefreshTokensForAdmin(adminId);

  await this.repo.incrementSessionVersion(adminId);

  await this.audit.log({
    actorAdminId: adminId,
    action: "ADMIN_LOGOUT_ALL",
    description: "Admin logged out from all devices",
  });

  return {
    ok: true,
  };
}
}