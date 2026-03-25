//path: apps/api/src/admin/finance/admin-finance.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma, WalletRole } from "@prisma/client";

@Injectable()
export class AdminFinanceRepo {
  constructor(private readonly prisma: PrismaService) {}

  listWithdrawals(status: any, skip: number, take: number) {
  return this.prisma.withdrawalRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" }, // FIXED (latest first)
    skip,
    take,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          
        },
      },
    },
  });
}

  async getWithdrawal(id: string) {
  const row = await this.prisma.withdrawalRequest.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          isActive: true,
          bankDetails: true,
        },
      },
    },
  });

  if (!row) return null;

  const wallet = await this.prisma.wallet.findUnique({
    where: {
      userId_role: {
        userId: row.userId,
        role: WalletRole.FIXER,
      },
    },
    select: {
      id: true,
      role: true,
      balanceMilliFec: true,
    },
  });

  return {
    ...row, // ✅ includes payoutMode already
    user: {
      ...row.user,
      wallet,
    },
  };
}

  async getWithdrawalEarningsTrace(withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
      select: {
        id: true,
        userId: true,
        amountMilliFec: true,
        status: true,
        createdAt: true,
        reviewedAt: true,
        paidAt: true,
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
          },
        },
      },
    });

    if (!withdrawal) return null;

    const wallet = await this.prisma.wallet.findUnique({
      where: {
        userId_role: {
          userId: withdrawal.userId,
          role: WalletRole.FIXER,
        },
      },
      select: {
        id: true,
        balanceMilliFec: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!wallet) {
      return {
        withdrawal,
        wallet: null,
        summary: {
          totalEarningCreditsMilliFec: 0,
          withdrawalAmountMilliFec: withdrawal.amountMilliFec,
          cumulativeCoveredMilliFec: 0,
          coverageReached: false,
          remainingUncoveredMilliFec: withdrawal.amountMilliFec,
          autoAssessment: {
            status: "FLAG" as const,
            reasons: ["Fixer wallet was not found."],
            checkedAt: new Date(),
          },
        },
        entries: [],
      };
    }

    const earningEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        walletId: wallet.id,
        direction: "CREDIT",
        OR: [
          { type: "JOB_PAYOUT" },
          {
            type: "ADJUSTMENT",
            metadata: {
              path: ["kind"],
              equals: "DISPUTE_RELEASE_TO_FIXER",
            },
          },
        ],
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        type: true,
        amountMilliFec: true,
        reference: true,
        metadata: true,
        createdAt: true,
      },
    });

    const jobIds = Array.from(
      new Set(
        earningEntries
          .map((entry) => {
            const metadata =
              entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata)
                ? (entry.metadata as Record<string, unknown>)
                : null;

            const jobIdFromMetadata = typeof metadata?.jobId === "string" ? metadata.jobId : null;
            const jobIdFromReference = typeof entry.reference === "string" ? entry.reference : null;

            return jobIdFromMetadata ?? jobIdFromReference;
          })
          .filter((value): value is string => Boolean(value))
      )
    );

    const jobs = jobIds.length
      ? await this.prisma.job.findMany({
          where: {
            id: {
              in: jobIds,
            },
          },
          select: {
            id: true,
            clientId: true,
            fixerId: true,
            status: true,
            lockedPriceMilliFec: true,
            priceMilliFec: true,
            completedApprovedAt: true,
            dispute: {
              select: {
                id: true,
                resolutionType: true,
                resolvedAt: true,
              },
            },
          },
        })
      : [];

    const jobsById = new Map(jobs.map((job) => [job.id, job]));

    let cumulativeCoveredMilliFec = 0;

    const tracedEntries = earningEntries.map((entry) => {
      const metadata =
        entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata)
          ? (entry.metadata as Record<string, unknown>)
          : null;

      const jobId =
        (typeof metadata?.jobId === "string" ? metadata.jobId : null) ??
        (typeof entry.reference === "string" ? entry.reference : null);

      const clientId = typeof metadata?.clientId === "string" ? metadata.clientId : null;
      const fixerId = typeof metadata?.fixerId === "string" ? metadata.fixerId : null;
      const source = typeof metadata?.source === "string" ? metadata.source : null;
      const kind = typeof metadata?.kind === "string" ? metadata.kind : null;
      const commissionMilliFec =
        typeof metadata?.commissionMilliFec === "number"
          ? metadata.commissionMilliFec
          : typeof metadata?.commissionAmountMilliFec === "number"
            ? metadata.commissionAmountMilliFec
            : null;
      const grossAmountMilliFec =
        typeof metadata?.grossAmountMilliFec === "number"
          ? metadata.grossAmountMilliFec
          : typeof metadata?.grossAmount === "number"
            ? metadata.grossAmount
            : null;
      const netAmountMilliFec =
        typeof metadata?.netAmountMilliFec === "number"
          ? metadata.netAmountMilliFec
          : entry.amountMilliFec;

      cumulativeCoveredMilliFec += entry.amountMilliFec;

      const linkedJob = jobId ? jobsById.get(jobId) ?? null : null;

      return {
        id: entry.id,
        type: entry.type,
        amountMilliFec: entry.amountMilliFec,
        createdAt: entry.createdAt,
        reference: entry.reference,
        payoutSource: source ?? kind ?? entry.type,
        jobId,
        clientId: clientId ?? linkedJob?.clientId ?? null,
        fixerId: fixerId ?? linkedJob?.fixerId ?? null,
        grossAmountMilliFec: grossAmountMilliFec ?? linkedJob?.lockedPriceMilliFec ?? linkedJob?.priceMilliFec ?? null,
        netAmountMilliFec,
        commissionMilliFec,
        cumulativeCoveredMilliFec,
        coversWithdrawalAfterThisEntry: cumulativeCoveredMilliFec >= withdrawal.amountMilliFec,
        job: linkedJob
          ? {
              id: linkedJob.id,
              clientId: linkedJob.clientId,
              fixerId: linkedJob.fixerId,
              status: linkedJob.status,
              lockedPriceMilliFec: linkedJob.lockedPriceMilliFec,
              priceMilliFec: linkedJob.priceMilliFec,
              completedApprovedAt: linkedJob.completedApprovedAt,
              dispute: linkedJob.dispute
                ? {
                    id: linkedJob.dispute.id,
                    resolutionType: linkedJob.dispute.resolutionType,
                    resolvedAt: linkedJob.dispute.resolvedAt,
                  }
                : null,
            }
          : null,
      };
    });

    const totalEarningCreditsMilliFec = tracedEntries.reduce(
      (sum, entry) => sum + entry.amountMilliFec,
      0
    );

    const coverageReached = totalEarningCreditsMilliFec >= withdrawal.amountMilliFec;
    const remainingUncoveredMilliFec = Math.max(withdrawal.amountMilliFec - totalEarningCreditsMilliFec, 0);

    const autoAssessmentReasons: string[] = [];

    if (!coverageReached) {
      autoAssessmentReasons.push("Traced earning credits do not fully cover the withdrawal amount.");
    }

    if (tracedEntries.length === 0) {
      autoAssessmentReasons.push("No earning credits were found in the fixer wallet.");
    }

    const entriesWithMissingJobId = tracedEntries.filter((entry) => !entry.jobId);
    if (entriesWithMissingJobId.length > 0) {
      autoAssessmentReasons.push("One or more traced earning credits are missing a linked job ID.");
    }

    const entriesWithMissingClientId = tracedEntries.filter((entry) => !entry.clientId);
    if (entriesWithMissingClientId.length > 0) {
      autoAssessmentReasons.push("One or more traced earning credits are missing a linked client ID.");
    }

    const entriesWithMissingCommission = tracedEntries.filter(
      (entry) => entry.type === "JOB_PAYOUT" && entry.commissionMilliFec == null
    );
    if (entriesWithMissingCommission.length > 0) {
      autoAssessmentReasons.push("One or more job payout entries are missing commission trail data.");
    }

    const entriesBeforeApprovalOrResolution = tracedEntries.filter((entry) => {
      if (!entry.job) return false;
      if (entry.job.dispute?.resolvedAt) {
        return new Date(entry.createdAt).getTime() < new Date(entry.job.dispute.resolvedAt).getTime();
      }
      if (entry.job.completedApprovedAt) {
        return new Date(entry.createdAt).getTime() < new Date(entry.job.completedApprovedAt).getTime();
      }
      return false;
    });

    if (entriesBeforeApprovalOrResolution.length > 0) {
      autoAssessmentReasons.push("One or more earning credits were created before the linked job approval or dispute resolution timestamp.");
    }

    const autoAssessmentStatus = autoAssessmentReasons.length === 0 ? "PASS" : "FLAG";

    return {
      withdrawal,
      wallet,
      summary: {
        totalEarningCreditsMilliFec,
        withdrawalAmountMilliFec: withdrawal.amountMilliFec,
        cumulativeCoveredMilliFec: Math.min(cumulativeCoveredMilliFec, withdrawal.amountMilliFec),
        coverageReached,
        remainingUncoveredMilliFec,
        autoAssessment: {
          status: autoAssessmentStatus,
          reasons: autoAssessmentReasons,
          checkedAt: new Date(),
        },
      },
      entries: tracedEntries,
    };
  }

  private async hasWithdrawalDebit(
    tx: Prisma.TransactionClient,
    walletId: string,
    withdrawalId: string
  ) {
    const debit = await tx.ledgerEntry.findFirst({
      where: {
        walletId,
        reference: withdrawalId,
        direction: "DEBIT",
        type: { in: ["WITHDRAWAL_REQUEST", "WITHDRAWAL_APPROVED"] },
      },
      select: { id: true, type: true },
    });

    return debit;
  }

  private async hasWithdrawalReversal(
    tx: Prisma.TransactionClient,
    walletId: string,
    withdrawalId: string
  ) {
    const credit = await tx.ledgerEntry.findFirst({
      where: {
        walletId,
        reference: withdrawalId,
        direction: "CREDIT",
        type: { in: ["WITHDRAWAL_REJECTED"] },
      },
      select: { id: true },
    });

    return credit;
  }

  async approveWithdrawal(args: { withdrawalId: string; adminId: string; note?: string | null }) {
    const { withdrawalId, adminId, note } = args;

    return this.prisma.$transaction(async (tx) => {
      const wr = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
      if (!wr) throw new Error("WITHDRAWAL_NOT_FOUND");

      if (wr.status === "APPROVED" || wr.status === "PAID") {
        return { ok: true, status: wr.status };
      }
      if (wr.status !== "PENDING") throw new Error("WITHDRAWAL_NOT_PENDING");

      const wallet = await tx.wallet.findUnique({
        where: {
          userId_role: {
            userId: wr.userId,
            role: WalletRole.FIXER,
          },
        },
      });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      const existingDebit = await this.hasWithdrawalDebit(tx, wallet.id, withdrawalId);

      if (!existingDebit) {
        if (wallet.balanceMilliFec < wr.amountMilliFec) throw new Error("INSUFFICIENT_BALANCE");

        const idempotencyKey = `withdrawal_approve:${withdrawalId}`;

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: "WITHDRAWAL_APPROVED",
            direction: "DEBIT",
            amountMilliFec: wr.amountMilliFec,
            idempotencyKey,
            reference: withdrawalId,
            metadata: { withdrawalId },
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceMilliFec: { decrement: wr.amountMilliFec } },
        });
      }

      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "APPROVED",
          reviewedBy: adminId,
          reviewNote: note ?? null,
          reviewedAt: new Date(),
        },
      });

      return { ok: true, status: "APPROVED" as const };
    });
  }

  async rejectWithdrawal(args: { withdrawalId: string; adminId: string; note?: string | null }) {
    const { withdrawalId, adminId, note } = args;

    return this.prisma.$transaction(async (tx) => {
      const wr = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
      if (!wr) throw new Error("WITHDRAWAL_NOT_FOUND");

      if (wr.status === "REJECTED") return { ok: true, status: "REJECTED" as const };
      if (wr.status === "PAID") return { ok: true, status: "PAID" as const };
      if (wr.status !== "PENDING") throw new Error("WITHDRAWAL_NOT_PENDING");

      const wallet = await tx.wallet.findUnique({
        where: {
          userId_role: {
            userId: wr.userId,
            role: WalletRole.FIXER,
          },
        },
      });
      if (!wallet) throw new Error("WALLET_NOT_FOUND");

      const existingDebit = await this.hasWithdrawalDebit(tx, wallet.id, withdrawalId);
      const existingReversal = await this.hasWithdrawalReversal(tx, wallet.id, withdrawalId);

      if (existingDebit && !existingReversal) {
        const idempotencyKey = `withdrawal_reject_refund:${withdrawalId}`;

        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            type: "WITHDRAWAL_REJECTED",
            direction: "CREDIT",
            amountMilliFec: wr.amountMilliFec,
            idempotencyKey,
            reference: withdrawalId,
            metadata: { withdrawalId, reason: note ?? null },
          },
        });

        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balanceMilliFec: { increment: wr.amountMilliFec } },
        });
      }

      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "REJECTED",
          reviewedBy: adminId,
          reviewNote: note ?? null,
          reviewedAt: new Date(),
        },
      });

      return { ok: true, status: "REJECTED" as const };
    });
  }

  async markpaid(args: { withdrawalId: string; adminId: string; note?: string | null }) {
    const { withdrawalId, adminId, note } = args;

    return this.prisma.$transaction(async (tx) => {
      const wr = await tx.withdrawalRequest.findUnique({ where: { id: withdrawalId } });
      if (!wr) throw new Error("WITHDRAWAL_NOT_FOUND");

      if (wr.status === "PAID") return { ok: true, status: "PAID" as const };
      if (wr.status !== "APPROVED") throw new Error("WITHDRAWAL_NOT_APPROVED");

      await tx.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: "PAID",
          reviewedBy: adminId,
          reviewNote: note ?? wr.reviewNote ?? null,
          paidAt: new Date(),
        },
      });

      return { ok: true, status: "PAID" as const };
    });
  }
}