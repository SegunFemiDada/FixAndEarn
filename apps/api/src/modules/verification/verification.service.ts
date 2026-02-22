// Path: /apps/api/src/modules/verification/verification.service.ts
import { ConflictException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { createHash } from "crypto";
import { Inject } from "@nestjs/common";
import { OCR_PROVIDER, FACE_MATCH_PROVIDER } from "./providers/providers.tokens";
import { OcrProvider } from "./providers/ocr.provider";
import { FaceMatchProvider } from "./providers/face-match.provider";

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

  async submit(userId: string, input: {
    bvn: string;
    bio: string;
    skills: string[];
    address: {
      house: string;
      street: string;
      area: string;
      busStop: string;
      lga: string;
      city: string;
      state: string;
    };
    instagram?: string;
    tiktok?: string;
    ninImagePath: string;
    selfiePath: string;
    utilityBillPath: string;
  }) {
    const existing = await this.prisma.identityVerification.findUnique({
      where: { userId }
    });
    if (existing) {
      throw new ConflictException("Verification already submitted for this account.");
    }

    const nin = await this.ocr.extractNinNumber(input.ninImagePath);
    const ninHash = this.hash(nin);
    const bvnHash = this.hash(input.bvn);
    const faceHash = await this.face.generateFaceHash(input.selfiePath);

    // Pre-check duplicates for clearer errors (DB unique constraints are still the final guard)
    const dupNin = await this.prisma.identityVerification.findUnique({ where: { ninHash } });
    if (dupNin) throw new ConflictException("Duplicate identity detected (NIN already used).");

    const dupBvn = await this.prisma.identityVerification.findUnique({ where: { bvnHash } });
    if (dupBvn) throw new ConflictException("Duplicate identity detected (BVN already used).");

    const dupFace = await this.prisma.identityVerification.findUnique({ where: { faceHash } });
    if (dupFace) throw new ConflictException("Duplicate identity detected (face already used).");

    return this.prisma.identityVerification.create({
      data: {
        userId,
        ninHash,
        bvnHash,
        faceHash,
        ninImagePath: input.ninImagePath,
        selfieImagePath: input.selfiePath,
        utilityBillPath: input.utilityBillPath,
        bio: input.bio,
        skills: input.skills.join(","),
        addressHouse: input.address.house,
        addressStreet: input.address.street,
        addressArea: input.address.area,
        nearestBusStop: input.address.busStop,
        lga: input.address.lga,
        city: input.address.city,
        state: input.address.state,
        instagram: input.instagram,
        tiktok: input.tiktok
      }
    });
  }
  async getMine(userId: string) {
  return this.prisma.identityVerification.findUnique({
    where: { userId },
    select: {
      status: true,
      reviewReason: true,
    },
  });
}


}
