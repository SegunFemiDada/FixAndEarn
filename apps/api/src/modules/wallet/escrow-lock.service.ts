import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { JobStatus } from "@prisma/client";

@Injectable()
export class EscrowLockService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Amount (milliFEC) effectively locked for a fixer because jobs are in escrow.
   *
   * IMPORTANT:
   * - We only count jobs that are already agreed and in progress (escrow funded, fixer unpaid).
   * - We use lockedPriceMilliFec when present; if null, we fall back to priceMilliFec to avoid
   *   undercounting locked funds in any edge case.
   */
  async getLockedEscrowAmountForFixer(fixerId: string): Promise<number> {
    const jobs = await this.prisma.job.findMany({
      where: {
        fixerId,
        status: JobStatus.IN_PROGRESS
      },
      select: {
        lockedPriceMilliFec: true,
        priceMilliFec: true
      }
    });

    return jobs.reduce((sum, j) => sum + (j.lockedPriceMilliFec ?? j.priceMilliFec), 0);
  }
}