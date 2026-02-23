// Path: apps/api/src/chat/chat.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ChatRepo } from "./chat.repo";
import { ChatModerationService } from "./moderation/chat-moderation.service";
import { proposePrice, lockPrice, respondToLockedPrice } from "./negotiation/negotiation.machine";
import { PrismaService } from "../infra/prisma/prisma.service";
import { ListMyConversationsDto } from "./dto/list-my-conversations.dto";
import { ListJobConversationsDto } from "./dto/list-job-conversations.dto";
import { ListModerationFlagsDto } from "./dto/list-moderation-flags.dto";
import { WalletService } from "../modules/wallet/wallet.service";
import { LedgerService } from "../modules/wallet/ledger.service";
import type { Prisma } from "@prisma/client";
import { NotificationsService } from "../modules/notifications/notifications.service";
import { ChatRealtimeService } from "./realtime/chat-realtime.service";

type ActorRole = "CLIENT" | "FIXER";

@Injectable()
export class ChatService {
  constructor(
    private readonly repo: ChatRepo,
    private readonly moderation: ChatModerationService,
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly ledgerService: LedgerService,
    private readonly notifications: NotificationsService,
    private readonly realtime: ChatRealtimeService
  ) {}

  // Keep this aligned with JobsService
  private static readonly JOB_POST_FEE_MILLI_FEC = 1000;

  private assertUserActive(user: any) {
    if (!user?.isActive) throw new ForbiddenException("USER_INACTIVE");
  }

  // Messaging allowed when job is OPEN or IN_PROGRESS
  private assertJobMessagingAllowed(job: any) {
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");
    if (job.status === "CANCELLED" || job.status === "COMPLETED") {
      throw new ForbiddenException("JOB_NOT_CHATABLE");
    }
  }

  // Negotiation allowed only when job is OPEN
  private assertJobNegotiationAllowed(job: any) {
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");
    if (job.status !== "OPEN") {
      throw new ForbiddenException("NEGOTIATION_NOT_ALLOWED_FOR_JOB_STATUS");
    }
  }

  private assertMembership(job: any, userId: string, fixerId: string): ActorRole {
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    const isClient = job.clientId === userId;
    const isFixer = fixerId === userId;

    if (!isClient && !isFixer) throw new ForbiddenException("NOT_A_PARTICIPANT");
    return isClient ? "CLIENT" : "FIXER";
  }

  private assertFixerApplied(job: any, fixerId: string) {
    const applied = job.applications?.some((a: any) => a.fixerId === fixerId);
    if (!applied) throw new ForbiddenException("FIXER_HAS_NOT_APPLIED");
  }

  private assertAgreement(conversation: any, userId: string) {
    const ok = conversation.agreements?.some((a: any) => a.userId === userId);
    if (!ok) throw new ForbiddenException("CHAT_AGREEMENT_REQUIRED");
  }

