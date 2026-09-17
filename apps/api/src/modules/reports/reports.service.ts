// apps/api/src/modules/reports/reports.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    reporterId: string;
    targetType: "JOB" | "CHAT_MESSAGE";
    targetId: string;
    reason: string;
    description?: string;
    jobId?: string;
    fixerId?: string;
  }) {
    return this.prisma.report.create({
      data: {
        reporterId: data.reporterId,
        targetType: data.targetType,
        targetId: data.targetId,
        reason: data.reason,
        description: data.description,
        jobId: data.jobId,
        fixerId: data.fixerId,
      },
    });
  }

  async findAll() {
    return this.prisma.report.findMany({
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findPending() {
    return this.prisma.report.findMany({
      where: { status: "PENDING" },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getInvestigation(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException("Report not found.");
    }

    const resolvedByAdmin = report.resolvedBy
      ? await this.prisma.admin.findUnique({
          where: { id: report.resolvedBy },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            isActive: true,
          },
        })
      : null;

    if (report.targetType === "JOB") {
      const job = await this.prisma.job.findUnique({
        where: { id: report.targetId },
        select: {
          id: true,
          clientId: true,
          fixerId: true,
          skillCategory: true,
          state: true,
          city: true,
          lga: true,
          area: true,
          priceMilliFec: true,
          lockedPriceMilliFec: true,
          status: true,
          moderationStatus: true,
          flaggedAt: true,
          flaggedByAdminId: true,
          flagReason: true,
          postingType: true,
          selectedConversationId: true,
          createdAt: true,
          updatedAt: true,
          completedRequestedAt: true,
          completedApprovedAt: true,
          client: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          fixer: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          applications: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              fixerId: true,
              status: true,
              note: true,
              createdAt: true,
              fixer: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  isActive: true,
                },
              },
            },
          },
          conversations: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              fixerId: true,
              status: true,
              active: true,
              createdAt: true,
              updatedAt: true,
              fixer: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  isActive: true,
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
              _count: {
                select: {
                  messages: true,
                  agreements: true,
                },
              },
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              type: true,
              amountMilliFec: true,
              paymentFeeMilliFec: true,
              status: true,
              paymentReference: true,
              conversationId: true,
              fixerId: true,
              lockedPriceMilliFec: true,
              paidAt: true,
              expiresAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          dispute: {
            select: {
              id: true,
              openedByUserId: true,
              reason: true,
              evidence: true,
              status: true,
              resolvedByAdminId: true,
              resolvedAt: true,
              createdAt: true,
              updatedAt: true,
              openedBy: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
              resolvedByAdmin: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  role: true,
                },
              },
            },
          },
          review: {
            select: {
              id: true,
              clientId: true,
              fixerId: true,
              rating: true,
              comment: true,
              createdAt: true,
            },
          },
          earnings: {
            select: {
              id: true,
              fixerId: true,
              amountMilliFec: true,
              availableMilliFec: true,
              status: true,
              paidAt: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          PlatformRevenue: {
            select: {
              id: true,
              grossMilliFec: true,
              platformFeeMilliFec: true,
              createdAt: true,
            },
          },
        },
      });

      return {
        report,
        resolvedByAdmin,
        target: {
          type: "JOB" as const,
          job,
        },
        relatedReports: await this.prisma.report.findMany({
          where: {
            targetType: "JOB",
            targetId: report.targetId,
            id: { not: report.id },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            reporterId: true,
            reason: true,
            description: true,
            status: true,
            resolvedBy: true,
            resolvedAt: true,
            createdAt: true,
          },
        }),
      };
    }

    const message = await this.prisma.chatMessage.findUnique({
      where: { id: report.targetId },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        body: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        conversation: {
          select: {
            id: true,
            jobId: true,
            fixerId: true,
            status: true,
            active: true,
            createdAt: true,
            updatedAt: true,
            fixer: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                isActive: true,
              },
            },
            job: {
              select: {
                id: true,
                clientId: true,
                fixerId: true,
                skillCategory: true,
                state: true,
                city: true,
                lga: true,
                area: true,
                priceMilliFec: true,
                lockedPriceMilliFec: true,
                status: true,
                moderationStatus: true,
                postingType: true,
                createdAt: true,
                updatedAt: true,
                client: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    isActive: true,
                  },
                },
                fixer: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const recentMessages = message
      ? await this.prisma.chatMessage.findMany({
          where: {
            conversationId: message.conversationId,
          },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            id: true,
            conversationId: true,
            senderId: true,
            body: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        })
      : [];

    return {
      report,
      resolvedByAdmin,
      target: {
        type: "CHAT_MESSAGE" as const,
        message,
        recentMessages,
      },
      relatedReports: message
        ? await this.prisma.report.findMany({
            where: {
              targetType: "CHAT_MESSAGE",
              targetId: report.targetId,
              id: { not: report.id },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
            select: {
              id: true,
              reporterId: true,
              reason: true,
              description: true,
              status: true,
              resolvedBy: true,
              resolvedAt: true,
              createdAt: true,
            },
          })
        : [],
    };
  }

  async resolve(id: string, resolvedByAdminId: string) {
    return this.prisma.report.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolvedBy: resolvedByAdminId,
        resolvedAt: new Date(),
      },
    });
  }

  async dismiss(id: string, resolvedByAdminId: string) {
    return this.prisma.report.update({
      where: { id },
      data: {
        status: "DISMISSED",
        resolvedBy: resolvedByAdminId,
        resolvedAt: new Date(),
      },
    });
  }
}
