import { Injectable } from "@nestjs/common";
import {
  JobPaymentStatus,
  JobPaymentType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class AdminPaymentsRepo {
  constructor(private readonly prisma: PrismaService) {}

  async listPayments(args: {
    q?: string;
    status?: JobPaymentStatus;
    type?: JobPaymentType;
    jobId?: string;
    clientId?: string;
    fixerId?: string;
    skip: number;
    take: number;
  }) {
    const q = args.q?.trim();

    const where: Prisma.JobPaymentWhereInput = {};

    if (q) {
      where.OR = [
        {
          id: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          paymentReference: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          jobId: {
            contains: q,
            mode: "insensitive",
          },
        },
        {
          job: {
            is: {
              skillCategory: {
                contains: q,
                mode: "insensitive",
              },
            },
          },
        },
        {
          job: {
            is: {
              client: {
                is: {
                  fullName: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        },
        {
          job: {
            is: {
              client: {
                is: {
                  email: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        },
        {
          job: {
            is: {
              fixer: {
                is: {
                  fullName: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        },
        {
          job: {
            is: {
              fixer: {
                is: {
                  email: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              },
            },
          },
        },
      ];
    }

    if (args.status) {
      where.status = args.status;
    }

    if (args.type) {
      where.type = args.type;
    }

    if (args.jobId?.trim()) {
      where.jobId = args.jobId.trim();
    }

    if (args.clientId?.trim()) {
      where.job = {
        is: {
          clientId: args.clientId.trim(),
        },
      };
    }

    if (args.fixerId?.trim()) {
      where.fixerId = args.fixerId.trim();
    }

    const [payments, total] = await Promise.all([
      this.prisma.jobPayment.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip: args.skip,
        take: args.take,

        select: {
          id: true,
          jobId: true,
          amountMilliFec: true,
          paymentFeeMilliFec: true,
          status: true,
          paidAt: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
          paymentReference: true,
          type: true,
          conversationId: true,
          fixerId: true,
          lockedPriceMilliFec: true,

          job: {
            select: {
              id: true,
              skillCategory: true,
              status: true,
              postingType: true,
              clientId: true,
              fixerId: true,

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
            },
          },
        },
      }),

      this.prisma.jobPayment.count({
        where,
      }),
    ]);

    return {
      items: payments,
      total,
      skip: args.skip,
      take: args.take,
    };
  }

  async getPayment(id: string) {
    return this.prisma.jobPayment.findUnique({
      where: {
        id,
      },

      select: {
        id: true,
        jobId: true,
        amountMilliFec: true,
        paymentFeeMilliFec: true,
        status: true,
        paidAt: true,
        expiresAt: true,
        createdAt: true,
        updatedAt: true,
        paymentReference: true,
        type: true,
        conversationId: true,
        fixerId: true,
        lockedPriceMilliFec: true,

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

            dispute: {
              select: {
                id: true,
                status: true,
                reason: true,
                resolutionType: true,
                resolvedAt: true,
              },
            },

            completionRequest: {
              select: {
                id: true,
                status: true,
                requestedAt: true,
                reviewedAt: true,
                reviewedByClientId: true,
                reviewNote: true,
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

            conversations: {
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
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}