//path: apps/api/src/admin/dashboard/dashboard.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";

@Injectable()
export class DashboardRepo {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getUserStats() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const [
      totalUsers,
      activeUsers,
      newUsers,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.user.count({
        where: {
          isActive: true,
        },
      }),

      this.prisma.user.count({
        where: {
          createdAt: {
            gte: yesterday,
          },
        },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      newUsers,
    };
  }

  async getVerificationStats() {
    const [
      approved,
      pending,
      rejected,
    ] = await Promise.all([
      this.prisma.identityVerification.count({
        where: {
          status: "APPROVED",
        },
      }),

      this.prisma.identityVerification.count({
        where: {
          status: "PENDING",
        },
      }),

      this.prisma.identityVerification.count({
        where: {
          status: "REJECTED",
        },
      }),
    ]);

    return {
      approved,
      pending,
      rejected,
    };
  }

  async getJobStats() {
    const [
      open,
      inProgress,
      disputed,
      completed,
      cancelled,
    ] = await Promise.all([
      this.prisma.job.count({
        where: {
          status: "OPEN",
        },
      }),

      this.prisma.job.count({
        where: {
          status: "IN_PROGRESS",
        },
      }),

      this.prisma.job.count({
        where: {
          status: "DISPUTED",
        },
      }),

      this.prisma.job.count({
        where: {
          status: "COMPLETED",
        },
      }),

      this.prisma.job.count({
        where: {
          status: "CANCELLED",
        },
      }),
    ]);

    return {
      open,
      inProgress,
      disputed,
      completed,
      cancelled,
    };
  }

  async getDepositStats() {
    const [
      pending,
      succeeded,
      failed,
    ] = await Promise.all([
      this.prisma.deposit.count({
        where: {
          status: "PENDING",
        },
      }),

      this.prisma.deposit.count({
        where: {
          status: "SUCCEEDED",
        },
      }),

      this.prisma.deposit.count({
        where: {
          status: "FAILED",
        },
      }),
    ]);

    return {
      pending,
      succeeded,
      failed,
    };
  }

  async getWithdrawalStats() {
    const [
      pending,
      processing,
      paid,
      rejected,
      failed,
    ] = await Promise.all([
      this.prisma.withdrawalRequest.count({
        where: {
          status: "PENDING",
        },
      }),

      this.prisma.withdrawalRequest.count({
        where: {
          status: "PROCESSING",
        },
      }),

      this.prisma.withdrawalRequest.count({
        where: {
          status: "PAID",
        },
      }),

      this.prisma.withdrawalRequest.count({
        where: {
          status: "REJECTED",
        },
      }),

      this.prisma.withdrawalRequest.count({
        where: {
          status: "FAILED",
        },
      }),
    ]);

    return {
      pending,
      processing,
      paid,
      rejected,
      failed,
    };
  }

  async getReportStats() {
    const [
      pending,
      resolved,
      dismissed,
    ] = await Promise.all([
      this.prisma.report.count({
        where: {
          status: "PENDING",
        },
      }),

      this.prisma.report.count({
        where: {
          status: "RESOLVED",
        },
      }),

      this.prisma.report.count({
        where: {
          status: "DISMISSED",
        },
      }),
    ]);

    return {
      pending,
      resolved,
      dismissed,
    };
  }

  async getDisputeStats() {
    const [
      open,
      resolved,
    ] = await Promise.all([
      this.prisma.dispute.count({
        where: {
          status: "OPEN",
        },
      }),

      this.prisma.dispute.count({
        where: {
          status: "RESOLVED",
        },
      }),
    ]);

    return {
      open,
      resolved,
    };
  }

  async getAdminStats() {
    const now = new Date();

    const [
      activeAdmins,
      lockedAdmins,
      activeSessions,
    ] = await Promise.all([
      this.prisma.admin.count({
        where: {
          isActive: true,
        },
      }),

      this.prisma.admin.count({
        where: {
          lockedUntil: {
            gt: now,
          },
        },
      }),

      this.prisma.adminSession.count({
        where: {
          expiresAt: {
            gt: now,
          },
        },
      }),
    ]);

    return {
      activeAdmins,
      lockedAdmins,
      activeSessions,
    };
  }

  async getRecentActivity() {
    return this.prisma.adminAuditLog.findMany({
      take: 15,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}