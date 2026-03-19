// Path: apps/api/src/modules/disputes/disputes.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import {
  DisputeResolutionType,
  DisputeStatus,
  JobStatus,
  WalletRole,
} from "@prisma/client";
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
        data: { jobId, openedByUserId: actorUserId, reason, evidence },
      });

      await tx.job.update({
        where: { id: jobId },
        data: { status: JobStatus.DISPUTED },
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
            prisma: tx,
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
      include: { job: true },
    });
    return { disputes };
  }
  // Path: apps/api/src/modules/disputes/disputes.service.ts
async resolveDisputeAmicably(args: { disputeId: string; adminUserId: string }) {
  const { disputeId, adminUserId } = args;

  return this.prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.findUnique({
      where: { id: disputeId },
      include: { job: true }
    });

    if (!dispute) throw new NotFoundException("DISPUTE_NOT_FOUND");

    if (dispute.status !== DisputeStatus.OPEN) {
      return { ok: true, status: dispute.status };
    }

    const job = dispute.job;
    if (!job) throw new BadRequestException("DISPUTE_JOB_MISSING");
    if (!job.fixerId) throw new BadRequestException("DISPUTE_JOB_FIXER_MISSING");

    await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        resolutionType: null,
        resolvedByAdminId: adminUserId,
        resolvedAt: new Date()
      }
    });

    await tx.job.update({
      where: { id: job.id },
      data: {
        status: JobStatus.IN_PROGRESS,
        completedRequestedAt: null
      }
    });

    await tx.jobCompletionRequest.updateMany({
      where: {
        jobId: job.id
      },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewNote: "Admin resolved dispute amicably. Fixer may request completion again."
      }
    });

    const recipients = [job.clientId, job.fixerId].filter(Boolean) as string[];

    await Promise.all(
      recipients.map((uid) =>
        this.notifications.create({
          userId: uid,
          type: "DISPUTE_RESOLVED" as any,
          title: "Dispute resolved amicably",
          body: "Admin resolved the dispute amicably. The fixer can request completion again.",
          data: {
            jobId: job.id,
            disputeId,
            mode: "AMICABLE"
          },
          idempotencyKey: `notify:dispute_resolved_amicably:${disputeId}:${uid}`,
          prisma: tx
        })
      )
    );

    return {
      ok: true,
      status: "RESOLVED" as const,
      mode: "AMICABLE" as const
    };
  });
}
async getAdminDisputeChat(args: { disputeId: string; take?: number }) {
  const take = Math.max(1, Math.min(args.take ?? 50, 100));

  const dispute = await this.prisma.dispute.findUnique({
    where: { id: args.disputeId },
    include: {
      job: {
        select: {
          id: true,
          clientId: true,
          fixerId: true,
        },
      },
    },
  });

  if (!dispute) throw new NotFoundException("DISPUTE_NOT_FOUND");
  if (!dispute.job?.fixerId) throw new BadRequestException("DISPUTE_JOB_FIXER_MISSING");

  const conversation = await this.prisma.conversation.findUnique({
    where: {
      jobId_fixerId: {
        jobId: dispute.job.id,
        fixerId: dispute.job.fixerId,
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take,
        include: {
          flags: true,
        },
      },
    },
  });

  if (!conversation) {
    return {
      dispute: {
        id: dispute.id,
        jobId: dispute.job.id,
      },
      conversation: null,
      messages: [],
    };
  }

  return {
    dispute: {
      id: dispute.id,
      jobId: dispute.job.id,
    },
    conversation: {
      id: conversation.id,
      jobId: conversation.jobId,
      fixerId: conversation.fixerId,
      status: conversation.status,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    },
    messages: conversation.messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt,
      flags: (m.flags ?? []).map((f) => ({
        id: f.id,
        type: f.type,
        matched: f.matched,
        createdAt: f.createdAt,
      })),
    })),
  };
}