  private async getOrCreateWalletForUser(userId: string, tx?: PrismaService | any) {
    const db = tx ?? this.prisma;

    let wallet = await db.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await db.wallet.create({ data: { userId, balanceMilliFec: 0 } });
    }
    return wallet;
  }

  private assertPositiveInt(n: number, msg: string) {
    if (!Number.isInteger(n) || n <= 0) throw new BadRequestException(msg);
  }

  /**
   * IMPORTANT:
   * - In negotiation we need: client can cover (locked/proposed price + 1FEC posting fee)
   * - Posting fee might already be debited in JobsService, but we still enforce this rule here
   *   to guarantee "smooth transaction" per your requirement.
   */
  private async assertClientCanAffordPricePlusPostFee(
    clientId: string,
    priceMilliFec: number,
    tx?: PrismaService | any
  ) {
    this.assertPositiveInt(priceMilliFec, "priceMilliFec must be a positive integer (milliFEC).");

    const wallet = await this.getOrCreateWalletForUser(clientId, tx);
    const required = priceMilliFec + ChatService.JOB_POST_FEE_MILLI_FEC;

    if (wallet.balanceMilliFec < required) {
      // keep message stable for frontend handling
      throw new ForbiddenException("CLIENT_INSUFFICIENT_WALLET_FOR_PRICE");
    }
  }

  /**
   * One-time escrow user + wallet, stored in AppMeta.
   * This avoids env config and keeps it deterministic per DB.
   */
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
      data: { userId: escrowUser.id, balanceMilliFec: 0 }
    });

    await tx.appMeta.upsert({
      where: { key },
      update: { value: escrowUser.id },
      create: { key, value: escrowUser.id }
    });

    return escrowUser.id;
  }

  private async escrowLockFunds(args: {
    tx: Prisma.TransactionClient;
    jobId: string;
    conversationId: string;
    clientId: string;
    fixerId: string;
    amountMilliFec: number;
  }) {
    const { tx, jobId, conversationId, clientId, fixerId, amountMilliFec } = args;

    const escrowUserId = await this.ensureEscrowUserId(tx);

    const debitKey = `escrow_lock:${jobId}:debit`;
    const creditKey = `escrow_lock:${jobId}:credit`;

    // If one exists without the other, do NOT proceed silently.
    // That indicates partial execution and should be investigated.
    const [alreadyDebited, alreadyCredited] = await Promise.all([
      tx.ledgerEntry.findUnique({ where: { idempotencyKey: debitKey } }),
      tx.ledgerEntry.findUnique({ where: { idempotencyKey: creditKey } })
    ]);

    if (alreadyDebited || alreadyCredited) {
      if (!(alreadyDebited && alreadyCredited)) {
        throw new BadRequestException("ESCROW_LOCK_INCONSISTENT_STATE");
      }
      return; // already done
    }

    // Use ONLY existing Prisma enum values.
    // Label escrow ops via metadata.kind.
    await this.ledgerService.addEntry({
      userId: clientId,
      type: "ADJUSTMENT",
      direction: "DEBIT",
      amountMilliFec,
      idempotencyKey: debitKey,
      reference: jobId,
      metadata: {
        kind: "ESCROW_LOCK",
        jobId,
        conversationId,
        clientId,
        fixerId
      },
      prisma: tx
    });
    await this.ledgerService.addEntry({
      userId: escrowUserId,
      type: "ADJUSTMENT",
      direction: "CREDIT",
      amountMilliFec,
      idempotencyKey: creditKey,
      reference: jobId,
      metadata: {
        kind: "ESCROW_LOCK",
        jobId,
        conversationId,
        clientId,
        fixerId
      },
      prisma: tx
    });
    
  }
  

  // =====================
  // Conversation list
  // =====================

  async listJobConversations(jobId: string, requesterId: string, q: ListJobConversationsDto) {
    const job = await this.repo.getJob(jobId);
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");
    if (job.clientId !== requesterId) throw new ForbiddenException("ONLY_JOB_OWNER");

    const skip = q.skip ?? 0;
    const take = q.take ?? 20;

    const rows = await this.repo.listConversationsForJob(jobId, skip, take);
    return rows.map((c) => ({
      conversationId: c.id,
      jobId: c.jobId,
      fixer: c.fixer,
      status: c.status,
      lastMessageAt: c.messages?.[0]?.createdAt ?? null,
      negotiation: c.negotiation
        ? {
            status: c.negotiation.status,
            proposedPriceMilliFec: c.negotiation.proposedPriceMilliFec,
            lockedPriceMilliFec: c.negotiation.lockedPriceMilliFec,
            clientAcceptedAt: c.negotiation.clientAcceptedAt,
            fixerAcceptedAt: c.negotiation.fixerAcceptedAt
          }
        : null,
      updatedAt: c.updatedAt
    }));
  }

  async listMyConversations(userId: string, q: ListMyConversationsDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 20;

    const rows = await this.repo.listMyConversations(userId, q.status, skip, take);
    return rows.map((c) => ({
      conversationId: c.id,
      status: c.status,
      lastMessageAt: c.messages?.[0]?.createdAt ?? null,
      job: c.job,
      fixer: c.fixer,
      negotiation: c.negotiation
        ? {
            status: c.negotiation.status,
            proposedPriceMilliFec: c.negotiation.proposedPriceMilliFec,
            lockedPriceMilliFec: c.negotiation.lockedPriceMilliFec,
            clientAcceptedAt: c.negotiation.clientAcceptedAt,
            fixerAcceptedAt: c.negotiation.fixerAcceptedAt
          }
        : null,
      updatedAt: c.updatedAt
    }));
  }

  // ==========================
  // Admin moderation flags
  // ==========================

  async listModerationFlags(q: ListModerationFlagsDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 50;

    const rows = await this.repo.listModerationFlags(q.type, skip, take);
    return rows.map((f) => ({
      id: f.id,
      type: f.type,
      matched: f.matched,
      createdAt: f.createdAt,
      message: {
        id: f.message.id,
        body: f.message.body,
        createdAt: f.message.createdAt,
        senderId: f.message.senderId
      },
      conversation: {
        id: f.message.conversation.id,
        jobId: f.message.conversation.jobId,
        fixerId: f.message.conversation.fixerId,
        status: f.message.conversation.status
      }
    }));
  }

  // =========================
  // Existing flows (tightened)
  // =========================

  // Conversation creation is negotiation-scoped, so job must still be OPEN
  async ensureConversation(jobId: string, fixerId: string) {
    const job = await this.repo.getJobWithApplicant(jobId, fixerId);
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    this.assertJobNegotiationAllowed(job);
    this.assertFixerApplied(job, fixerId);

    return this.repo.upsertConversation(jobId, fixerId);
  }

  async acceptAgreement(jobId: string, fixerId: string, userId: string, accepted: boolean, ip?: string, userAgent?: string) {
    if (!accepted) throw new BadRequestException("AGREEMENT_MUST_BE_ACCEPTED_TRUE");

    const job = await this.repo.getJobWithApplicant(jobId, fixerId);
    const role = this.assertMembership(job, userId, fixerId);

    this.assertJobMessagingAllowed(job);

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
    this.assertUserActive(user);

    if (role === "FIXER") this.assertFixerApplied(job, fixerId);

   const convo = await this.repo.upsertConversation(jobId, fixerId);

await this.repo.acceptAgreement(convo.id, userId);

// Emit AFTER write
this.realtime.emitToRoom(
  this.realtime.roomFor(jobId, fixerId),
  "agreement",
  {
    jobId,
    fixerId,
    conversationId: convo.id,
    userId
  }
);

return { ok: true };
  }

  async sendMessage(jobId: string, fixerId: string, userId: string, body: string, ip?: string, userAgent?: string) {
    const job = await this.repo.getJobWithApplicant(jobId, fixerId);
    const role = this.assertMembership(job, userId, fixerId);

    this.assertJobMessagingAllowed(job);

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
    this.assertUserActive(user);

    if (role === "FIXER") this.assertFixerApplied(job, fixerId);

    const convo = await this.repo.upsertConversation(jobId, fixerId);
    if (convo.status !== "OPEN") throw new ForbiddenException("CHAT_CLOSED");

    const convoFresh = await this.repo.getConversationWithAgreements(convo.id);
    this.assertAgreement(convoFresh, userId);

    const msg = await this.repo.createMessage(convo.id, userId, body);
    const hits = this.moderation.scan(body);
    await this.repo.createModerationFlags(
      msg.id,
      hits.map((h) => ({ type: h.type, matched: h.matched }))
    );
const room = this.realtime.roomFor(jobId, fixerId);
this.realtime.emitToRoom(room, "message:new", {
  jobId,
  fixerId,
  conversationId: convo.id,
  message: {
    id: msg.id,
    senderId: msg.senderId,
    body: msg.body,
    createdAt: msg.createdAt
  }
});
    return { id: msg.id, createdAt: msg.createdAt };
  }

  async propose(jobId: string, fixerId: string, userId: string, proposedPriceMilliFec: number) {
    const job = await this.repo.getJobWithApplicant(jobId, fixerId);
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    const role = this.assertMembership(job, userId, fixerId);

    // Client must be able to afford: proposed price + 1FEC posting fee
    await this.assertClientCanAffordPricePlusPostFee(job.clientId, proposedPriceMilliFec);

    this.assertJobNegotiationAllowed(job);

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
    this.assertUserActive(user);

    if (role === "FIXER") this.assertFixerApplied(job, fixerId);

    const convo = await this.repo.upsertConversation(jobId, fixerId);
    if (convo.status !== "OPEN") throw new ForbiddenException("CHAT_CLOSED");

    const convoFresh = await this.repo.getConversationWithAgreements(convo.id);
    this.assertAgreement(convoFresh, userId);

    const neg = await this.repo.ensureNegotiation(convo.id);
    const next = proposePrice(
      {
        status: neg.status,
        proposedPriceMilliFec: neg.proposedPriceMilliFec,
        lockedPriceMilliFec: neg.lockedPriceMilliFec,
        lockedByUserId: neg.lockedByUserId,
        clientAcceptedAt: neg.clientAcceptedAt,
        fixerAcceptedAt: neg.fixerAcceptedAt,
        agreedAt: neg.agreedAt,
        rejectedAt: neg.rejectedAt,
        rejectedByUserId: neg.rejectedByUserId
      },
      proposedPriceMilliFec
    );

    await this.repo.updateNegotiation(convo.id, {
      status: next.status,
      proposedPriceMilliFec: next.proposedPriceMilliFec
    });
    const room = this.realtime.roomFor(jobId, fixerId);
this.realtime.emitToRoom(room, "negotiation", { conversationId: convo.id });
    return { ok: true };
  }

  async lock(jobId: string, fixerId: string, userId: string, lockedPriceMilliFec: number) {
    const job = await this.repo.getJobWithApplicant(jobId, fixerId);
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    const role = this.assertMembership(job, userId, fixerId);

    this.assertJobNegotiationAllowed(job);

    // Client must be able to afford: locked price + 1FEC posting fee
    await this.assertClientCanAffordPricePlusPostFee(job.clientId, lockedPriceMilliFec);

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
    this.assertUserActive(user);

    if (role === "FIXER") this.assertFixerApplied(job, fixerId);

    const convo = await this.repo.upsertConversation(jobId, fixerId);
    if (convo.status !== "OPEN") throw new ForbiddenException("CHAT_CLOSED");

    const convoFresh = await this.repo.getConversationWithAgreements(convo.id);
    this.assertAgreement(convoFresh, userId);

    const neg = await this.repo.ensureNegotiation(convo.id);
    const next = lockPrice(
      {
        status: neg.status,
        proposedPriceMilliFec: neg.proposedPriceMilliFec,
        lockedPriceMilliFec: neg.lockedPriceMilliFec,
        lockedByUserId: neg.lockedByUserId,
        clientAcceptedAt: neg.clientAcceptedAt,
        fixerAcceptedAt: neg.fixerAcceptedAt,
        agreedAt: neg.agreedAt,
        rejectedAt: neg.rejectedAt,
        rejectedByUserId: neg.rejectedByUserId
      },
      lockedPriceMilliFec,
      userId
    );

    await this.repo.updateNegotiation(convo.id, {
      status: next.status,
      lockedPriceMilliFec: next.lockedPriceMilliFec,
      lockedByUserId: next.lockedByUserId,
      clientAcceptedAt: null,
      fixerAcceptedAt: null
    });

    return { ok: true };
  }

  async respondLocked(jobId: string, fixerId: string, userId: string, accept: boolean) {
    const job = await this.repo.getJobWithApplicant(jobId, fixerId);
    
    if (!job) throw new NotFoundException("JOB_NOT_FOUND");

    const role = this.assertMembership(job, userId, fixerId);

    this.assertJobNegotiationAllowed(job);

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
    this.assertUserActive(user);

    if (role === "FIXER") this.assertFixerApplied(job, fixerId);

    const convo = await this.repo.upsertConversation(jobId, fixerId);
    if (convo.status !== "OPEN") throw new ForbiddenException("CHAT_CLOSED");

    const convoFresh = await this.repo.getConversationWithAgreements(convo.id);
    this.assertAgreement(convoFresh, userId);

    const neg = await this.repo.ensureNegotiation(convo.id);

    const next = respondToLockedPrice(
      {
        status: neg.status,
        proposedPriceMilliFec: neg.proposedPriceMilliFec,
        lockedPriceMilliFec: neg.lockedPriceMilliFec,
        lockedByUserId: neg.lockedByUserId,
        clientAcceptedAt: neg.clientAcceptedAt,
        fixerAcceptedAt: neg.fixerAcceptedAt,
        agreedAt: neg.agreedAt,
        rejectedAt: neg.rejectedAt,
        rejectedByUserId: neg.rejectedByUserId
      },
      role,
      userId,
      accept,
      new Date()
    );

if (next.status === "AGREED") {
  const price = next.lockedPriceMilliFec;
  if (!price) throw new BadRequestException("MISSING_LOCKED_PRICE");

  await this.prisma.$transaction(async (tx) => {
    await this.assertClientCanAffordPricePlusPostFee(job.clientId, price, tx);

    await this.escrowLockFunds({
      tx,
      jobId,
      conversationId: convo.id,
      clientId: job.clientId,
      fixerId,
      amountMilliFec: price
    });

    await tx.negotiation.update({
      where: { conversationId: convo.id },
      data: {
        status: "AGREED",
        clientAcceptedAt: next.clientAcceptedAt ?? undefined,
        fixerAcceptedAt: next.fixerAcceptedAt ?? undefined,
        agreedAt: next.agreedAt ?? undefined
      }
    });

    await tx.job.update({
      where: { id: jobId },
      data: {
        status: "IN_PROGRESS",
        lockedPriceMilliFec: price,
        fixerId
      }
    });

    await tx.conversation.updateMany({
      where: {
        jobId,
        id: { not: convo.id },
        status: "OPEN"
      },
      data: { status: "CLOSED" }
    });

    await this.notifications.create({
      userId: job.clientId,
      type: "ESCROW_LOCKED",
      title: "Funds secured in escrow",
      body: "Your agreed job amount has been secured in escrow. Payment happens only after completion approval.",
      idempotencyKey: `notify:escrow_locked:${jobId}:${convo.id}`,
      data: { jobId, fixerId, amountMilliFec: price, conversationId: convo.id },
      prisma: tx
    });
  });

  // 🔥 Emit AFTER transaction commits
  const room = this.realtime.roomFor(jobId, fixerId);

  this.realtime.emitToRoom(room, "negotiation:agreed", {
    jobId,
    fixerId,
    conversationId: convo.id,
    amountMilliFec: price
  });

  this.realtime.emitToRoom(room, "job:status", {
    jobId,
    status: "IN_PROGRESS"
  });

  return { status: "AGREED" };
}

  if (next.status === "REJECTED") {
  await this.prisma.$transaction(async (tx) => {
    await tx.negotiation.update({
      where: { conversationId: convo.id },
      data: {
        status: "REJECTED",
        rejectedAt: next.rejectedAt ?? undefined,
        rejectedByUserId: next.rejectedByUserId ?? undefined
      }
    });

    await tx.conversation.update({
      where: { id: convo.id },
      data: { status: "CLOSED" }
    });
  });

  this.realtime.emitToRoom(
    this.realtime.roomFor(jobId, fixerId),
    "negotiation:rejected",
    { jobId, fixerId, conversationId: convo.id }
  );

  return { status: "REJECTED" };
}
await this.repo.updateNegotiation(convo.id, {
  status: next.status,
  clientAcceptedAt: next.clientAcceptedAt ?? undefined,
  fixerAcceptedAt: next.fixerAcceptedAt ?? undefined
});

this.realtime.emitToRoom(
  this.realtime.roomFor(jobId, fixerId),
  "negotiation:locked",
  { jobId, fixerId, conversationId: convo.id }
);

return { status: "LOCKED" };
  }

  async getConversationDetail(jobId: string, fixerId: string, requesterId: string, q: { cursor?: string; take?: number }) {
    const convo = await this.repo.getConversationByJobFixer(jobId, fixerId);
    if (!convo) throw new NotFoundException("CONVERSATION_NOT_FOUND");

    const isClient = convo.job.clientId === requesterId;
    const isFixer = convo.fixerId === requesterId;
    if (!isClient && !isFixer) throw new ForbiddenException("NOT_A_PARTICIPANT");

    this.assertJobMessagingAllowed(convo.job);

    const user = await this.prisma.user.findUnique({ where: { id: requesterId }, select: { isActive: true } });
    this.assertUserActive(user);

    const agreed = convo.agreements?.some((a: any) => a.userId === requesterId);
    if (!agreed) throw new ForbiddenException("CHAT_AGREEMENT_REQUIRED");

    const take = q.take ?? 30;
    const cursor = q.cursor;

    const msgs = await this.repo.getConversationMessages(convo.id, cursor, take);

    // Return oldest -> newest for sane UI rendering
    const messages = [...msgs].reverse().map((m: any) => ({
      id: m.id,
      senderId: m.senderId,
      body: m.body,
      createdAt: m.createdAt,
      flags: (m.flags ?? []).map((f: any) => ({
        id: f.id,
        type: f.type,
        matched: f.matched,
        createdAt: f.createdAt
      }))
    }));

    // nextCursor is the oldest message in the returned page
    const nextCursor = messages.length ? messages[0].id : null;

    return {
      conversation: {
        id: convo.id,
        status: convo.status,
        jobId: convo.jobId,
        fixerId: convo.fixerId,
        updatedAt: convo.updatedAt
      },
      job: {
        id: convo.job.id,
        clientId: convo.job.clientId,
        status: convo.job.status,
        skillCategory: convo.job.skillCategory,
        state: convo.job.state,
        city: convo.job.city,
        lga: convo.job.lga,
        area: convo.job.area,
        priceMilliFec: convo.job.priceMilliFec,
        lockedPriceMilliFec: convo.job.lockedPriceMilliFec
      },
      fixer: convo.fixer,
      negotiation: convo.negotiation
        ? {
            status: convo.negotiation.status,
            proposedPriceMilliFec: convo.negotiation.proposedPriceMilliFec,
            lockedPriceMilliFec: convo.negotiation.lockedPriceMilliFec,
            lockedByUserId: convo.negotiation.lockedByUserId,
            clientAcceptedAt: convo.negotiation.clientAcceptedAt,
            fixerAcceptedAt: convo.negotiation.fixerAcceptedAt,
            agreedAt: convo.negotiation.agreedAt,
            rejectedAt: convo.negotiation.rejectedAt,
            rejectedByUserId: convo.negotiation.rejectedByUserId
          }
        : null,
      messages,
      pagination: {
        nextCursor,
        take
      }
    };
  }
}