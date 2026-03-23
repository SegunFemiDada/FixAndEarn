//path: apps/api/src/admin/users/admin-users.service.ts
import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AdminRole } from "@prisma/client";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminUsersRepo } from "./admin-users.repo";
import { CurrentUserPayload } from "src/common/types/current-user";

type AdminCtx = { adminId: string; role: AdminRole };

const ROLES_BANK_VIEW = new Set<AdminRole>([AdminRole.SUPER_ADMIN, AdminRole.FINANCE_OFFICER]);
const ROLES_VERIFICATION_SENSITIVE = new Set<AdminRole>([
  AdminRole.SUPER_ADMIN,
  AdminRole.VERIFICATION_OFFICER,
  AdminRole.SECURITY_OFFICER
]);

const ROLES_SUSPEND = new Set<AdminRole>([
  AdminRole.SUPER_ADMIN,
  AdminRole.SUPPORT_OFFICER,
  AdminRole.SECURITY_OFFICER
]);

const ROLES_FORCE_REVERIFY = new Set<AdminRole>([AdminRole.SUPER_ADMIN, AdminRole.SECURITY_OFFICER]);

const ROLES_NOTES = new Set<AdminRole>([
  AdminRole.SUPER_ADMIN,
  AdminRole.SUPPORT_OFFICER,
  AdminRole.SECURITY_OFFICER
]);

@Injectable()
export class AdminUsersService {
  constructor(private readonly repo: AdminUsersRepo, private readonly audit: AdminAuditService) {}

  async search(q: {
  q?: string;
  role?: "CLIENT" | "FIXER";
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED";
  skip?: number;
  take?: number;
}) {
  return this.repo.searchUsers({
    q: q.q,
    role: q.role,
    verificationStatus: q.verificationStatus,
    skip: q.skip ?? 0,
    take: q.take ?? 20,
  });
}

  private maskSensitive(user: CurrentUserPayload, adminRole: AdminRole) {
    const out: any = { ...user };

    // BankDetails: only SUPER_ADMIN + FINANCE_OFFICER
    if (!ROLES_BANK_VIEW.has(adminRole)) {
      out.bankDetails = null;
    }

    // Verification sensitive fields: only SUPER_ADMIN + VERIFICATION_OFFICER + SECURITY_OFFICER
    if (!ROLES_VERIFICATION_SENSITIVE.has(adminRole)) {
      if (out.verification) {
        const v = out.verification;
        out.verification = {
          id: v.id,
          userId: v.userId,
          status: v.status,
          bio: v.bio,
          skills: v.skills,
          addressHouse: v.addressHouse,
          addressStreet: v.addressStreet,
          addressArea: v.addressArea,
          nearestBusStop: v.nearestBusStop,
          lga: v.lga,
          city: v.city,
          state: v.state,
          instagram: v.instagram,
          tiktok: v.tiktok,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
          reviewedByAdminId: v.reviewedByAdminId,
          reviewedAt: v.reviewedAt,
          reviewReason: v.reviewReason
        };
      }
    }

    // Hashes: never expose (NDPR minimization)
    if (out.verification) {
      delete out.verification.ninHash;
      delete out.verification.bvnHash;
      delete out.verification.faceHash;
    }

    return out;
  }

  async getUser(userId: string, admin: AdminCtx) {
    const user = await this.repo.getUserBase(userId);
    if (!user) throw new NotFoundException("USER_NOT_FOUND");
    return this.maskSensitive(user, admin.role);
  }

  async suspend(userId: string, admin: AdminCtx, reason?: string) {
    if (!ROLES_SUSPEND.has(admin.role)) throw new ForbiddenException("ADMIN_FORBIDDEN");

    await this.repo.setActive(userId, false);

    await this.audit.log({
      actorAdminId: admin.adminId,
      action: "USER_SUSPEND",
      description: "Suspended user",
      metadata: { userId, reason: reason?.trim() ?? null }
    });

    return { ok: true };
  }

  async unsuspend(userId: string, admin: AdminCtx, reason?: string) {
    if (!ROLES_SUSPEND.has(admin.role)) throw new ForbiddenException("ADMIN_FORBIDDEN");

    await this.repo.setActive(userId, true);

    await this.audit.log({
      actorAdminId: admin.adminId,
      action: "USER_UNSUSPEND",
      description: "Re-activated user",
      metadata: { userId, reason: reason?.trim() ?? null }
    });

    return { ok: true };
  }

  async forceReverify(userId: string, admin: AdminCtx, reason?: string) {
    if (!ROLES_FORCE_REVERIFY.has(admin.role)) throw new ForbiddenException("ADMIN_FORBIDDEN");

    await this.repo.setForceReverify(userId, true);

    await this.audit.log({
      actorAdminId: admin.adminId,
      action: "USER_FORCE_REVERIFY",
      description: "Forced user re-verification",
      metadata: { userId, reason: reason?.trim() ?? null }
    });

    return { ok: true };
  }

  async setNotes(userId: string, admin: AdminCtx, notes?: string) {
    if (!ROLES_NOTES.has(admin.role)) throw new ForbiddenException("ADMIN_FORBIDDEN");

    const val = notes?.trim() ? notes.trim() : null;
    await this.repo.updateAdminNotes(userId, val);

    await this.audit.log({
      actorAdminId: admin.adminId,
      action: "USER_SET_NOTES",
      description: "Updated admin notes",
      metadata: { userId, hasNotes: Boolean(val) }
    });

    return { ok: true };
  }
}
