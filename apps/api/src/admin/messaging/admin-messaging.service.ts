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
}