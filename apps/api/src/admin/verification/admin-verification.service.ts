// Path: apps/api/src/admin/verification/admin-verification.service.ts
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

  async decide(args: {
    verificationId: string;
    adminId: string;
    action: "APPROVE" | "REJECT" | "REQUEST_REUPLOAD";
    reason?: string;
    reuploadFields?: string[];
  }) {
    const rec = await this.repo.getById(args.verificationId);
    if (!rec) throw new NotFoundException("VERIFICATION_NOT_FOUND");
    if (rec.status !== "PENDING") throw new ForbiddenException("VERIFICATION_NOT_PENDING");

    const cleanReason = args.reason?.trim();
    const cleanReuploadFields = Array.isArray(args.reuploadFields)
      ? Array.from(
          new Set(
            args.reuploadFields
              .map((f) => String(f ?? "").trim())
              .filter(Boolean)
          )
        )
      : [];

    if ((args.action === "REJECT" || args.action === "REQUEST_REUPLOAD") && !cleanReason) {
      throw new BadRequestException("REASON_REQUIRED");
    }

    if (args.action === "REQUEST_REUPLOAD" && cleanReuploadFields.length === 0) {
      throw new BadRequestException("REUPLOAD_FIELDS_REQUIRED");
    }

    const status = args.action === "APPROVE" ? "APPROVED" : "REJECTED";

    let reason: string | null = cleanReason ?? null;

    if (args.action === "REQUEST_REUPLOAD") {
      reason = `REQUEST_REUPLOAD: ${cleanReason}${cleanReuploadFields.length ? ` | FIELDS: ${cleanReuploadFields.join(", ")}` : ""}`;
    }

    const updated = await this.repo.decide({
      id: args.verificationId,
      status,
      adminId: args.adminId,
      reason
    });

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "VERIFICATION_DECISION",
      description: `Verification ${args.action}`,
      metadata: {
        verificationId: args.verificationId,
        status,
        reason,
        reuploadFields: cleanReuploadFields,
        userId: rec.userId
      }
    });

    return {
      ok: true,
      status: updated.status,
      action: args.action,
      reuploadFields: cleanReuploadFields
    };
  }
}