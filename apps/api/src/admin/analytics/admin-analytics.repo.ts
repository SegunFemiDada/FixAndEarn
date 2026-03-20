import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { WalletRole } from "@prisma/client";

@Injectable()
export class AdminAnalyticsRepo {
  constructor(private readonly prisma: PrismaService) {}

  async countTotalUsers() {
    return this.prisma.user.count();
  }

  async countUsersWithRole(code: "CLIENT" | "FIXER") {
    return this.prisma.user.count({
      where: {
        roles: {
          some: {
            role: {
              code,
            },
          },
        },
      },
    });
  }

  async countSingleRoleUsers() {
    const grouped = await this.prisma.userRole.groupBy({
      by: ["userId"],
      _count: {
        roleId: true,
      },
    });

    return grouped.filter((item) => item._count.roleId === 1).length;
  }

  async countDualRoleUsers() {
    const grouped = await this.prisma.userRole.groupBy({
      by: ["userId"],
      _count: {
        roleId: true,
      },
    });

    return grouped.filter((item) => item._count.roleId >= 2).length;
  }

  async countActiveUsers() {
    return this.prisma.user.count({
      where: {
        isActive: true,
      },
    });
  }

  async countJobsPosted(from?: Date, to?: Date) {
    return this.prisma.job.count({
      where: {
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lt: to } : {}),
              },
            }
          : {}),
      },
    });
  }

  async countCompletedJobsOverall(from?: Date, to?: Date) {
    return this.prisma.job.count({
      where: {
        status: "COMPLETED",
        completedApprovedAt: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lt: to } : {}),
        },
      },
    });
  }

  async countCompletedJobsWithoutDispute(from?: Date, to?: Date) {
    return this.prisma.job.count({
      where: {
        status: "COMPLETED",
        completedApprovedAt: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lt: to } : {}),
        },
        dispute: null,
      },
    });
  }

  async countCompletedJobsWithDispute(from?: Date, to?: Date) {
    return this.prisma.job.count({
      where: {
        status: "COMPLETED",
        completedApprovedAt: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lt: to } : {}),
        },
        dispute: {
          isNot: null,
        },
      },
    });
  }

  async sumSucceededDeposits(from?: Date, to?: Date) {
    const result = await this.prisma.depositIntent.aggregate({
      where: {
        status: "SUCCEEDED",
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lt: to } : {}),
              },
            }
          : {}),
      },
      _sum: {
        amountMilliFec: true,
      },
    });

    return result._sum.amountMilliFec ?? 0;
  }

  async sumPaidWithdrawals(from?: Date, to?: Date) {
    const result = await this.prisma.withdrawalRequest.aggregate({
      where: {
        status: "PAID",
        ...(from || to
          ? {
              paidAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lt: to } : {}),
              },
            }
          : {}),
      },
      _sum: {
        amountMilliFec: true,
      },
    });

    return result._sum.amountMilliFec ?? 0;
  }

  async sumJobPostingFees(from?: Date, to?: Date) {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: {
        type: "FEE",
        direction: "DEBIT",
        metadata: {
          path: ["kind"],
          equals: "JOB_POSTING_FEE",
        },
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lt: to } : {}),
              },
            }
          : {}),
      },
      _sum: {
        amountMilliFec: true,
      },
    });

    return result._sum.amountMilliFec ?? 0;
  }

  async getPlatformUserId() {
    const meta = await this.prisma.appMeta.findUnique({
      where: { key: "PLATFORM_USER_ID" },
      select: { value: true },
    });

    return meta?.value ?? null;
  }

  async sumPlatformCommission(from?: Date, to?: Date) {
    const platformUserId = await this.getPlatformUserId();
    if (!platformUserId) return 0;

    const platformWallet = await this.prisma.wallet.findUnique({
      where: {
        userId_role: {
          userId: platformUserId,
          role: WalletRole.SYSTEM,
        },
      },
      select: {
        id: true,
      },
    });

    if (!platformWallet) return 0;

    const result = await this.prisma.ledgerEntry.aggregate({
      where: {
        walletId: platformWallet.id,
        type: "COMMISSION",
        direction: "CREDIT",
        ...(from || to
          ? {
              createdAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lt: to } : {}),
              },
            }
          : {}),
      },
      _sum: {
        amountMilliFec: true,
      },
    });

    return result._sum.amountMilliFec ?? 0;
  }

  async getPlatformFundsBalance() {
    const platformUserId = await this.getPlatformUserId();
    if (!platformUserId) return 0;

    const wallet = await this.prisma.wallet.findUnique({
      where: {
        userId_role: {
          userId: platformUserId,
          role: WalletRole.SYSTEM,
        },
      },
      select: {
        balanceMilliFec: true,
      },
    });

    return wallet?.balanceMilliFec ?? 0;
  }
}