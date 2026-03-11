//path: apps/api/src/admin/verification/admin-verification.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminVerificationRepo } from "./admin-verification.repo";

@Injectable()
export class AdminVerificationService {
  constructor(private readonly repo: AdminVerificationRepo, private readonly audit: AdminAuditService) {}

  async listPending(skip = 0, take = 20) {
    return this.repo.listPending(skip, take);
  }

  async getOne(id: string) {
    const rec = await this.repo.getById(id);
    if (!rec) throw new NotFoundException("VERIFICATION_NOT_FOUND");
    return rec;
  }

  async decide(args: { verificationId: string; adminId: string; action: "APPROVE" | "REJECT" | "REQUEST_REUPLOAD"; reason?: string }) {
    const rec = await this.repo.getById(args.verificationId);
    if (!rec) throw new NotFoundException("VERIFICATION_NOT_FOUND");
    if (rec.status !== "PENDING") throw new ForbiddenException("VERIFICATION_NOT_PENDING");

    if ((args.action === "REJECT" || args.action === "REQUEST_REUPLOAD") && !args.reason?.trim()) {
      throw new BadRequestException("REASON_REQUIRED");
    }

    const status = args.action === "APPROVE" ? "APPROVED" : "REJECTED";
    const reason =
      args.action === "REQUEST_REUPLOAD" ? `REQUEST_REUPLOAD: ${args.reason?.trim()}` : args.reason?.trim();

    const updated = await this.repo.decide({
      id: args.verificationId,
      status,
      adminId: args.adminId,
      reason: reason ?? null
    });

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "VERIFICATION_DECISION",
      description: `Verification ${args.action}`,
      metadata: { verificationId: args.verificationId, status, reason: reason ?? null, userId: rec.userId }
    });

    return { ok: true, status: updated.status };
  }
}
