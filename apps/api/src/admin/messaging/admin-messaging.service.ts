//path: apps/api/src/admin/messaging/admin-messaging.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { NotificationType } from "@prisma/client";
import { AdminAuditService } from "../audit/admin-audit.service";
import { AdminMessagingRepo } from "./admin-messaging.repo";
import { NotificationsService } from "../../modules/notifications/notifications.service";

@Injectable()
export class AdminMessagingService {
  constructor(
    private readonly repo: AdminMessagingRepo,
    private readonly audit: AdminAuditService,
    private readonly notifications: NotificationsService
  ) {}

  private strikeKey(userId: string) {
    return `MODERATION_STRIKES:${userId}`;
  }

  private async getStrikeCount(userId: string) {
    const raw = await this.repo.getAppMetaValue(this.strikeKey(userId));
    const parsed = Number(raw ?? 0);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  private async incrementStrikeCount(userId: string) {
    const next = (await this.getStrikeCount(userId)) + 1;
    await this.repo.upsertAppMetaValue(this.strikeKey(userId), String(next));
    return next;
  }

  async listConversations(args: {
    jobId?: string;
    userId?: string;
    status?: "OPEN" | "CLOSED";
    flaggedOnly?: boolean;
    disputeLinkedOnly?: boolean;
    skip?: number;
    take?: number;
  }) {
    const skip = args.skip ?? 0;
    const take = Math.max(1, Math.min(args.take ?? 20, 100));

    const conversations = await this.repo.listConversations({
      jobId: args.jobId,
      userId: args.userId,
      status: args.status,
      flaggedOnly: Boolean(args.flaggedOnly),
      disputeLinkedOnly: Boolean(args.disputeLinkedOnly),
      skip,
      take,
    });

    return {
      skip,
      take,
      conversations,
    };
  }

  async getConversation(conversationId: string, take?: number) {
    const safeTake = Math.max(1, Math.min(take ?? 100, 200));
    const conversation = await this.repo.getConversationById(conversationId, safeTake);

    if (!conversation) {
      throw new NotFoundException("CONVERSATION_NOT_FOUND");
    }

    const clientStrikeCount = conversation.job?.client?.id
      ? await this.getStrikeCount(conversation.job.client.id)
      : 0;

    const fixerStrikeCount = conversation.job?.fixer?.id
      ? await this.getStrikeCount(conversation.job.fixer.id)
      : 0;

    return {
      conversation: {
        id: conversation.id,
        jobId: conversation.jobId,
        fixerId: conversation.fixerId,
        status: conversation.status,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
      job: conversation.job
        ? {
            id: conversation.job.id,
            clientId: conversation.job.clientId,
            fixerId: conversation.job.fixerId,
            status: conversation.job.status,
            lockedPriceMilliFec: conversation.job.lockedPriceMilliFec,
          }
        : null,
      participants: {
        client: conversation.job?.client
          ? {
              id: conversation.job.client.id,
              fullName: conversation.job.client.fullName,
              email: conversation.job.client.email,
              isActive: conversation.job.client.isActive,
              strikeCount: clientStrikeCount,
            }
          : null,
        fixer: conversation.job?.fixer
          ? {
              id: conversation.job.fixer.id,
              fullName: conversation.job.fixer.fullName,
              email: conversation.job.fixer.email,
              isActive: conversation.job.fixer.isActive,
              strikeCount: fixerStrikeCount,
            }
          : null,
      },
      dispute: conversation.job?.dispute
        ? {
            id: conversation.job.dispute.id,
            status: conversation.job.dispute.status,
            resolutionType: conversation.job.dispute.resolutionType,
            createdAt: conversation.job.dispute.createdAt,
            resolvedAt: conversation.job.dispute.resolvedAt,
          }
        : null,
      agreements: conversation.agreements.map((item) => ({
        id: item.id,
        userId: item.userId,
        acceptedAt: item.acceptedAt,
        ip: item.ip,
        userAgent: item.userAgent,
      })),
      negotiation: conversation.negotiation
        ? {
            id: conversation.negotiation.id,
            status: conversation.negotiation.status,
            proposedPriceMilliFec: conversation.negotiation.proposedPriceMilliFec,
            lockedPriceMilliFec: conversation.negotiation.lockedPriceMilliFec,
            lockedByUserId: conversation.negotiation.lockedByUserId,
            clientAcceptedAt: conversation.negotiation.clientAcceptedAt,
            fixerAcceptedAt: conversation.negotiation.fixerAcceptedAt,
            agreedAt: conversation.negotiation.agreedAt,
            rejectedAt: conversation.negotiation.rejectedAt,
            rejectedByUserId: conversation.negotiation.rejectedByUserId,
            createdAt: conversation.negotiation.createdAt,
            updatedAt: conversation.negotiation.updatedAt,
          }
        : null,
      messages: conversation.messages.map((message) => ({
        id: message.id,
        senderId: message.senderId,
        body: message.body,
        createdAt: message.createdAt,
        flags: (message.flags ?? []).map((flag) => ({
          id: flag.id,
          type: flag.type,
          matched: flag.matched,
          createdAt: flag.createdAt,
        })),
      })),
    };
  }

  async sendConversationMessage(args: {
    conversationId: string;
    adminId: string;
    body: string;
  }) {
    const body = String(args.body ?? "").trim();
    if (!body) throw new BadRequestException("MESSAGE_BODY_REQUIRED");

    const detail = await this.repo.getConversationById(args.conversationId, 1);
    if (!detail) throw new NotFoundException("CONVERSATION_NOT_FOUND");
    if (!detail.job?.clientId) throw new BadRequestException("CONVERSATION_CLIENT_MISSING");

    const adminMessageBody = `[ADMIN] ${body}`;

    const message = await this.repo.createAdminConversationMessage({
      conversationId: detail.id,
      senderId: detail.job.clientId,
      body: adminMessageBody,
    });

    const recipients = [detail.job.clientId, detail.fixerId].filter(Boolean) as string[];

    await Promise.all(
      recipients.map((userId) =>
        this.notifications.create({
          userId,
          type: NotificationType.DISPUTE_OPENED,
          title: "Admin message in chat",
          body: "Admin sent a message in your FixAndEarn conversation.",
          idempotencyKey: `notif:admin_messaging_intervention:${message.id}:${userId}`,
          data: {
            conversationId: detail.id,
            jobId: detail.jobId,
            messageId: message.id,
            disputeId: detail.job?.dispute?.id ?? null,
          },
        })
      )
    );

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "ADMIN_MESSAGING_INTERVENTION",
      description: "Admin sent intervention message into live conversation",
      metadata: {
        conversationId: detail.id,
        jobId: detail.jobId,
        disputeId: detail.job?.dispute?.id ?? null,
        messageId: message.id,
      },
    });

    return {
      ok: true,
      conversationId: detail.id,
      message: {
        id: message.id,
        senderId: message.senderId,
        body: message.body,
        createdAt: message.createdAt,
      },
    };
  }

