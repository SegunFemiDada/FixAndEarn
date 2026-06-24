// Path: apps/api/src/chat/chat.service.ts

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { ChatRepo } from "./chat.repo";
import { ChatModerationService } from "./moderation/chat-moderation.service";
import {
  proposePrice,
  lockPrice,
  respondToLockedPrice
} from "./negotiation/negotiation.machine";
import { PrismaService } from "../infra/prisma/prisma.service";
import { ListMyConversationsDto } from "./dto/list-my-conversations.dto";
import { ListJobConversationsDto } from "./dto/list-job-conversations.dto";
import { ListModerationFlagsDto } from "./dto/list-moderation-flags.dto";
import { WalletService } from "../modules/wallet/wallet.service";
import { LedgerService } from "../modules/wallet/ledger.service";
import { WalletRole } from "@prisma/client";
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

  private static readonly JOB_POST_FEE_MILLI_FEC = 1000;

  private assertUserActive(user: { isActive?: boolean } | null | undefined) {
    if (!user?.isActive) {
      throw new ForbiddenException("USER_INACTIVE");
    }
  }

  private assertJobMessagingAllowed(job: any) {
    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    if (job.status === "CANCELLED" || job.status === "COMPLETED") {
      throw new ForbiddenException("MESSAGING_NOT_ALLOWED_FOR_JOB_STATUS");
    }
  }

  private assertJobNegotiationAllowed(job: any) {
    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    if (job.status !== "OPEN") {
      throw new ForbiddenException("NEGOTIATION_NOT_ALLOWED_FOR_JOB_STATUS");
    }
  }

  private assertMembership(
    job: any,
    userId: string,
    fixerId: string
  ): ActorRole {
    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    const isClient = job.clientId === userId;
    const isFixer = fixerId === userId;

    if (!isClient && !isFixer) {
      throw new ForbiddenException("NOT_A_PARTICIPANT");
    }

    return isClient ? "CLIENT" : "FIXER";
  }

  private assertFixerApplied(job: any, fixerId: string) {
    const applied = job.applications?.some(
      (a: any) => a.fixerId === fixerId
    );

    if (!applied) {
      throw new ForbiddenException("FIXER_HAS_NOT_APPLIED");
    }
  }

  private async getOrCreateWalletForUser(
    userId: string,
    role: WalletRole,
    tx?: PrismaService | Prisma.TransactionClient
  ) {
    const db = tx ?? this.prisma;

    let wallet = await db.wallet.findUnique({
      where: {
        userId_role: {
          userId,
          role
        }
      }
    });

    if (!wallet) {
      wallet = await db.wallet.create({
        data: {
          userId,
          role,
          balanceMilliFec: 0
        }
      });
    }

    return wallet;
  }

  private assertPositiveInt(n: number, msg: string) {
    if (!Number.isInteger(n) || n <= 0) {
      throw new BadRequestException(msg);
    }
  }

  private async assertClientCanAffordPricePlusPostFee(
    clientId: string,
    priceMilliFec: number,
    tx?: PrismaService | Prisma.TransactionClient
  ) {
    this.assertPositiveInt(
      priceMilliFec,
      "priceMilliFec must be a positive integer (milliFEC)."
    );

    const wallet = await this.getOrCreateWalletForUser(
      clientId,
      WalletRole.CLIENT,
      tx
    );

    const required =
      priceMilliFec + ChatService.JOB_POST_FEE_MILLI_FEC;

    if (wallet.balanceMilliFec < required) {
      throw new ForbiddenException(
        "CLIENT_INSUFFICIENT_WALLET_FOR_PRICE"
      );
    }
  }

  private async ensureEscrowUserId(
    tx: Prisma.TransactionClient
  ): Promise<string> {
    const key = "ESCROW_USER_ID";

    const meta = await tx.appMeta.findUnique({
      where: { key }
    });

    if (meta?.value) {
      return meta.value;
    }

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
        balanceMilliFec: 0
      }
    });

    await tx.appMeta.upsert({
      where: { key },
      update: { value: escrowUser.id },
      create: {
        key,
        value: escrowUser.id
      }
    });

    return escrowUser.id;
  }

  private async ensureAdminLiaisonUserId(
    tx?: Prisma.TransactionClient
  ): Promise<string> {
    const db = tx ?? this.prisma;

    const key = "ADMIN_LIAISON_USER_ID";

    const meta = await db.appMeta.findUnique({
      where: { key }
    });

    if (meta?.value) {
      return meta.value;
    }

    const adminUser = await db.user.create({
      data: {
        email: "admin.chat@fixandearn.internal",
        fullName: "FixAndEarn Admin",
        passwordHash: "DISABLED",
        isActive: true
      }
    });

    await db.appMeta.upsert({
      where: { key },
      update: { value: adminUser.id },
      create: {
        key,
        value: adminUser.id
      }
    });

    return adminUser.id;
  }

  private async escrowLockFunds(args: {
    tx: Prisma.TransactionClient;
    jobId: string;
    conversationId: string;
    clientId: string;
    fixerId: string;
    amountMilliFec: number;
  }) {
    const {
      tx,
      jobId,
      conversationId,
      clientId,
      fixerId,
      amountMilliFec
    } = args;

    const escrowUserId = await this.ensureEscrowUserId(tx);

    const debitKey = `escrow_lock:${jobId}:debit`;
    const creditKey = `escrow_lock:${jobId}:credit`;

    const [alreadyDebited, alreadyCredited] =
      await Promise.all([
        tx.ledgerEntry.findUnique({
          where: { idempotencyKey: debitKey }
        }),
        tx.ledgerEntry.findUnique({
          where: { idempotencyKey: creditKey }
        })
      ]);

    if (alreadyDebited || alreadyCredited) {
      if (!(alreadyDebited && alreadyCredited)) {
        throw new BadRequestException(
          "ESCROW_LOCK_INCONSISTENT_STATE"
        );
      }

      return;
    }

    await this.ledgerService.addEntry({
      userId: clientId,
      role: WalletRole.CLIENT,
      type: "ADJUSTMENT",
      direction: "DEBIT",
      amountMilliFec,
      idempotencyKey: debitKey,
      reference: jobId,
      metadata: {
        kind: "ESCROW_LOCK_DEBIT",
        jobId,
        conversationId,
        clientId,
        fixerId
      },
      prisma: tx
    });

    await this.ledgerService.addEntry({
      userId: escrowUserId,
      role: WalletRole.SYSTEM,
      type: "ADJUSTMENT",
      direction: "CREDIT",
      amountMilliFec,
      idempotencyKey: creditKey,
      reference: jobId,
      metadata: {
        kind: "ESCROW_LOCK_CREDIT",
        jobId,
        conversationId,
        clientId,
        fixerId
      },
      prisma: tx
    });
  }

  private async finalizeNegotiationAgreement(args: {
    tx: Prisma.TransactionClient;
    job: any;
    fixerId: string;
    conversationId: string;
    price: number;
    lockedByUserId: string;
  }) {
    const {
      tx,
      job,
      fixerId,
      conversationId,
      price,
      lockedByUserId
    } = args;

    await this.assertClientCanAffordPricePlusPostFee(
      job.clientId,
      price,
      tx
    );

    await this.escrowLockFunds({
      tx,
      jobId: job.id,
      conversationId,
      clientId: job.clientId,
      fixerId,
      amountMilliFec: price
    });

    await tx.negotiation.update({
      where: {
        conversationId
      },
      data: {
        status: "AGREED",
        agreedAt: new Date()
      }
    });

    await tx.job.update({
      where: {
        id: job.id
      },
      data: {
        status: "IN_PROGRESS",
        lockedPriceMilliFec: price,
        fixerId
      }
    });

    await tx.conversation.updateMany({
      where: {
        jobId: job.id,
        id: {
          not: conversationId
        },
        status: "OPEN"
      },
      data: {
        status: "CLOSED"
      }
    });

    await this.notifications.create({
      userId: job.clientId,
      type: "ESCROW_LOCKED",
      title: "Funds secured in escrow",
      body: "Job price has been locked and secured in escrow.",
      idempotencyKey: `notify:escrow_locked:${job.id}:${conversationId}:client`,
      data: {
        jobId: job.id,
        fixerId,
        amountMilliFec: price,
        conversationId,
        lockedByUserId
      },
      prisma: tx
    });

    await this.notifications.create({
      userId: fixerId,
      type: "ESCROW_LOCKED",
      title: "Funds secured in escrow",
      body: "Job price has been locked and secured in escrow.",
      idempotencyKey: `notify:escrow_locked:${job.id}:${conversationId}:fixer`,
      data: {
        jobId: job.id,
        amountMilliFec: price,
        conversationId,
        lockedByUserId
      },
      prisma: tx
    });
  }

  async listJobConversations(
    jobId: string,
    requesterId: string,
    q: ListJobConversationsDto
  ) {
    const job = await this.repo.getJob(jobId);

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    if (job.clientId !== requesterId) {
      throw new ForbiddenException("ONLY_JOB_OWNER");
    }

    const skip = q.skip ?? 0;
    const take = q.take ?? 20;

    const rows = await this.repo.listConversationsForJob(
      jobId,
      skip,
      take
    );

    return rows.map((c) => ({
      conversationId: c.id,
      jobId: c.jobId,
      fixer: c.fixer,
      status: c.status,
      lastMessageAt: c.messages?.[0]?.createdAt ?? null,
      negotiation: c.negotiation
        ? {
            status: c.negotiation.status,
            proposedPriceMilliFec:
              c.negotiation.proposedPriceMilliFec,
            lockedPriceMilliFec:
              c.negotiation.lockedPriceMilliFec,
            clientAcceptedAt:
              c.negotiation.clientAcceptedAt,
            fixerAcceptedAt:
              c.negotiation.fixerAcceptedAt
          }
        : null,
      updatedAt: c.updatedAt
    }));
  }

  async listMyConversations(
    userId: string,
    q: ListMyConversationsDto
  ) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 20;

    const rows = await this.repo.listMyConversations(
      userId,
      q.status,
      skip,
      take
    );

    return rows.map((c) => ({
      conversationId: c.id,
      status: c.status,
      lastMessageAt: c.messages?.[0]?.createdAt ?? null,
      job: c.job,
      fixer: c.fixer,
      negotiation: c.negotiation
        ? {
            status: c.negotiation.status,
            proposedPriceMilliFec:
              c.negotiation.proposedPriceMilliFec,
            lockedPriceMilliFec:
              c.negotiation.lockedPriceMilliFec,
            clientAcceptedAt:
              c.negotiation.clientAcceptedAt,
            fixerAcceptedAt:
              c.negotiation.fixerAcceptedAt
          }
        : null,
      updatedAt: c.updatedAt
    }));
  }

  async listModerationFlags(q: ListModerationFlagsDto) {
    const skip = q.skip ?? 0;
    const take = q.take ?? 50;

    const rows = await this.repo.listModerationFlags(
      q.type,
      skip,
      take
    );

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

  async ensureConversation(jobId: string, fixerId: string) {
    const job = await this.repo.getJobWithApplicant(
      jobId,
      fixerId
    );

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    this.assertJobNegotiationAllowed(job);
    this.assertFixerApplied(job, fixerId);

    return this.repo.upsertConversation(jobId, fixerId);
  }

  async acceptAgreement() {
    return {
      ok: true,
      deprecated: true
    };
  }

  async sendMessage(
    jobId: string,
    fixerId: string,
    userId: string,
    body: string,
    _ip?: string,
    _userAgent?: string
  ) {
    const job = await this.repo.getJobWithApplicant(
      jobId,
      fixerId
    );

    const role = this.assertMembership(
      job,
      userId,
      fixerId
    );

    this.assertJobMessagingAllowed(job);

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        isActive: true
      }
    });

    this.assertUserActive(user);

    if (role === "FIXER") {
      this.assertFixerApplied(job, fixerId);
    }

    const convo = await this.repo.upsertConversation(jobId, fixerId);

