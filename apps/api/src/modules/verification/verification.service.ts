// Path: /apps/api/src/modules/verification/verification.service.ts
import { ConflictException, Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { createHash } from "crypto";
import { Inject } from "@nestjs/common";
import { OCR_PROVIDER, FACE_MATCH_PROVIDER } from "./providers/providers.tokens";
import { OcrProvider } from "./providers/ocr.provider";
import { FaceMatchProvider } from "./providers/face-match.provider";

type SubmitVerificationInput = {
  bvn?: string;
  bio?: string;
  skills?: string[];
  address?: {
    house?: string;
    street?: string;
    area?: string;
    busStop?: string;
    lga?: string;
    city?: string;
    state?: string;
  };
  instagram?: string;
  tiktok?: string;
  ninImagePath?: string;
  selfiePath?: string;
  utilityBillPath?: string;
};

type ParsedReuploadRequest = {
  isReuploadRequest: boolean;
  reason: string | null;
  fields: string[];
};

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OCR_PROVIDER) private readonly ocr: OcrProvider,
    @Inject(FACE_MATCH_PROVIDER) private readonly face: FaceMatchProvider
  ) {}

  private hash(value: string): string {
    return createHash("sha256").update(value).digest("hex");
  }

  private parseReviewReason(reviewReason: string | null | undefined): ParsedReuploadRequest {
    const text = String(reviewReason ?? "").trim();
    if (!text.startsWith("REQUEST_REUPLOAD:")) {
      return {
        isReuploadRequest: false,
        reason: text || null,
        fields: [],
      };
    }

    const body = text.slice("REQUEST_REUPLOAD:".length).trim();
    const [reasonPart, fieldsPart] = body.split("| FIELDS:");

    const fields = (fieldsPart ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      isReuploadRequest: true,
      reason: reasonPart?.trim() || null,
      fields,
    };
  }

  private ensureRequiredString(value: unknown, code: string): string {
    const text = String(value ?? "").trim();
    if (!text) throw new BadRequestException(code);
    return text;
  }

  private ensureRequiredStringArray(value: unknown, code: string): string[] {
    const arr = Array.isArray(value)
      ? value.map((v) => String(v ?? "").trim()).filter(Boolean)
      : [];
    if (arr.length === 0) throw new BadRequestException(code);
    return arr;
  }

  private normalizeAddress(address?: SubmitVerificationInput["address"]) {
    return {
      house: String(address?.house ?? "").trim(),
      street: String(address?.street ?? "").trim(),
      area: String(address?.area ?? "").trim(),
      busStop: String(address?.busStop ?? "").trim(),
      lga: String(address?.lga ?? "").trim(),
      city: String(address?.city ?? "").trim(),
      state: String(address?.state ?? "").trim(),
    };
  }

  private ensureRequiredAddress(address?: SubmitVerificationInput["address"]) {
    const normalized = this.normalizeAddress(address);

    if (!normalized.house) throw new BadRequestException("ADDRESS_HOUSE_REQUIRED");
    if (!normalized.street) throw new BadRequestException("ADDRESS_STREET_REQUIRED");
    if (!normalized.area) throw new BadRequestException("ADDRESS_AREA_REQUIRED");
    if (!normalized.busStop) throw new BadRequestException("ADDRESS_BUS_STOP_REQUIRED");
    if (!normalized.lga) throw new BadRequestException("ADDRESS_LGA_REQUIRED");
    if (!normalized.city) throw new BadRequestException("ADDRESS_CITY_REQUIRED");
    if (!normalized.state) throw new BadRequestException("ADDRESS_STATE_REQUIRED");

    return normalized;
  }

  private async ensureUniqueIdentity(args: {
    currentUserId: string;
    ninHash: string;
    bvnHash: string;
    faceHash: string;
  }) {
    const dupNin = await this.prisma.identityVerification.findFirst({
      where: { ninHash: args.ninHash, NOT: { userId: args.currentUserId } },
      select: { id: true },
    });
    if (dupNin) throw new ConflictException("Duplicate identity detected (NIN already used).");

    const dupBvn = await this.prisma.identityVerification.findFirst({
      where: { bvnHash: args.bvnHash, NOT: { userId: args.currentUserId } },
      select: { id: true },
    });
    if (dupBvn) throw new ConflictException("Duplicate identity detected (BVN already used).");

    const dupFace = await this.prisma.identityVerification.findFirst({
      where: { faceHash: args.faceHash, NOT: { userId: args.currentUserId } },
      select: { id: true },
    });
    if (dupFace) throw new ConflictException("Duplicate identity detected (face already used).");
  }

  async submit(userId: string, input: SubmitVerificationInput) {
    const existing = await this.prisma.identityVerification.findUnique({
      where: { userId },
    });

    if (!existing) {
      const bvn = this.ensureRequiredString(input.bvn, "BVN_REQUIRED");
      const bio = this.ensureRequiredString(input.bio, "BIO_REQUIRED");
      const skills = this.ensureRequiredStringArray(input.skills, "SKILLS_REQUIRED");
      const address = this.ensureRequiredAddress(input.address);

      if (!input.ninImagePath) throw new BadRequestException("NIN_IMAGE_REQUIRED");
      if (!input.selfiePath) throw new BadRequestException("SELFIE_REQUIRED");
      if (!input.utilityBillPath) throw new BadRequestException("UTILITY_BILL_REQUIRED");

      const nin = await this.ocr.extractNinNumber(input.ninImagePath);
      const ninHash = this.hash(nin);
      const bvnHash = this.hash(bvn);
      const faceHash = await this.face.generateFaceHash(input.selfiePath);

      await this.ensureUniqueIdentity({
        currentUserId: userId,
        ninHash,
        bvnHash,
        faceHash,
      });

      return this.prisma.identityVerification.create({
        data: {
          userId,
          ninHash,
          bvnHash,
          faceHash,
          ninImagePath: input.ninImagePath,
          selfieImagePath: input.selfiePath,
          utilityBillPath: input.utilityBillPath,
          bio,
          skills: skills.join(","),
          addressHouse: address.house,
          addressStreet: address.street,
          addressArea: address.area,
          nearestBusStop: address.busStop,
          lga: address.lga,
          city: address.city,
          state: address.state,
          instagram: input.instagram?.trim() || null,
          tiktok: input.tiktok?.trim() || null,
        },
      });
    }

    if (existing.status !== "REJECTED") {
      throw new ConflictException("Verification already submitted for this account.");
    }

    const reupload = this.parseReviewReason(existing.reviewReason);

    const hasTargetedReupload = reupload.isReuploadRequest && reupload.fields.length > 0;

    const mustReplaceFile = (field: string) => hasTargetedReupload && reupload.fields.includes(field);
    const mustReplaceText = (field: string) => hasTargetedReupload && reupload.fields.includes(field);

    const bio = mustReplaceText("bio")
      ? this.ensureRequiredString(input.bio, "BIO_REQUIRED")
      : String(input.bio ?? existing.bio ?? "").trim() || existing.bio;

    const skills = mustReplaceText("skills")
      ? this.ensureRequiredStringArray(input.skills, "SKILLS_REQUIRED")
      : Array.isArray(input.skills) && input.skills.length > 0
        ? input.skills.map((s) => String(s ?? "").trim()).filter(Boolean)
        : String(existing.skills ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

    const address = mustReplaceText("address")
      ? this.ensureRequiredAddress(input.address)
      : {
          house: String(input.address?.house ?? existing.addressHouse ?? "").trim() || existing.addressHouse,
          street: String(input.address?.street ?? existing.addressStreet ?? "").trim() || existing.addressStreet,
          area: String(input.address?.area ?? existing.addressArea ?? "").trim() || existing.addressArea,
          busStop:
            String(input.address?.busStop ?? existing.nearestBusStop ?? "").trim() || existing.nearestBusStop,
          lga: String(input.address?.lga ?? existing.lga ?? "").trim() || existing.lga,
          city: String(input.address?.city ?? existing.city ?? "").trim() || existing.city,
          state: String(input.address?.state ?? existing.state ?? "").trim() || existing.state,
        };

    const instagram =
      input.instagram !== undefined ? input.instagram.trim() || null : existing.instagram ?? null;
    const tiktok =
      input.tiktok !== undefined ? input.tiktok.trim() || null : existing.tiktok ?? null;

    const ninImagePath = input.ninImagePath ?? existing.ninImagePath;
    const selfiePath = input.selfiePath ?? existing.selfieImagePath;
    const utilityBillPath = input.utilityBillPath ?? existing.utilityBillPath;

    if (mustReplaceFile("ninImage") && !input.ninImagePath) {
      throw new BadRequestException("NIN_IMAGE_REQUIRED");
    }
    if (mustReplaceFile("selfie") && !input.selfiePath) {
      throw new BadRequestException("SELFIE_REQUIRED");
    }
    if (mustReplaceFile("utilityBill") && !input.utilityBillPath) {
      throw new BadRequestException("UTILITY_BILL_REQUIRED");
    }
    if (mustReplaceText("bvn") && !String(input.bvn ?? "").trim()) {
      throw new BadRequestException("BVN_REQUIRED");
    }

    const bvnHash =
      String(input.bvn ?? "").trim()
        ? this.hash(String(input.bvn).trim())
        : existing.bvnHash;

    const ninHash =
      input.ninImagePath
        ? this.hash(await this.ocr.extractNinNumber(input.ninImagePath))
        : existing.ninHash;

    const faceHash =
      input.selfiePath
        ? await this.face.generateFaceHash(input.selfiePath)
        : existing.faceHash;

    await this.ensureUniqueIdentity({
      currentUserId: userId,
      ninHash,
      bvnHash,
      faceHash,
    });

    return this.prisma.identityVerification.update({
      where: { userId },
      data: {
        status: "PENDING",
        reviewReason: null,
        reviewedByAdminId: null,
        reviewedAt: null,
        ninHash,
        bvnHash,
        faceHash,
        ninImagePath,
        selfieImagePath: selfiePath,
        utilityBillPath,
        bio,
        skills: skills.join(","),
        addressHouse: address.house,
        addressStreet: address.street,
        addressArea: address.area,
        nearestBusStop: address.busStop,
        lga: address.lga,
        city: address.city,
        state: address.state,
        instagram,
        tiktok,
      },
    });
  }

  async getMine(userId: string) {
    const record = await this.prisma.identityVerification.findUnique({
      where: { userId },
      select: {
        status: true,
        reviewReason: true,
        bio: true,
        skills: true,
        addressHouse: true,
        addressStreet: true,
        addressArea: true,
        nearestBusStop: true,
        lga: true,
        city: true,
        state: true,
        instagram: true,
        tiktok: true,
        ninImagePath: true,
        selfieImagePath: true,
        utilityBillPath: true,
      },
    });

    if (!record) return null;

    const parsed = this.parseReviewReason(record.reviewReason);

    return {
      status: record.status,
      reviewReason: parsed.reason,
      reuploadFields: parsed.fields,
      forceReverify: false,
      submittedData: {
        bio: record.bio ?? "",
        skills: String(record.skills ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        addressHouse: record.addressHouse ?? "",
        addressStreet: record.addressStreet ?? "",
        addressArea: record.addressArea ?? "",
        nearestBusStop: record.nearestBusStop ?? "",
        lga: record.lga ?? "",
        city: record.city ?? "",
        state: record.state ?? "",
        instagram: record.instagram ?? "",
        tiktok: record.tiktok ?? "",
        hasNinImage: Boolean(record.ninImagePath),
        hasSelfieImage: Boolean(record.selfieImagePath),
        hasUtilityBill: Boolean(record.utilityBillPath),
      },
    };
  }
}