async sendAdminDisputeChatMessage(args: {
  disputeId: string;
  adminUserId: string;
  body: string;
}) {
  const body = String(args.body ?? "").trim();
if (!body) throw new BadRequestException("MESSAGE_BODY_REQUIRED");

  const dispute = await this.prisma.dispute.findUnique({
    where: { id: args.disputeId },
    include: {
      job: {
        select: {
          id: true,
          clientId: true,
          fixerId: true,
          status: true,
        },
      },
    },
  });

  if (!dispute) throw new NotFoundException("DISPUTE_NOT_FOUND");
  if (!dispute.job?.fixerId) throw new BadRequestException("DISPUTE_JOB_FIXER_MISSING");

  const conversation = await this.prisma.conversation.findUnique({
    where: {
      jobId_fixerId: {
        jobId: dispute.job.id,
        fixerId: dispute.job.fixerId,
      },
    },
    include: {
      agreements: true,
    },
  });

  if (!conversation) throw new NotFoundException("DISPUTE_CHAT_NOT_FOUND");

  const adminMessageBody = `[ADMIN] ${body}`;

  const message = await this.prisma.chatMessage.create({
    data: {
      conversationId: conversation.id,
      senderId: dispute.job.clientId,
      body: adminMessageBody,
    },
  });

  const recipients = [dispute.job.clientId, dispute.job.fixerId].filter(Boolean) as string[];

  await Promise.all(
    recipients.map((uid) =>
      this.notifications.create({
        userId: uid,
        type: "DISPUTE_OPENED" as any,
        title: "Admin message in dispute chat",
        body: "Admin sent a message regarding your dispute.",
        idempotencyKey: `notify:admin_dispute_chat:${message.id}:${uid}`,
        data: {
          disputeId: dispute.id,
          jobId: dispute.job.id,
          conversationId: conversation.id,
          messageId: message.id,
        },
      })
    )
  );

  return {
    ok: true,
    conversationId: conversation.id,
    message: {
      id: message.id,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
    },
  };
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
        isActive: true,
      },
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
      create: { key, value: escrowUser.id },
    });

    return escrowUser.id;
  }

  private async getOrCreatePlatformWallet(tx: Prisma.TransactionClient) {
    let pw = await tx.platformWallet.findFirst();
    if (!pw) pw = await tx.platformWallet.create({ data: {} });
    return pw;
  }

  async resolveDispute(args: {
    disputeId: string;
    adminUserId: string;
    resolutionType: DisputeResolutionType;
  }) {
    const { disputeId, adminUserId, resolutionType } = args;

    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { job: true },
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
            resolvedAt: dispute.resolvedAt ?? new Date(),
          },
        });
        return { ok: true, status: "RESOLVED" as const };
      }

      if (resolutionType === DisputeResolutionType.RELEASE_TO_FIXER) {
        const commission = Math.floor(amountMilliFec * 0.1);
        const payout = amountMilliFec - commission;

        await this.ledger.addEntry({
          userId: escrowUserId,
          role: WalletRole.SYSTEM,
          type: "ADJUSTMENT",
          direction: "DEBIT",
          amountMilliFec,
          idempotencyKey: escrowDebitKey,
          reference: job.id,
          metadata: { kind: "DISPUTE_RELEASE_TO_FIXER", jobId: job.id, disputeId },
          prisma: tx,
        });

        await this.ledger.addEntry({
          userId: job.fixerId,
          role: WalletRole.FIXER,
          type: "JOB_PAYOUT",
          direction: "CREDIT",
          amountMilliFec: payout,
          idempotencyKey: fixerCreditKey,
          reference: job.id,
          metadata: {
            kind: "DISPUTE_RELEASE_TO_FIXER",
            jobId: job.id,
            disputeId,
            commissionMilliFec: commission,
          },
          prisma: tx,
        });

        const platformWallet = await this.getOrCreatePlatformWallet(tx);
        await tx.platformLedgerEntry.create({
          data: {
            platformWalletId: platformWallet.id,
            type: "COMMISSION",
            direction: "CREDIT",
            amountMilliFec: commission,
            idempotencyKey: platformCommissionKey,
            reference: job.id,
            metadata: {
              kind: "DISPUTE_RELEASE_TO_FIXER",
              jobId: job.id,
              disputeId,
              clientId: job.clientId,
              fixerId: job.fixerId,
            },
          },
        });

        await tx.platformWallet.update({
          where: { id: platformWallet.id },
          data: { balanceMilliFec: { increment: commission } },
        });

        await tx.job.update({
          where: { id: job.id },
          data: { status: JobStatus.COMPLETED, completedApprovedAt: new Date() },
        });
      } else if (resolutionType === DisputeResolutionType.REFUND_TO_CLIENT) {
        await this.ledger.addEntry({
          userId: escrowUserId,
          role: WalletRole.SYSTEM,
          type: "ADJUSTMENT",
          direction: "DEBIT",
          amountMilliFec,
          idempotencyKey: escrowDebitKey,
          reference: job.id,
          metadata: { kind: "DISPUTE_REFUND_TO_CLIENT", jobId: job.id, disputeId },
          prisma: tx,
        });

        await this.ledger.addEntry({
          userId: job.clientId,
          role: WalletRole.CLIENT,
          type: "ADJUSTMENT",
          direction: "CREDIT",
          amountMilliFec,
          idempotencyKey: clientCreditKey,
          reference: job.id,
          metadata: { kind: "DISPUTE_REFUND_TO_CLIENT", jobId: job.id, disputeId },
          prisma: tx,
        });

        await tx.job.update({
          where: { id: job.id },
          data: { status: JobStatus.CANCELLED },
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
          resolvedAt: new Date(),
        },
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
            prisma: tx,
          })
        )
      );

      return { ok: true, status: "RESOLVED" as const, resolutionType };
    });
  }
}