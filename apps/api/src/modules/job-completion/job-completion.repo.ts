//path: apps/api/src/modules/job-completion/job-completion.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma, WalletRole } from "@prisma/client";

@Injectable()
export class JobCompletionRepo {
  constructor(private readonly prisma: PrismaService) {}

  getJob(jobId: string) {
    return this.prisma.job.findUnique({ where: { id: jobId } });
  }

  async requestCompletion(jobId: string) {
    return this.prisma.job.update({
      where: { id: jobId },
      data: { completedRequestedAt: new Date() }
    });
  }

  async rejectCompletion(jobId: string) {
    return this.prisma.job.update({
      where: { id: jobId },
      data: { completedRequestedAt: null }
    });
  }

  private async getOrCreatePlatformWallet(tx: Prisma.TransactionClient) {
    let pw = await tx.platformWallet.findFirst();
    if (!pw) {
      pw = await tx.platformWallet.create({ data: {} });
    }
    return pw;
  }
    private async ensureEscrowUserId(tx: Prisma.TransactionClient): Promise<string> {
    const key = "ESCROW_USER_ID";
    const meta = await tx.appMeta.findUnique({ where: { key } });
    if (meta?.value) return meta.value;

    const escrowUser = await tx.user.create({
      data: {
        email: "escrow@fixandearn.internal",
        fullName: "FixAndEarn Escrow",
        passwordHash: "DISABLED",
        isActive: true
      }
    });

        await tx.wallet.create({
      data: {
        userId: escrowUser.id,
        role: WalletRole.SYSTEM,
        balanceMilliFec: 0,
      },
    });

    await tx.appMeta.upsert({
      where: { key },
      update: { value: escrowUser.id },
      create: { key, value: escrowUser.id }
    });

    return escrowUser.id;
  }

  async approveAndSettle(args: {
    jobId: string;
    clientId: string;
    fixerId: string;
    amountMilliFec: number;
    stars: number;
    comment?: string | null;
  }) {
    const { jobId, clientId, fixerId, amountMilliFec, stars, comment } = args;

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.job.findUnique({ where: { id: jobId } });
      if (!job) throw new Error("JOB_NOT_FOUND");

      if (job.status === "COMPLETED") return { ok: true, status: "COMPLETED" as const };
      if (job.status !== "IN_PROGRESS") throw new Error("JOB_NOT_IN_PROGRESS");

      if (!job.lockedPriceMilliFec || job.lockedPriceMilliFec !== amountMilliFec) {
        throw new Error("INVALID_LOCKED_PRICE");
      }

      const escrowUserId = await this.ensureEscrowUserId(tx);

            const escrowWallet = await tx.wallet.findUnique({
        where: {
          userId_role: {
            userId: escrowUserId,
            role: WalletRole.SYSTEM,
          },
        },
      });

      const fixerWallet = await tx.wallet.findUnique({
        where: {
          userId_role: {
            userId: fixerId,
            role: WalletRole.FIXER,
          },
        },
      });
      if (!escrowWallet || !fixerWallet) throw new Error("WALLET_NOT_FOUND");

      // Idempotency keys
      const payKey = `job_payment:${jobId}`;
      const payoutKey = `job_payout:${jobId}`;
      const commissionKey = `job_commission:${jobId}`;

      // If payment exists, settlement already happened
      const existingPayment = await tx.ledgerEntry.findUnique({ where: { idempotencyKey: payKey } });

      if (!existingPayment) {
        
        if (escrowWallet.balanceMilliFec < amountMilliFec) throw new Error("ESCROW_INSUFFICIENT_BALANCE");
        const commission = Math.floor(amountMilliFec * 0.1);
        const payout = amountMilliFec - commission;

        // Client pays full amount
                await tx.ledgerEntry.create({
          data: {
            walletId: escrowWallet.id,
            type: "JOB_PAYMENT",
            direction: "DEBIT",
            amountMilliFec,
            idempotencyKey: payKey,
            reference: jobId,
            metadata: { jobId, clientId, fixerId, source: "ESCROW" }
          }
        });

        await tx.wallet.update({
          where: { id: escrowWallet.id },
          data: { balanceMilliFec: { decrement: amountMilliFec } }
        });

        // Fixer receives payout (90%)
        await tx.ledgerEntry.create({
          data: {
            walletId: fixerWallet.id,
            type: "JOB_PAYOUT",
            direction: "CREDIT",
            amountMilliFec: payout,
            idempotencyKey: payoutKey,
            reference: jobId,
            metadata: { jobId, clientId, commissionMilliFec: commission }
          }
        });

        await tx.wallet.update({
          where: { id: fixerWallet.id },
          data: { balanceMilliFec: { increment: payout } }
        });

        // Platform receives commission (10%)
        const platformWallet = await this.getOrCreatePlatformWallet(tx);

        await tx.platformLedgerEntry.create({
          data: {
            platformWalletId: platformWallet.id,
            type: "COMMISSION",
            direction: "CREDIT",
            amountMilliFec: commission,
            idempotencyKey: commissionKey,
            reference: jobId,
            metadata: { jobId, clientId, fixerId }
          }
        });

        await tx.platformWallet.update({
          where: { id: platformWallet.id },
          data: { balanceMilliFec: { increment: commission } }
        });
      }

      // Rating is idempotent by unique jobId
      // Review (idempotent by unique jobId)
await tx.jobReview.upsert({
  where: { jobId },
  update: {
    rating: stars,
    comment: comment ?? null
  },
  create: {
    jobId,
    clientId,
    fixerId,
    rating: stars,
    comment: comment ?? null
  }
});
      await tx.job.update({
  where: { id: jobId },
  data: {
    status: "COMPLETED",
    completedApprovedAt: new Date()
  }
});
      return { ok: true, status: "COMPLETED" as const };
    });
  }
}