if (convo.status !== "OPEN") {
  throw new ForbiddenException("CHAT_CLOSED");
}

// NEW GATING LOGIC
if (!convo.active) {
  if (role === "CLIENT") {
    await this.repo.setConversationActive(convo.id, true);

    const room = this.realtime.roomFor(jobId, fixerId);
    this.realtime.emitToRoom(room, "conversation:activated", {
      jobId,
      fixerId,
      conversationId: convo.id,
    });
  } else {
    throw new ForbiddenException("FIXER_CANNOT_SEND_FIRST_MESSAGE");
  }
}
    const msg = await this.repo.createMessage(
      convo.id,
      userId,
      body
    );

    const hits = this.moderation.scan(body);

    await this.repo.createModerationFlags(
      msg.id,
      hits.map((h) => ({
        type: h.type,
        matched: h.matched
      }))
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

    return {
      id: msg.id,
      createdAt: msg.createdAt
    };
  }

  async propose(
    jobId: string,
    fixerId: string,
    userId: string,
    proposedPriceMilliFec: number
  ) {
    const job = await this.repo.getJobWithApplicant(
      jobId,
      fixerId
    );

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    const role = this.assertMembership(
      job,
      userId,
      fixerId
    );

    this.assertJobNegotiationAllowed(job);

    await this.assertClientCanAffordPricePlusPostFee(
      job.clientId,
      proposedPriceMilliFec
    );

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        isActive: true
      }
    });

    this.assertUserActive(user);

    if (role === "FIXER") {
      this.assertFixerApplied(job, fixerId);
    }

    const convo = await this.repo.upsertConversation(
      jobId,
      fixerId
    );

    if (convo.status !== "OPEN") {
      throw new ForbiddenException("CHAT_CLOSED");
    }

    const neg = await this.repo.ensureNegotiation(
      convo.id
    );

    if (neg.status === "AGREED") {
      throw new ForbiddenException(
        "PRICE_ALREADY_AGREED"
      );
    }

    const next = proposePrice(
      {
        status: neg.status,
        proposedPriceMilliFec:
          neg.proposedPriceMilliFec,
        lockedPriceMilliFec:
          neg.lockedPriceMilliFec,
        lockedByUserId: neg.lockedByUserId,
        clientAcceptedAt:
          neg.clientAcceptedAt,
        fixerAcceptedAt:
          neg.fixerAcceptedAt,
        agreedAt: neg.agreedAt,
        rejectedAt: neg.rejectedAt,
        rejectedByUserId:
          neg.rejectedByUserId
      },
      proposedPriceMilliFec
    );

    await this.repo.updateNegotiation(convo.id, {
      status: next.status,
      proposedPriceMilliFec:
        next.proposedPriceMilliFec,
      lockedPriceMilliFec: null,
      lockedByUserId: null,
      clientAcceptedAt: null,
      fixerAcceptedAt: null,
      agreedAt: null,
      rejectedAt: null,
      rejectedByUserId: null
    });

    const room = this.realtime.roomFor(
      jobId,
      fixerId
    );

    this.realtime.emitToRoom(
      room,
      "negotiation:proposed",
      {
        jobId,
        fixerId,
        conversationId: convo.id,
        proposedPriceMilliFec,
        proposedByUserId: userId
      }
    );

    return {
      ok: true
    };
  }

  async lock(
    jobId: string,
    fixerId: string,
    userId: string,
    lockedPriceMilliFec: number
  ) {
    const job = await this.repo.getJobWithApplicant(
      jobId,
      fixerId
    );

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    const role = this.assertMembership(
      job,
      userId,
      fixerId
    );

    this.assertJobNegotiationAllowed(job);

    await this.assertClientCanAffordPricePlusPostFee(
      job.clientId,
      lockedPriceMilliFec
    );

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        isActive: true
      }
    });

    this.assertUserActive(user);

    if (role === "FIXER") {
      this.assertFixerApplied(job, fixerId);
    }

    const convo = await this.repo.upsertConversation(
      jobId,
      fixerId
    );

    if (convo.status !== "OPEN") {
      throw new ForbiddenException("CHAT_CLOSED");
    }

    const neg = await this.repo.ensureNegotiation(
      convo.id
    );

    if (neg.status === "AGREED") {
      throw new ForbiddenException(
        "PRICE_ALREADY_AGREED"
      );
    }

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
  userId,
  role
);

    const autoAcceptedAt = new Date();

    await this.repo.updateNegotiation(convo.id, {
      status: next.status,
      lockedPriceMilliFec:
        next.lockedPriceMilliFec,
      lockedByUserId:
        next.lockedByUserId,
      clientAcceptedAt:
        role === "CLIENT"
          ? autoAcceptedAt
          : null,
      fixerAcceptedAt:
        role === "FIXER"
          ? autoAcceptedAt
          : null,
      agreedAt: null,
      rejectedAt: null,
      rejectedByUserId: null
    });

    const room = this.realtime.roomFor(
      jobId,
      fixerId
    );

    this.realtime.emitToRoom(
      room,
      "negotiation:locked",
      {
        jobId,
        fixerId,
        conversationId: convo.id,
        lockedPriceMilliFec,
        lockedByUserId: userId,
        autoAcceptedByLocker: true
      }
    );

    return {
      ok: true,
      status: "LOCKED",
      autoAccepted: true
    };
  }

  async respondToLockedPrice(
    jobId: string,
    fixerId: string,
    userId: string,
    accept: boolean
  ) {
    const job = await this.repo.getJobWithApplicant(
      jobId,
      fixerId
    );

    if (!job) {
      throw new NotFoundException("JOB_NOT_FOUND");
    }

    const role = this.assertMembership(
      job,
      userId,
      fixerId
    );

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId
      },
      select: {
        isActive: true
      }
    });

    this.assertUserActive(user);

    if (role === "FIXER") {
      this.assertFixerApplied(job, fixerId);
    }

    const convo = await this.repo.upsertConversation(
      jobId,
      fixerId
    );

    const neg = await this.repo.ensureNegotiation(
      convo.id
    );

    if (neg.status !== "LOCKED") {
      throw new BadRequestException(
        "PRICE_NOT_LOCKED"
      );
    }

    if (neg.lockedByUserId === userId) {
      throw new ForbiddenException(
        "LOCKER_ALREADY_AUTO_ACCEPTED"
      );
    }

    const next = respondToLockedPrice(
      {
        status: neg.status,
        proposedPriceMilliFec:
          neg.proposedPriceMilliFec,
        lockedPriceMilliFec:
          neg.lockedPriceMilliFec,
        lockedByUserId: neg.lockedByUserId,
        clientAcceptedAt:
          neg.clientAcceptedAt,
        fixerAcceptedAt:
          neg.fixerAcceptedAt,
        agreedAt: neg.agreedAt,
        rejectedAt: neg.rejectedAt,
        rejectedByUserId:
          neg.rejectedByUserId
      },
      role,
      userId,
      accept
    );

    await this.repo.updateNegotiation(convo.id, {
      status: next.status,
      clientAcceptedAt:
        next.clientAcceptedAt,
      fixerAcceptedAt:
        next.fixerAcceptedAt,
      agreedAt: next.agreedAt,
      rejectedAt: next.rejectedAt,
      rejectedByUserId:
        next.rejectedByUserId
    });

    const room = this.realtime.roomFor(
      jobId,
      fixerId
    );

    this.realtime.emitToRoom(
      room,
      "negotiation:response",
      {
        jobId,
        fixerId,
        conversationId: convo.id,
        userId,
        accept,
        status: next.status
      }
    );

    if (next.status === "AGREED") {
      const price = next.lockedPriceMilliFec;

      if (!price) {
        throw new BadRequestException(
          "MISSING_LOCKED_PRICE"
        );
      }

      await this.prisma.$transaction(async (tx) => {
        await this.finalizeNegotiationAgreement({
          tx,
          job,
          fixerId,
          conversationId: convo.id,
          price,
          lockedByUserId:
            next.lockedByUserId ?? userId
        });
      });

      this.realtime.emitToRoom(
        room,
        "negotiation:agreed",
        {
          jobId,
          fixerId,
          conversationId: convo.id,
          amountMilliFec: price
        }
      );

      this.realtime.emitToRoom(
        room,
        "job:status",
        {
          jobId,
          status: "IN_PROGRESS"
        }
      );
    }

    return {
      ok: true,
      status: next.status
    };
  }

  async getConversationDetail(
    jobId: string,
    fixerId: string,
    requesterId: string,
    q: {
      cursor?: string;
      take?: number;
    }
  ) {
    const convo =
  await this.repo.upsertConversation(
    jobId,
    fixerId
  );

    const isClient =
      convo.job.clientId === requesterId;

    const isFixer =
      convo.fixerId === requesterId;

    if (!isClient && !isFixer) {
      throw new ForbiddenException(
        "NOT_A_PARTICIPANT"
      );
    }

    this.assertJobMessagingAllowed(convo.job);

    const user = await this.prisma.user.findUnique({
      where: {
        id: requesterId
      },
      select: {
        isActive: true
      }
    });

    this.assertUserActive(user);

    const take = q.take ?? 30;
    const cursor = q.cursor;

    const msgs =
      await this.repo.getConversationMessages(
        convo.id,
        cursor,
        take
      );

    const messages = [...msgs]
      .reverse()
      .map((m: any) => ({
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

    const nextCursor = messages.length
      ? messages[0].id
      : null;

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
        skillCategory:
          convo.job.skillCategory,
        state: convo.job.state,
        city: convo.job.city,
        lga: convo.job.lga,
        area: convo.job.area,
        priceMilliFec:
          convo.job.priceMilliFec,
        lockedPriceMilliFec:
          convo.job.lockedPriceMilliFec
      },
      fixer: convo.fixer,
      negotiation: convo.negotiation
        ? {
            status: convo.negotiation.status,
            proposedPriceMilliFec:
              convo.negotiation
                .proposedPriceMilliFec,
            lockedPriceMilliFec:
              convo.negotiation
                .lockedPriceMilliFec,
            lockedByUserId:
              convo.negotiation
                .lockedByUserId,
            clientAcceptedAt:
              convo.negotiation
                .clientAcceptedAt,
            fixerAcceptedAt:
              convo.negotiation
                .fixerAcceptedAt,
            agreedAt:
              convo.negotiation.agreedAt,
            rejectedAt:
              convo.negotiation
                .rejectedAt,
            rejectedByUserId:
              convo.negotiation
                .rejectedByUserId
          }
        : null,
      messages,
      pagination: {
        nextCursor,
        take
      }
    };
  }

  async getDisputeConversationForAdmin(
    disputeId: string,
    q: {
      cursor?: string;
      take?: number;
    }
  ) {
    const dispute =
      await this.prisma.dispute.findUnique({
        where: {
          id: disputeId
        },
        include: {
          job: true
        }
      });

    if (!dispute) {
      throw new NotFoundException(
        "DISPUTE_NOT_FOUND"
      );
    }

    if (!dispute.job) {
      throw new NotFoundException(
        "DISPUTE_JOB_NOT_FOUND"
      );
    }

    if (!dispute.job.fixerId) {
      throw new BadRequestException(
        "DISPUTE_JOB_HAS_NO_FIXER"
      );
    }

    const convo =
      await this.repo.upsertConversation(
        dispute.job.id,
        dispute.job.fixerId
      );

    const detail =
      await this.getConversationDetailForAdminInternal(
        dispute.job.id,
        dispute.job.fixerId,
        q
      );

    return {
      dispute: {
        id: dispute.id,
        status: dispute.status,
        reason: dispute.reason,
        resolutionType:
          dispute.resolutionType,
        createdAt: dispute.createdAt,
        resolvedAt: dispute.resolvedAt
      },
      ...detail,
      conversation: {
        ...detail.conversation,
        id: convo.id
      }
    };
  }

  async sendAdminMessageToDispute(
    disputeId: string,
    adminId: string,
    body: string
  ) {
    const cleanBody = String(body ?? "").trim();

    if (!cleanBody) {
      throw new BadRequestException(
        "MESSAGE_BODY_REQUIRED"
      );
    }

    const dispute =
      await this.prisma.dispute.findUnique({
        where: {
          id: disputeId
        },
        include: {
          job: true
        }
      });

    if (!dispute) {
      throw new NotFoundException(
        "DISPUTE_NOT_FOUND"
      );
    }

    if (!dispute.job) {
      throw new NotFoundException(
        "DISPUTE_JOB_NOT_FOUND"
      );
    }

    if (!dispute.job.fixerId) {
      throw new BadRequestException(
        "DISPUTE_JOB_HAS_NO_FIXER"
      );
    }

    const liaisonUserId =
      await this.ensureAdminLiaisonUserId();

    const convo =
      await this.repo.upsertConversation(
        dispute.job.id,
        dispute.job.fixerId
      );

    if (convo.status !== "OPEN") {
      await this.repo.setConversationStatus(
        convo.id,
        "OPEN"
      );
    }

    const message =
      await this.repo.createMessage(
        convo.id,
        liaisonUserId,
        `[ADMIN] ${cleanBody}`
      );

    const room = this.realtime.roomFor(
      dispute.job.id,
      dispute.job.fixerId
    );

    this.realtime.emitToRoom(
      room,
      "message:new",
      {
        jobId: dispute.job.id,
        fixerId: dispute.job.fixerId,
        conversationId: convo.id,
        message: {
          id: message.id,
          senderId: message.senderId,
          body: message.body,
          createdAt: message.createdAt,
          adminId
        }
      }
    );

    return {
      ok: true,
      message: {
        id: message.id,
        senderId: message.senderId,
        body: message.body,
        createdAt: message.createdAt
      }
    };
  }

  private async getConversationDetailForAdminInternal(
    jobId: string,
    fixerId: string,
    q: {
      cursor?: string;
      take?: number;
    }
  ) {
    const convo =
      await this.repo.getConversationByJobFixer(
        jobId,
        fixerId
      );

    if (!convo) {
      throw new NotFoundException(
        "CONVERSATION_NOT_FOUND"
      );
    }

    const take = q.take ?? 30;
    const cursor = q.cursor;

    const msgs =
      await this.repo.getConversationMessages(
        convo.id,
        cursor,
        take
      );

    const messages = [...msgs]
      .reverse()
      .map((m: any) => ({
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

    const nextCursor = messages.length
      ? messages[0].id
      : null;

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
        skillCategory:
          convo.job.skillCategory,
        state: convo.job.state,
        city: convo.job.city,
        lga: convo.job.lga,
        area: convo.job.area,
        priceMilliFec:
          convo.job.priceMilliFec,
        lockedPriceMilliFec:
          convo.job.lockedPriceMilliFec
      },
      fixer: convo.fixer,
      negotiation: convo.negotiation
        ? {
            status: convo.negotiation.status,
            proposedPriceMilliFec:
              convo.negotiation
                .proposedPriceMilliFec,
            lockedPriceMilliFec:
              convo.negotiation
                .lockedPriceMilliFec,
            lockedByUserId:
              convo.negotiation
                .lockedByUserId,
            clientAcceptedAt:
              convo.negotiation
                .clientAcceptedAt,
            fixerAcceptedAt:
              convo.negotiation
                .fixerAcceptedAt,
            agreedAt:
              convo.negotiation.agreedAt,
            rejectedAt:
              convo.negotiation
                .rejectedAt,
            rejectedByUserId:
              convo.negotiation
                .rejectedByUserId
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