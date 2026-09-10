import { Injectable } from "@nestjs/common";
import { JobStatus, JobPostingType, Prisma } from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class AdminJobsRepo {
  constructor(private readonly prisma: PrismaService) {}

  async listJobs(args: {
    q?: string;
    status?: JobStatus;
    postingType?: JobPostingType;
    clientId?: string;
    fixerId?: string;
    skip: number;
    take: number;
  }) {
    const q = args.q?.trim();

    const where: Prisma.JobWhereInput = {};

    if (q) {
      where.OR = [
        {
          id: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          skillCategory: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          client: {
            is: {
              fullName: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        },
        {
          client: {
            is: {
              email: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        },
        {
          fixer: {
            is: {
              fullName: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        },
        {
          fixer: {
            is: {
              email: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        },
      ];
    }

    if (args.status) {
      where.status = args.status;
    }

    if (args.postingType) {
      where.postingType = args.postingType;
    }

    if (args.clientId?.trim()) {
      where.clientId = args.clientId.trim();
    }

    if (args.fixerId?.trim()) {
      where.fixerId = args.fixerId.trim();
    }

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: args.skip,
        take: args.take,
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
            },
          },

          fixer: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },

          _count: {
            select: {
              applications: true,
              conversations: true,
              payments: true,
            },
          },
        },
      }),

      this.prisma.job.count({
        where,
      }),
    ]);

    return {
      items: jobs,
      total,
      skip: args.skip,
      take: args.take,
    };
  }

  async getJob(jobId: string) {
    return this.prisma.job.findUnique({
      where: {
        id: jobId,
      },

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

        images: {
          orderBy: {
            sortOrder: "asc",
          },
          select: {
            id: true,
            imagePath: true,
            sortOrder: true,
            createdAt: true,
          },
        },

        applications: {
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            fixerId: true,
            note: true,
            status: true,
            createdAt: true,

            fixer: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },

        conversations: {
          orderBy: {
            createdAt: "desc",
          },
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
          orderBy: {
            createdAt: "desc",
          },
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

        completionRequest: {
          select: {
            id: true,
            fixerId: true,
            status: true,
            requestedAt: true,
            reviewedByClientId: true,
            reviewedAt: true,
            reviewNote: true,
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
  }
}