  async warnConversationTargets(args: {
    conversationId: string;
    adminId: string;
    target: "CLIENT" | "FIXER" | "BOTH";
    reason?: string;
  }) {
    const detail = await this.repo.getConversationById(args.conversationId, 1);
    
    if (!detail) throw new NotFoundException("CONVERSATION_NOT_FOUND");
    await this.repo.reviewConversationFlags(
  detail.id,
  args.adminId,
  "REVIEWED",
);

    const targets: Array<{
      userId: string;
      role: "CLIENT" | "FIXER";
      fullName: string;
    }> = [];

    if ((args.target === "CLIENT" || args.target === "BOTH") && detail.job?.client) {
      targets.push({
        userId: detail.job.client.id,
        role: "CLIENT",
        fullName: detail.job.client.fullName,
      });
    }

    if ((args.target === "FIXER" || args.target === "BOTH") && detail.job?.fixer) {
      targets.push({
        userId: detail.job.fixer.id,
        role: "FIXER",
        fullName: detail.job.fixer.fullName,
      });
    }

    if (targets.length === 0) {
      throw new BadRequestException("NO_VALID_WARNING_TARGET");
    }

    const warnedUsers = await Promise.all(
      targets.map(async (target) => {
        const strikeCount = await this.incrementStrikeCount(target.userId);

        await this.notifications.create({
          userId: target.userId,
          type: NotificationType.DISPUTE_OPENED,
          title: "Policy warning",
          body:
            args.reason?.trim() ||
            "Your recent chat activity breached FixAndEarn policy. Continued violations may result in restrictions.",
          idempotencyKey: `notif:policy_warning:${args.conversationId}:${target.userId}:${strikeCount}`,
          data: {
            conversationId: detail.id,
            jobId: detail.jobId,
            strikeCount,
            targetRole: target.role,
            reason: args.reason?.trim() ?? null,
          },
        });

        return {
          userId: target.userId,
          role: target.role,
          strikeCount,
        };
      })
    );

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "ADMIN_MESSAGING_WARN",
      description: "Admin issued moderation warning",
      metadata: {
        conversationId: detail.id,
        jobId: detail.jobId,
        target: args.target,
        warnedUsers,
        reason: args.reason?.trim() ?? null,
      },
    });

    return {
      ok: true,
      warnedUsers,
    };
  }

  async restrictConversation(args: {
    conversationId: string;
    adminId: string;
    reason?: string;
  }) {
    const detail = await this.repo.getConversationById(args.conversationId, 1);
    if (!detail) throw new NotFoundException("CONVERSATION_NOT_FOUND");

    if (detail.status !== "CLOSED") {
      await this.repo.setConversationStatus(detail.id, "CLOSED");
      await this.repo.reviewConversationFlags(
  detail.id,
  args.adminId,
  "REVIEWED",
);
    }

    const recipients = [detail.job?.clientId, detail.job?.fixerId].filter(Boolean) as string[];

    await Promise.all(
      recipients.map((userId) =>
        this.notifications.create({
          userId,
          type: NotificationType.DISPUTE_OPENED,
          title: "Conversation restricted",
          body:
            args.reason?.trim() ||
            "This conversation has been restricted by FixAndEarn admin due to policy concerns.",
          idempotencyKey: `notif:conversation_restricted:${detail.id}:${userId}`,
          data: {
            conversationId: detail.id,
            jobId: detail.jobId,
            reason: args.reason?.trim() ?? null,
          },
        })
      )
    );

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "ADMIN_MESSAGING_RESTRICT_CONVERSATION",
      description: "Admin restricted conversation",
      metadata: {
        conversationId: detail.id,
        jobId: detail.jobId,
        reason: args.reason?.trim() ?? null,
      },
    });

    return {
      ok: true,
      status: "CLOSED" as const,
    };
  }

  async addUserStrike(args: {
    userId: string;
    adminId: string;
    reason?: string;
  }) {
    const strikeCount = await this.incrementStrikeCount(args.userId);

    await this.notifications.create({
      userId: args.userId,
      type: NotificationType.DISPUTE_OPENED,
      title: "Policy strike recorded",
      body:
        args.reason?.trim() ||
        "A moderation strike has been recorded against your account due to policy violations.",
      idempotencyKey: `notif:user_strike:${args.userId}:${strikeCount}`,
      data: {
        userId: args.userId,
        strikeCount,
        reason: args.reason?.trim() ?? null,
      },
    });

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "ADMIN_MESSAGING_ADD_STRIKE",
      description: "Admin added moderation strike to user",
      metadata: {
        userId: args.userId,
        strikeCount,
        reason: args.reason?.trim() ?? null,
      },
    });

    return {
      ok: true,
      userId: args.userId,
      strikeCount,
    };
  }

  async suspendUser(args: {
    userId: string;
    adminId: string;
    reason?: string;
  }) {
    const user = await this.repo.setUserActive(args.userId, false);

    await this.notifications.create({
      userId: user.id,
      type: NotificationType.DISPUTE_OPENED,
      title: "Account suspended",
      body:
        args.reason?.trim() ||
        "Your FixAndEarn account has been suspended pending further review.",
      idempotencyKey: `notif:user_suspended:${user.id}`,
      data: {
        userId: user.id,
        reason: args.reason?.trim() ?? null,
      },
    });

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "ADMIN_MESSAGING_SUSPEND_USER",
      description: "Admin suspended user from messaging oversight",
      metadata: {
        userId: user.id,
        reason: args.reason?.trim() ?? null,
      },
    });

    return {
      ok: true,
      userId: user.id,
      isActive: user.isActive,
    };
  }

  async unsuspendUser(args: {
    userId: string;
    adminId: string;
    reason?: string;
  }) {
    const user = await this.repo.setUserActive(args.userId, true);

    await this.notifications.create({
      userId: user.id,
      type: NotificationType.DISPUTE_RESOLVED,
      title: "Account restored",
      body:
        args.reason?.trim() ||
        "Your FixAndEarn account has been restored.",
      idempotencyKey: `notif:user_unsuspended:${user.id}`,
      data: {
        userId: user.id,
        reason: args.reason?.trim() ?? null,
      },
    });

    await this.audit.log({
      actorAdminId: args.adminId,
      action: "ADMIN_MESSAGING_UNSUSPEND_USER",
      description: "Admin restored suspended user",
      metadata: {
        userId: user.id,
        reason: args.reason?.trim() ?? null,
      },
    });

    return {
      ok: true,
      userId: user.id,
      isActive: user.isActive,
    };
  }
}