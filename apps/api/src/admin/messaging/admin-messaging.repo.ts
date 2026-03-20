import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import type { Prisma } from "@prisma/client";

@Injectable()
export class AdminMessagingRepo {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(args: {
    jobId?: string;
    userId?: string;
    status?: "OPEN" | "CLOSED";
    flaggedOnly?: boolean;
    disputeLinkedOnly?: boolean;
    skip: number;
    take: number;
  }) {
    const andWhere: Prisma.ConversationWhereInput[] = [];

    if (args.jobId?.trim()) {
      andWhere.push({
        jobId: args.jobId.trim(),
      });
    }

    if (args.status) {
      andWhere.push({
        status: args.status,
      });
    }

    if (args.userId?.trim()) {
      const userId = args.userId.trim();
      andWhere.push({
        OR: [{ fixerId: userId }, { job: { clientId: userId } }],
      });
    }

    if (args.flaggedOnly) {
      andWhere.push({
        messages: {
          some: {
            flags: {
              some: {},
            },
          },
        },
      });
    }

    if (args.disputeLinkedOnly) {
      andWhere.push({
        job: {
          dispute: {
            isNot: null,
          },
        },
      });
    }

    const where: Prisma.ConversationWhereInput =
      andWhere.length > 0 ? { AND: andWhere } : {};

    const conversations = await this.prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: args.skip,
      take: args.take,
      include: {
        job: {
          select: {
            id: true,
            clientId: true,
            fixerId: true,
            status: true,
            lockedPriceMilliFec: true,
            dispute: {
              select: {
                id: true,
                status: true,
                resolutionType: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            flags: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    const conversationIds = conversations.map((item) => item.id);

    const totalsByConversation = conversationIds.length
      ? await this.prisma.chatMessage.findMany({
          where: {
            conversationId: {
              in: conversationIds,
            },
          },
          select: {
            id: true,
            conversationId: true,
            flags: {
              select: {
                id: true,
              },
            },
          },
        })
      : [];

    const conversationFlagTotals = new Map<string, number>();
    for (const row of totalsByConversation) {
      const current = conversationFlagTotals.get(row.conversationId) ?? 0;
      conversationFlagTotals.set(row.conversationId, current + row.flags.length);
    }

    return conversations.map((conversation) => {
      const lastMessage = conversation.messages[0] ?? null;

      return {
        id: conversation.id,
        jobId: conversation.jobId,
        fixerId: conversation.fixerId,
        status: conversation.status,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messageCount: conversation._count.messages,
        flaggedMessageCount: conversationFlagTotals.get(conversation.id) ?? 0,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              body: lastMessage.body,
              createdAt: lastMessage.createdAt,
              flagCount: lastMessage.flags.length,
            }
          : null,
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
            }
          : null,
      };
    });
  }

  async getConversationById(conversationId: string, take: number) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        job: {
          select: {
            id: true,
            clientId: true,
            fixerId: true,
            status: true,
            lockedPriceMilliFec: true,
            client: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
              },
            },
            fixer: {
              select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
              },
            },
            dispute: {
              select: {
                id: true,
                status: true,
                resolutionType: true,
                createdAt: true,
                resolvedAt: true,
              },
            },
          },
        },
        agreements: {
          orderBy: { acceptedAt: "asc" },
          select: {
            id: true,
            userId: true,
            acceptedAt: true,
            ip: true,
            userAgent: true,
          },
        },
        negotiation: {
          select: {
            id: true,
            status: true,
            proposedPriceMilliFec: true,
            lockedPriceMilliFec: true,
            lockedByUserId: true,
            clientAcceptedAt: true,
            fixerAcceptedAt: true,
            agreedAt: true,
            rejectedAt: true,
            rejectedByUserId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          take,
          include: {
            flags: true,
          },
        },
      },
    });
  }

  async createAdminConversationMessage(args: {
    conversationId: string;
    senderId: string;
    body: string;
  }) {
    return this.prisma.chatMessage.create({
      data: {
        conversationId: args.conversationId,
        senderId: args.senderId,
        body: args.body,
      },
    });
  }

  async setConversationStatus(conversationId: string, status: "OPEN" | "CLOSED") {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status },
    });
  }

  async setUserActive(userId: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        isActive: true,
        email: true,
        fullName: true,
      },
    });
  }

  async getAppMetaValue(key: string) {
    const record = await this.prisma.appMeta.findUnique({
      where: { key },
      select: { value: true },
    });

    return record?.value ?? null;
  }

  async upsertAppMetaValue(key: string, value: string) {
    return this.prisma.appMeta.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
}