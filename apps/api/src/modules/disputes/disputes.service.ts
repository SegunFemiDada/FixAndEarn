import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { DisputeResolutionType, DisputeStatus, JobStatus } from "@prisma/client";
import { LedgerService } from "../wallet/ledger.service";
import { NotificationsService } from "../notifications/notifications.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly notifications: NotificationsService
  ) {}

  async openDispute(args: { jobId: string; actorUserId: string; reason: string; evidence?: any }) {
    const { jobId, actorUserId, reason, evidence } = args;

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    const isClient = job.clientId === actorUserId;
    const isFixer = job.fixerId === actorUserId;
    if (!isClient && !isFixer) throw new ForbiddenException("NOT_JOB_PARTY");

    if (job.status !== JobStatus.IN_PROGRESS) {
      throw new BadRequestException("DISPUTE_ONLY_ALLOWED_IN_PROGRESS");
    }

    const existing = await this.prisma.dispute.findUnique({ where: { jobId } });
    if (existing?.status === DisputeStatus.OPEN) {
      throw new BadRequestException("DISPUTE_ALREADY_OPEN");
    }

    const dispute = await this.prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: { jobId, openedByUserId: actorUserId, reason, evidence }
      });

      await tx.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DISPUTED }
      });

      const recipients = [job.clientId, job.fixerId].filter(Boolean) as string[];
      await Promise.all(
        recipients.map((uid) =>
          this.notifications.create({
            userId: uid,
            type: "DISPUTE_OPENED" as any,
            title: "Dispute opened",
            body: "A dispute has been opened for this job. Admin will review and resolve.",
            data: { jobId, disputeId: created.id },
            idempotencyKey: `notify:dispute_opened:${created.id}:${uid}`,
            prisma: tx
          })
        )
      );

      return created;
    });

    return { ok: true, disputeId: dispute.id };
  }

  async getDispute(jobId: string, actorUserId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    const isClient = job.clientId === actorUserId;
    const isFixer = job.fixerId === actorUserId;
    if (!isClient && !isFixer) throw new ForbiddenException("NOT_JOB_PARTY");

    const dispute = await this.prisma.dispute.findUnique({ where: { jobId } });
    return { dispute };
  }

  async listDisputes(status?: DisputeStatus) {
    const where = status ? { status } : {};
    const disputes = await this.prisma.dispute.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { job: true }
    });
    return { disputes };
  }

  private async ensureEscrowUserId(tx: Prisma.TransactionClient): Promise<string> {
    const key = "ESCROW_USER_ID";
    const meta = await tx.appMeta.findUnique({ where: { key } });
    if (meta?.value) return meta.value;

    // Same as ChatService (duplicated intentionally to avoid refactors/cross-deps)
    const escrowUser = await tx.user.create({
      data: {
        email: "escrow@fixandearn.internal",
        fullName: "FixAndEarn Escrow",
        passwordHash: "DISABLED",
        isActive: true
      }
    });

    await tx.wallet.create({ data: { userId: escrowUser.id, balanceMilliFec: 0 } });

    await tx.appMeta.upsert({
      where: { key },
      update: { value: escrowUser.id },
      create: { key, value: escrowUser.id }
    });

    return escrowUser.id;
  }

  private async getOrCreatePlatformWallet(tx: Prisma.TransactionClient) {
    let pw = await tx.platformWallet.findFirst();
    if (!pw) pw = await tx.platformWallet.create({ data: {} });
    return pw;
  }

  async resolveDispute(args: { disputeId: string; adminUserId: string; resolutionType: DisputeResolutionType }) {
    const { disputeId, adminUserId, resolutionType } = args;

    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { job: true }
      });
      if (!dispute) throw new NotFoundException("DISPUTE_NOT_FOUND");
      if (dispute.status !== DisputeStatus.OPEN) return { ok: true, status: dispute.status };

      const job = dispute.job;
      if (!job) throw new BadRequestException("DISPUTE_JOB_MISSING");

      if (job.status !== JobStatus.DISPUTED) throw new BadRequestException("JOB_NOT_DISPUTED");
      if (!job.fixerId) throw new BadRequestException("JOB_HAS_NO_ASSIGNED_FIXER");
      if (!job.lockedPriceMilliFec) throw new BadRequestException("JOB_HAS_NO_LOCKED_PRICE");

      const amountMilliFec = job.lockedPriceMilliFec;
      const escrowUserId = await this.ensureEscrowUserId(tx);

      // Idempotency keys (avoid double resolution)
      const escrowDebitKey = `dispute_resolve:${disputeId}:escrow_debit`;
      const clientCreditKey = `dispute_resolve:${disputeId}:client_credit`;
      const fixerCreditKey = `dispute_resolve:${disputeId}:fixer_credit`;
      const platformCommissionKey = `dispute_resolve:${disputeId}:platform_commission`;

      const already = await tx.ledgerEntry.findUnique({ where: { idempotencyKey: escrowDebitKey } });
      if (already) {
        await tx.dispute.update({
          where: { id: disputeId },
          data: {
            status: DisputeStatus.RESOLVED,
            resolutionType,
            resolvedByAdminId: adminUserId,
            resolvedAt: dispute.resolvedAt ?? new Date()
          }
        });
        return { ok: true, status: "RESOLVED" as const };
      }

      if (resolutionType === DisputeResolutionType.RELEASE_TO_FIXER) {
        const commission = Math.floor(amountMilliFec * 0.1);
        const payout = amountMilliFec - commission;

        // Escrow pays out full locked amount (atomic)
        await this.ledger.addEntry({
          userId: escrowUserId,
          type: "ADJUSTMENT",
          direction: "DEBIT",
          amountMilliFec,
          idempotencyKey: escrowDebitKey,
          reference: job.id,
          metadata: { kind: "DISPUTE_RELEASE_TO_FIXER", jobId: job.id, disputeId },
          prisma: tx
        });

        await this.ledger.addEntry({
          userId: job.fixerId,
          type: "JOB_PAYOUT",
          direction: "CREDIT",
          amountMilliFec: payout,
          idempotencyKey: fixerCreditKey,
          reference: job.id,
          metadata: { kind: "DISPUTE_RELEASE_TO_FIXER", jobId: job.id, disputeId, commissionMilliFec: commission },
          prisma: tx
        });

        // Platform commission (keep your existing platform ledger model)
        const platformWallet = await this.getOrCreatePlatformWallet(tx);
        await tx.platformLedgerEntry.create({
          data: {
            platformWalletId: platformWallet.id,
            type: "COMMISSION",
            direction: "CREDIT",
            amountMilliFec: commission,
            idempotencyKey: platformCommissionKey,
            reference: job.id,
            metadata: { kind: "DISPUTE_RELEASE_TO_FIXER", jobId: job.id, disputeId, clientId: job.clientId, fixerId: job.fixerId }
          }
        });
        await tx.platformWallet.update({
          where: { id: platformWallet.id },
          data: { balanceMilliFec: { increment: commission } }
        });

        await tx.job.update({
          where: { id: job.id },
          data: { status: JobStatus.COMPLETED, completedApprovedAt: new Date() }
        });
      } else if (resolutionType === DisputeResolutionType.REFUND_TO_CLIENT) {
        await this.ledger.addEntry({
          userId: escrowUserId,
          type: "ADJUSTMENT",
          direction: "DEBIT",
          amountMilliFec,
          idempotencyKey: escrowDebitKey,
          reference: job.id,
          metadata: { kind: "DISPUTE_REFUND_TO_CLIENT", jobId: job.id, disputeId },
          prisma: tx
        });

        await this.ledger.addEntry({
          userId: job.clientId,
          type: "ADJUSTMENT",
          direction: "CREDIT",
          amountMilliFec,
          idempotencyKey: clientCreditKey,
          reference: job.id,
          metadata: { kind: "DISPUTE_REFUND_TO_CLIENT", jobId: job.id, disputeId },
          prisma: tx
        });

        await tx.job.update({
          where: { id: job.id },
          data: { status: JobStatus.CANCELLED }
        });
      } else {
        throw new BadRequestException("PARTIAL_SPLIT_NOT_IMPLEMENTED");
      }

      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: DisputeStatus.RESOLVED,
          resolutionType,
          resolvedByAdminId: adminUserId,
          resolvedAt: new Date()
        }
      });

      const recipients = [job.clientId, job.fixerId].filter(Boolean) as string[];
      await Promise.all(
        recipients.map((uid) =>
          this.notifications.create({
            userId: uid,
            type: "DISPUTE_RESOLVED" as any,
            title: "Dispute resolved",
            body:
              resolutionType === DisputeResolutionType.RELEASE_TO_FIXER
                ? "Admin resolved the dispute: funds released to fixer."
                : "Admin resolved the dispute: funds refunded to client.",
            data: { jobId: job.id, disputeId, resolutionType },
            idempotencyKey: `notify:dispute_resolved:${disputeId}:${uid}`,
            prisma: tx
          })
        )
      );

      return { ok: true, status: "RESOLVED" as const, resolutionType };
    });
  }
}