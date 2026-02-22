// Path: apps/api/src/modules/fixers/fixers.service.ts
import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

type PreferredStatus = "AVAILABLE" | "UNAVAILABLE";
type EffectiveStatus = "AVAILABLE" | "UNAVAILABLE" | "BUSY";

@Injectable()
export class FixersService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureUserId(userId: string) {
    if (!userId || typeof userId !== "string") {
      throw new ForbiddenException("AUTH_USER_ID_MISSING");
    }
  }

  private async assertApprovedVerification(userId: string) {
    this.ensureUserId(userId);

    const ver = await this.prisma.identityVerification.findUnique({
      where: { userId },
      select: { status: true },
    });

    if (!ver || ver.status !== "APPROVED") {
      throw new ForbiddenException("VERIFICATION_REQUIRED");
    }
  }

  private async assertFixerRole(userId: string) {
    this.ensureUserId(userId);

    // Role code expected to be "FIXER"
    const hasFixer = await this.prisma.userRole.findFirst({
      where: { userId, role: { code: "FIXER" } },
      select: { userId: true },
    });

    if (!hasFixer) throw new ForbiddenException("ONLY_FIXER");
  }

  private async hasInProgressJob(userId: string): Promise<boolean> {
    this.ensureUserId(userId);

    const count = await this.prisma.job.count({
      where: {
        fixerId: userId,
        status: "IN_PROGRESS",
      },
    });

    return count > 0;
  }

  private computeEffectiveStatus(preferred: PreferredStatus, inProgress: boolean): EffectiveStatus {
    return inProgress ? "BUSY" : preferred;
  }

  async getMyAvailability(userId: string) {
    await this.assertApprovedVerification(userId);
    await this.assertFixerRole(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        fixerPreferredAvailability: true,
        fixerAvailabilityUpdatedAt: true,
      },
    });

    const preferred = (user?.fixerPreferredAvailability ?? "UNAVAILABLE") as PreferredStatus;
    const inProgress = await this.hasInProgressJob(userId);

    return {
      preferred,
      effective: this.computeEffectiveStatus(preferred, inProgress),
      updatedAt: user?.fixerAvailabilityUpdatedAt ?? null,
    };
  }

  async setMyPreferredAvailability(userId: string, body: { status?: PreferredStatus }) {
    await this.assertApprovedVerification(userId);
    await this.assertFixerRole(userId);

    const status = body?.status;

    if (status !== "AVAILABLE" && status !== "UNAVAILABLE") {
      throw new BadRequestException("status must be AVAILABLE or UNAVAILABLE");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        fixerPreferredAvailability: status,
        fixerAvailabilityUpdatedAt: new Date(),
      },
      select: { id: true },
    });

    return this.getMyAvailability(userId);
  }
}