//path: apps/api/src/admin/users/admin-users.service.ts
import { ForbiddenException, ConflictException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { AdminRole } from "@prisma/client";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminUsersRepo } from "./admin-users.repo";
import { CurrentUserPayload } from "src/common/types/current-user";
import { AdminUserUpdateDto } from "./dto/admin-user-update.dto";



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
const ROLES_UPDATE = new Set<AdminRole>([AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER]);

const ROLES_SUPPORT_OR_SUPER = new Set<AdminRole>([AdminRole.SUPER_ADMIN, AdminRole.SUPPORT_OFFICER]);
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
 // Add these methods inside AdminUsersService class
async getDeletionRequests(status?: "PENDING" | "APPROVED" | "REJECTED") {
  return this.repo.getDeletionRequests(status);
}

async approveDeletion(userId: string, admin: AdminCtx) {
  const user = await this.repo.getUserBase(userId);
  if (!user) throw new NotFoundException("USER_NOT_FOUND");
  if (user.deletionRequestStatus !== "PENDING") throw new BadRequestException("NOT_PENDING");

  const anonymizedEmail = `deleted_${userId}@deleted.fixandearn.com`;
  const anonymizedName = "Deleted User";
  await this.repo.anonymiseUser(userId, anonymizedEmail, anonymizedName);
  await this.repo.updateDeletionStatus(userId, "APPROVED", admin.adminId);

  await this.audit.log({
    actorAdminId: admin.adminId,
    action: "USER_DELETION_APPROVED",
    description: `Approved account deletion for user ${userId}`,
    metadata: { userId },
  });
  return { ok: true };
}

async rejectDeletion(userId: string, reason: string | undefined, admin: AdminCtx) {
  const user = await this.repo.getUserBase(userId);
  if (!user) throw new NotFoundException("USER_NOT_FOUND");
  if (user.deletionRequestStatus !== "PENDING") throw new BadRequestException("NOT_PENDING");

  await this.repo.updateDeletionStatus(userId, "REJECTED", admin.adminId, reason);
  await this.audit.log({
    actorAdminId: admin.adminId,
    action: "USER_DELETION_REJECTED",
    description: `Rejected account deletion for user ${userId}`,
    metadata: { userId, reason },
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
  async resetWithdrawalPin(userId: string, admin: AdminCtx) {
  if (!ROLES_SUPPORT_OR_SUPER.has(admin.role)) throw new ForbiddenException("ADMIN_FORBIDDEN");
  await this.repo.updateUser(userId, { withdrawalPinHash: null });
  await this.audit.log({
    actorAdminId: admin.adminId,
    action: "USER_RESET_WITHDRAWAL_PIN",
    description: "Reset withdrawal pin",
    metadata: { userId },
  });
  return { ok: true };
}
  async updateUser(userId: string, admin: AdminCtx, dto: AdminUserUpdateDto) {
  if (!ROLES_UPDATE.has(admin.role)) throw new ForbiddenException("ADMIN_FORBIDDEN");

  const user = await this.repo.getUserBase(userId);
  if (!user) throw new NotFoundException("USER_NOT_FOUND");

  const userUpdateData: any = {};
  if (dto.fullName !== undefined) userUpdateData.fullName = dto.fullName.trim();
  if (dto.email !== undefined) {
    const newEmail = dto.email.trim().toLowerCase();
    const existing = await this.repo.findUserByEmail(newEmail);
    if (existing && existing.id !== userId) {
      throw new ConflictException("EMAIL_ALREADY_IN_USE");
    }
    userUpdateData.email = newEmail;
  }

  if (Object.keys(userUpdateData).length > 0) {
    await this.repo.updateUser(userId, userUpdateData);
  }

  const verificationUpdateData: any = {};
  if (user.verification) {
    if (dto.bio !== undefined) verificationUpdateData.bio = dto.bio?.trim() ?? null;
    if (dto.skills !== undefined) verificationUpdateData.skills = dto.skills?.trim() ?? null;
    if (dto.addressHouse !== undefined) verificationUpdateData.addressHouse = dto.addressHouse?.trim() ?? null;
    if (dto.addressStreet !== undefined) verificationUpdateData.addressStreet = dto.addressStreet?.trim() ?? null;
    if (dto.addressArea !== undefined) verificationUpdateData.addressArea = dto.addressArea?.trim() ?? null;
    if (dto.nearestBusStop !== undefined) verificationUpdateData.nearestBusStop = dto.nearestBusStop?.trim() ?? null;
    if (dto.lga !== undefined) verificationUpdateData.lga = dto.lga?.trim() ?? null;
    if (dto.city !== undefined) verificationUpdateData.city = dto.city?.trim() ?? null;
    if (dto.state !== undefined) verificationUpdateData.state = dto.state?.trim() ?? null;
    if (dto.instagram !== undefined) verificationUpdateData.instagram = dto.instagram?.trim() ?? null;
    if (dto.tiktok !== undefined) verificationUpdateData.tiktok = dto.tiktok?.trim() ?? null;

    if (Object.keys(verificationUpdateData).length > 0) {
      await this.repo.updateVerification(user.verification.id, verificationUpdateData);
    }
  }

  const updatedFields = Object.keys({
    ...userUpdateData,
    ...(user.verification ? verificationUpdateData : {}),
  });

  await this.audit.log({
    actorAdminId: admin.adminId,
    action: "USER_UPDATE",
    description: `Updated user ${userId}`,
    metadata: { userId, updatedFields },
  });

  return this.getUser(userId, admin);
}
}
