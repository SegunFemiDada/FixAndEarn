import { Injectable } from "@nestjs/common";
import { PrismaService } from "../infra/prisma/prisma.service";

@Injectable()
export class ChatRepo {
  constructor(private readonly prisma: PrismaService) {}

  async getJob(jobId: string) {
    return this.prisma.job.findUnique({
      where: { id: jobId }
    });
  }

  async getJobWithApplicant(jobId: string, fixerId: string) {
    return this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: true,
        applications: { where: { fixerId } }
      }
    });
  }

  async findConversation(jobId: string, fixerId: string) {
    return this.prisma.conversation.findUnique({
      where: { jobId_fixerId: { jobId, fixerId } },
      include: { agreements: true, negotiation: true }
    });
  }

  async upsertConversation(jobId: string, fixerId: string) {
    return this.prisma.conversation.upsert({
      where: { jobId_fixerId: { jobId, fixerId } },
      update: {},
      create: { jobId, fixerId },
      include: { agreements: true, negotiation: true }
    });
  }

  async acceptAgreement(conversationId: string, userId: string, ip?: string, userAgent?: string) {
    return this.prisma.chatAgreement.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: { acceptedAt: new Date(), ip, userAgent },
      create: { conversationId, userId, ip, userAgent }
    });
  }

  async createMessage(conversationId: string, senderId: string, body: string) {
    return this.prisma.chatMessage.create({
      data: { conversationId, senderId, body }
    });
  }

  async createModerationFlags(messageId: string, flags: { type: any; matched?: string }[]) {
    if (!flags.length) return { count: 0 };
    return this.prisma.moderationFlag.createMany({
      data: flags.map((f) => ({ messageId, type: f.type, matched: f.matched })),
      skipDuplicates: true
    });
  }

  async ensureNegotiation(conversationId: string) {
    const existing = await this.prisma.negotiation.findUnique({ where: { conversationId } });
    if (existing) return existing;
    return this.prisma.negotiation.create({ data: { conversationId } });
  }

  async updateNegotiation(conversationId: string, data: any) {
    return this.prisma.negotiation.update({ where: { conversationId }, data });
  }

  async closeConversation(conversationId: string) {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "CLOSED" }
    });
  }

  async getConversationWithAgreements(conversationId: string) {
    return this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { agreements: true, negotiation: true, job: true, fixer: true }
    });
  }

  // ============
  // NEW: Listing
  // ============

  async listConversationsForJob(jobId: string, skip: number, take: number) {
    return this.prisma.conversation.findMany({
      where: { jobId },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      include: {
        fixer: { select: { id: true, fullName: true, email: true, isActive: true } },
        negotiation: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } }
      }
    });
  }

  async listMyConversations(userId: string, status: "OPEN" | "CLOSED" | undefined, skip: number, take: number) {
    return this.prisma.conversation.findMany({
      where: {
        ...(status ? { status } : {}),
        OR: [{ fixerId: userId }, { job: { clientId: userId } }]
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      include: {
        job: {
          select: {
            id: true,
            clientId: true,
            skillCategory: true,
            state: true,
            city: true,
            lga: true,
            area: true,
            status: true,
            priceMilliFec: true,
            lockedPriceMilliFec: true,
            createdAt: true
          }
        },
        fixer: { select: { id: true, fullName: true, isActive: true } },
        negotiation: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } }
      }
    });
  }

  // ==========================
  // NEW: Admin moderation feed
  // ==========================

  async listModerationFlags(type: any | undefined, skip: number, take: number) {
    return this.prisma.moderationFlag.findMany({
      where: {
        ...(type ? { type } : {})
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        message: {
          select: {
            id: true,
            body: true,
            createdAt: true,
            senderId: true,
            conversation: {
              select: {
                id: true,
                jobId: true,
                fixerId: true,
                status: true
              }
            }
          }
        }
      }
    });
  }
    async closeOtherConversationsForJob(jobId: string, keepConversationId: string) {
    return this.prisma.conversation.updateMany({
      where: {
        jobId,
        id: { not: keepConversationId },
        status: "OPEN"
      },
      data: { status: "CLOSED" }
    });
  }

  async getConversationByJobFixer(jobId: string, fixerId: string) {
    return this.prisma.conversation.findUnique({
      where: { jobId_fixerId: { jobId, fixerId } },
      include: {
        job: true,
        fixer: { select: { id: true, fullName: true, isActive: true } },
        agreements: true,
        negotiation: true
      }
    });
  }

  async getConversationMessages(conversationId: string, cursor: string | undefined, take: number) {
    // We fetch newest-first for efficiency, then reverse in service for UI if needed.
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1
          }
        : {}),
      include: {
        flags: true
      }
    });
  }

}
