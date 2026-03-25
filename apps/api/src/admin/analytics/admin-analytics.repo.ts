import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma, WithdrawalStatus, JobStatus } from "@prisma/client";

export type AdminAnalyticsRange = "day" | "week" | "month" | "year" | "all";

type PeriodBounds = {
  from: Date | null;
  to: Date;
  label: string;
};

@Injectable()
export class AdminAnalyticsRepo {
  constructor(private readonly prisma: PrismaService) {}

  getPeriod(range: AdminAnalyticsRange): PeriodBounds {
    const now = new Date();

    if (range === "all") {
      return { from: null, to: now, label: "All time" };
    }

    const from = new Date(now);

    if (range === "day") {
      from.setHours(0, 0, 0, 0);
      return { from, to: now, label: "Today" };
    }

    if (range === "week") {
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return { from, to: now, label: "Last 7 days" };
    }

    if (range === "month") {
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      return { from, to: now, label: "This month" };
    }

    from.setMonth(0, 1);
    from.setHours(0, 0, 0, 0);
    return { from, to: now, label: "This year" };
  }

  private buildCreatedAtWhere(from: Date | null, to: Date): Prisma.DateTimeFilter | undefined {
    if (!from) return undefined;
    return { gte: from, lte: to };
  }

  async getOverview(range: AdminAnalyticsRange) {
    const period = this.getPeriod(range);
    const createdAtWhere = this.buildCreatedAtWhere(period.from, period.to);

    const [
      totalUsers,
      totalFixers,
      totalClients,
      usersForRoleProfile,
      currentActiveUsers,
      totalJobsPosted,
      totalJobsCompletedOverall,
      totalJobsCompletedWithoutDispute,
      totalJobsCompletedWithDispute,
      depositsAgg,
      withdrawalsAgg,
      jobPostingFeesAgg,
      commissionAgg,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.user.count({
        where: { roles: { some: { role: { code: "FIXER" } } } },
      }),

      this.prisma.user.count({
        where: { roles: { some: { role: { code: "CLIENT" } } } },
      }),

      this.prisma.user.findMany({
        select: {
          id: true,
          roles: { select: { roleId: true } },
        },
      }),

      this.prisma.user.count({ where: { isActive: true } }),

      this.prisma.job.count({
        where: createdAtWhere ? { createdAt: createdAtWhere } : undefined,
      }),

      this.prisma.job.count({
        where: {
          status: JobStatus.COMPLETED,
          ...(createdAtWhere ? { completedApprovedAt: createdAtWhere } : {}),
        },
      }),

      this.prisma.job.count({
        where: {
          status: JobStatus.COMPLETED,
          dispute: null,
          ...(createdAtWhere ? { completedApprovedAt: createdAtWhere } : {}),
        },
      }),

      this.prisma.job.count({
        where: {
          status: JobStatus.COMPLETED,
          dispute: { isNot: null },
          ...(createdAtWhere ? { completedApprovedAt: createdAtWhere } : {}),
        },
      }),

      this.prisma.$queryRaw<{ sum: number | null }[]>`
        SELECT COALESCE(SUM("amountMilliFec"), 0) AS sum
        FROM "Deposit"
        WHERE status = 'SUCCEEDED'
        ${
          createdAtWhere
            ? Prisma.sql`AND "createdAt" >= ${createdAtWhere.gte} AND "createdAt" <= ${createdAtWhere.lte}`
            : Prisma.sql``
        }
      `,

      this.prisma.withdrawalRequest.aggregate({
        _sum: { amountMilliFec: true },
        where: {
          status: {
            in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID],
          },
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
      }),

      this.prisma.ledgerEntry.aggregate({
        _sum: { amountMilliFec: true },
        where: {
          type: "FEE",
          direction: "DEBIT",
          metadata: {
            path: ["kind"],
            equals: "JOB_POSTING_FEE",
          },
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
      }),

      this.prisma.ledgerEntry.aggregate({
        _sum: { amountMilliFec: true },
        where: {
          type: "COMMISSION",
          direction: "CREDIT",
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
      }),
    ]);

    const totalSingleRoleUsers = usersForRoleProfile.filter(
      (u: { roles: unknown[] }) => u.roles.length === 1
    ).length;

    const totalDualRoleUsers = usersForRoleProfile.filter(
      (u: { roles: unknown[] }) => u.roles.length > 1
    ).length;

    const totalDepositsMilliFec = Number(depositsAgg[0]?.sum ?? 0);
    const totalWithdrawalsMilliFec = withdrawalsAgg._sum.amountMilliFec ?? 0;
    const platformJobPostingFeesMilliFec = jobPostingFeesAgg._sum.amountMilliFec ?? 0;
    const platformCommissionMilliFec = commissionAgg._sum.amountMilliFec ?? 0;
    const totalPlatformFundsMilliFec =
      platformJobPostingFeesMilliFec + platformCommissionMilliFec;

    return {
      period,
      users: {
        totalUsers,
        totalFixers,
        totalClients,
        totalSingleRoleUsers,
        totalDualRoleUsers,
        currentActiveUsers,
      },
      jobs: {
        totalJobsPosted,
        totalJobsCompletedWithoutDispute,
        totalJobsCompletedWithDispute,
        totalJobsCompletedOverall,
      },
      finance: {
        totalDepositsMilliFec,
        totalWithdrawalsMilliFec,
        platformJobPostingFeesMilliFec,
        platformCommissionMilliFec,
        totalPlatformFundsMilliFec,
      },
    };
  }

  async getTimeline(range: AdminAnalyticsRange) {
    const period = this.getPeriod(range);
    const to = period.to;
    const from = period.from ?? new Date(to.getFullYear() - 5, 0, 1);

    const buckets: Array<{ label: string; from: Date; to: Date }> = [];

    if (range === "day") {
      for (let h = 0; h < 24; h++) {
        const start = new Date(from);
        start.setHours(h, 0, 0, 0);
        const end = new Date(start);
        end.setHours(h + 1);

        buckets.push({
          label: `${String(h).padStart(2, "0")}:00`,
          from: start,
          to: end,
        });
      }
    } else if (range === "week") {
      for (let i = 0; i < 7; i++) {
        const start = new Date(from);
        start.setDate(from.getDate() + i);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 1);

        buckets.push({
          label: new Intl.DateTimeFormat("en-NG", { weekday: "short" }).format(start),
          from: start,
          to: end,
        });
      }
    } else if (range === "month") {
      const days = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();

      for (let d = 1; d <= days; d++) {
        const start = new Date(to.getFullYear(), to.getMonth(), d);
        const end = new Date(to.getFullYear(), to.getMonth(), d + 1);

        buckets.push({
          label: String(d),
          from: start,
          to: end,
        });
      }
    } else {
      for (let y = from.getFullYear(); y <= to.getFullYear(); y++) {
        const start = new Date(y, 0, 1);
        const end = new Date(y + 1, 0, 1);

        buckets.push({
          label: String(y),
          from: start,
          to: end,
        });
      }
    }

    return Promise.all(
      buckets.map(async (b) => {
        const [jobsPosted, jobsCompleted, deposits, withdrawals] = await Promise.all([
          this.prisma.job.count({
            where: { createdAt: { gte: b.from, lt: b.to } },
          }),
          this.prisma.job.count({
            where: {
              status: JobStatus.COMPLETED,
              completedApprovedAt: { gte: b.from, lt: b.to },
            },
          }),
          this.prisma.$queryRaw<{ sum: number | null }[]>`
            SELECT COALESCE(SUM("amountMilliFec"), 0) AS sum
            FROM "Deposit"
            WHERE status = 'SUCCEEDED'
              AND "createdAt" >= ${b.from}
              AND "createdAt" < ${b.to}
          `,
          this.prisma.withdrawalRequest.aggregate({
            _sum: { amountMilliFec: true },
            where: {
              status: {
                in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID],
              },
              createdAt: { gte: b.from, lt: b.to },
            },
          }),
        ]);

        return {
          label: b.label,
          jobsPosted,
          jobsCompleted,
          depositsMilliFec: Number(deposits[0]?.sum ?? 0),
          withdrawalsMilliFec: withdrawals._sum.amountMilliFec ?? 0,
        };
      })
    );
  }
}