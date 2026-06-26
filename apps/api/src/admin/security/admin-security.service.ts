//path: apps/api/src/admin/security/admin-security.service.ts
import { Injectable } from "@nestjs/common";
import { AdminSecurityRepo } from "./admin-security.repo";

const SECURITY_ACTIONS = [
  "ADMIN_LOGIN",
  "ADMIN_LOGIN_FAILED_PASSWORD",
  "ADMIN_LOGIN_FAILED_TOTP",
  "ADMIN_LOGIN_BLOCKED_INACTIVE",
  "USER_SUSPEND",
  "USER_UNSUSPEND",
  "USER_FORCE_REVERIFY",
  "WITHDRAWAL_APPROVE",
  "WITHDRAWAL_REJECT",
  "WITHDRAWAL_MARK_PAID",
] as const;

@Injectable()
export class AdminSecurityService {
  constructor(private readonly repo: AdminSecurityRepo) {}

  async getOverview(args?: { take?: number }) {
    const take = Math.max(10, Math.min(args?.take ?? 50, 200));
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [admins, recentSecurityLogs, recentAuthLogs] = await Promise.all([
      this.repo.listAdmins(),
      this.repo.listRecentAuditLogs({
        actions: [...SECURITY_ACTIONS],
        take,
      }),
      this.repo.listRecentAuditLogsSince({
        actions: [
          "ADMIN_LOGIN",
          "ADMIN_LOGIN_FAILED_PASSWORD",
          "ADMIN_LOGIN_FAILED_TOTP",
          "ADMIN_LOGIN_BLOCKED_INACTIVE",
        ],
        since,
      }),
    ]);

    const authByAdminId = new Map<
      string,
      {
        successfulLogins: number;
        failedPasswordAttempts: number;
        failedTotpAttempts: number;
        blockedInactiveAttempts: number;
        lastSuccessfulLoginAt: string | null;
        lastFailedLoginAt: string | null;
      }
    >();

    for (const admin of admins) {
      authByAdminId.set(admin.id, {
        successfulLogins: 0,
        failedPasswordAttempts: 0,
        failedTotpAttempts: 0,
        blockedInactiveAttempts: 0,
        lastSuccessfulLoginAt: null,
        lastFailedLoginAt: null,
      });
    }

    for (const log of recentAuthLogs) {
      const current = authByAdminId.get(log.actorAdminId);
      if (!current) continue;

      if (log.action === "ADMIN_LOGIN") {
        current.successfulLogins += 1;
        if (!current.lastSuccessfulLoginAt) {
          current.lastSuccessfulLoginAt = log.createdAt.toISOString();
        }
      }

      if (log.action === "ADMIN_LOGIN_FAILED_PASSWORD") {
        current.failedPasswordAttempts += 1;
        if (!current.lastFailedLoginAt) {
          current.lastFailedLoginAt = log.createdAt.toISOString();
        }
      }

      if (log.action === "ADMIN_LOGIN_FAILED_TOTP") {
        current.failedTotpAttempts += 1;
        if (!current.lastFailedLoginAt) {
          current.lastFailedLoginAt = log.createdAt.toISOString();
        }
      }

      if (log.action === "ADMIN_LOGIN_BLOCKED_INACTIVE") {
        current.blockedInactiveAttempts += 1;
        if (!current.lastFailedLoginAt) {
          current.lastFailedLoginAt = log.createdAt.toISOString();
        }
      }
    }

    const adminAuthSummary = admins.map((admin) => {
      const stats = authByAdminId.get(admin.id)!;
      const totalFailedAttempts =
        stats.failedPasswordAttempts + stats.failedTotpAttempts + stats.blockedInactiveAttempts;

      return {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        isActive: admin.isActive,
        is2faEnabled: admin.is2faEnabled,
        createdAt: admin.createdAt.toISOString(),
        updatedAt: admin.updatedAt.toISOString(),
        successfulLogins: stats.successfulLogins,
        failedPasswordAttempts: stats.failedPasswordAttempts,
        failedTotpAttempts: stats.failedTotpAttempts,
        blockedInactiveAttempts: stats.blockedInactiveAttempts,
        totalFailedAttempts,
        lastSuccessfulLoginAt: stats.lastSuccessfulLoginAt,
        lastFailedLoginAt: stats.lastFailedLoginAt,
        riskLevel:
          totalFailedAttempts >= 5
            ? "HIGH"
            : totalFailedAttempts >= 3
              ? "MEDIUM"
              : totalFailedAttempts >= 1
                ? "LOW"
                : "NONE",
      };
    });

    const flaggedAdmins = adminAuthSummary.filter(
      (admin) =>
        admin.totalFailedAttempts >= 3 ||
        !admin.is2faEnabled ||
        !admin.isActive
    );

    const counts = {
      totalAdmins: admins.length,
      activeAdmins: admins.filter((admin) => admin.isActive).length,
      inactiveAdmins: admins.filter((admin) => !admin.isActive).length,
      adminsWith2faEnabled: admins.filter((admin) => admin.is2faEnabled).length,
      adminsWithout2faEnabled: admins.filter((admin) => !admin.is2faEnabled).length,
      flaggedAdmins: flaggedAdmins.length,
      recentSuccessfulLogins: recentAuthLogs.filter((log) => log.action === "ADMIN_LOGIN").length,
      recentFailedLogins: recentAuthLogs.filter((log) =>
        ["ADMIN_LOGIN_FAILED_PASSWORD", "ADMIN_LOGIN_FAILED_TOTP", "ADMIN_LOGIN_BLOCKED_INACTIVE"].includes(log.action)
      ).length,
    };

    return {
      counts,
      adminAuthSummary,
      flaggedAdmins,
      recentSecurityLogs: recentSecurityLogs.map((log) => ({
        id: log.id,
        actorAdminId: log.actorAdminId,
        action: log.action,
        description: log.description,
        ip: log.ip,
        userAgent: log.userAgent,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
        actor: log.actor
          ? {
              id: log.actor.id,
              email: log.actor.email,
              fullName: log.actor.fullName,
              role: log.actor.role,
              isActive: log.actor.isActive,
            }
          : null,
      })),
    };
  }
}