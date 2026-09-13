// Path: apps/api/src/admin/verification/admin-verification.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Inject  } from "@nestjs/common";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminVerificationRepo } from "./admin-verification.repo";
import { FACE_MATCH_PROVIDER } from "../../modules/verification/providers/providers.tokens";
import { FaceMatchProvider } from "../../modules/verification/providers/face-match.provider";

@Injectable()
export class AdminVerificationService {
 constructor(
  private readonly repo: AdminVerificationRepo,
  private readonly audit: AdminAuditService,
  @Inject(FACE_MATCH_PROVIDER)
  private readonly face: FaceMatchProvider,
) {}
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

    let newRekognitionFaceId: string | null = null;
const previousRekognitionFaceId = rec.rekognitionFaceId ?? null;

if (args.action === "APPROVE") {
  if (!rec.selfieImagePath) {
    throw new BadRequestException("SELFIE_IMAGE_MISSING");
  }

  // Re-check at approval time so a newer approved identity cannot
  // slip through after the applicant originally submitted.
  const existingMatch = await this.face.searchExistingFace(
    rec.selfieImagePath,
  );

  if (existingMatch) {
    const matchedVerification =
      await this.repo.getByRekognitionFaceId(
        existingMatch.faceId,
      );

    if (
      matchedVerification &&
      matchedVerification.userId !== rec.userId &&
      matchedVerification.status === "APPROVED"
    ) {
      throw new BadRequestException(
        "DUPLICATE_BIOMETRIC_IDENTITY",
      );
    }
  }

  const indexed = await this.face.indexApprovedFace(
    rec.selfieImagePath,
    rec.userId,
  );

  newRekognitionFaceId = indexed.faceId;
}

let updated;

try {
  updated = await this.repo.decide({
    id: args.verificationId,
    status,
    adminId: args.adminId,
    reason,
    rekognitionFaceId: newRekognitionFaceId,
  });
} catch (error) {
  // The database transaction failed after AWS indexing.
  // Remove the newly-created biometric record so AWS does not
  // retain an orphaned face that the database does not reference.
  if (newRekognitionFaceId) {
    try {
      await this.face.deleteFace(newRekognitionFaceId);
    } catch {
      // Keep the original database error as the primary failure.
    }
  }

  throw error;
}

// A successful Force Reverify approval replaces the previous
// biometric record.
if (
  args.action === "APPROVE" &&
  previousRekognitionFaceId &&
  previousRekognitionFaceId !== newRekognitionFaceId
) {
  try {
    await this.face.deleteFace(previousRekognitionFaceId);
  } catch {
    // The verification is already approved and points to the
    // new FaceId. Cleanup failure must not undo that approval.
  }
}

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