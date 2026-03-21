import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import type { Prisma } from "@prisma/client";

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
      return {
        from: null,
        to: now,
        label: "All time",
      };
    }

    const from = new Date(now);

    if (range === "day") {
      from.setHours(0, 0, 0, 0);
      return {
        from,
        to: now,
        label: "Today",
      };
    }

    if (range === "week") {
      from.setDate(now.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      return {
        from,
        to: now,
        label: "Last 7 days",
      };
    }

    if (range === "month") {
      from.setDate(1);
      from.setHours(0, 0, 0, 0);
      return {
        from,
        to: now,
        label: "This month",
      };
    }

    from.setMonth(0, 1);
    from.setHours(0, 0, 0, 0);

    return {
      from,
      to: now,
      label: "This year",
    };
  }

  private buildCreatedAtWhere(from: Date | null, to: Date): Prisma.DateTimeFilter | undefined {
    if (!from) return undefined;

    return {
      gte: from,
      lte: to,
    };
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
      ledgerCommissionAgg,
      platformLedgerCommissionAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          roles: {
            some: {
              role: {
                code: "FIXER",
              },
            },
          },
        },
      }),
      this.prisma.user.count({
        where: {
          roles: {
            some: {
              role: {
                code: "CLIENT",
              },
            },
          },
        },
      }),
      this.prisma.user.findMany({
        select: {
          id: true,
          roles: {
            select: {
              roleId: true,
            },
          },
        },
      }),
      this.prisma.user.count({
        where: {
          isActive: true,
        },
      }),
      this.prisma.job.count({
        where: createdAtWhere ? { createdAt: createdAtWhere } : undefined,
      }),
      this.prisma.job.count({
        where: {
          status: "COMPLETED",
          ...(createdAtWhere ? { completedApprovedAt: createdAtWhere } : {}),
        },
      }),
      this.prisma.job.count({
        where: {
          status: "COMPLETED",
          dispute: null,
          ...(createdAtWhere ? { completedApprovedAt: createdAtWhere } : {}),
        },
      }),
      this.prisma.job.count({
        where: {
          status: "COMPLETED",
          dispute: {
            isNot: null,
          },
          ...(createdAtWhere ? { completedApprovedAt: createdAtWhere } : {}),
        },
      }),
      this.prisma.depositIntent.aggregate({
        _sum: {
          amountMilliFec: true,
        },
        where: {
          status: "SUCCEEDED",
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
      }),
      this.prisma.withdrawalRequest.aggregate({
        _sum: {
          amountMilliFec: true,
        },
        where: {
          status: {
            in: ["APPROVED", "PAID"],
          },
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
      }),
      this.prisma.ledgerEntry.aggregate({
        _sum: {
          amountMilliFec: true,
        },
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
        _sum: {
          amountMilliFec: true,
        },
        where: {
          type: "COMMISSION",
          direction: "CREDIT",
          wallet: {
            role: "SYSTEM",
          },
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
      }),
      this.prisma.platformLedgerEntry.aggregate({
        _sum: {
          amountMilliFec: true,
        },
        where: {
          type: "COMMISSION",
          direction: "CREDIT",
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
      }),
    ]);

    const totalSingleRoleUsers = usersForRoleProfile.filter((user) => user.roles.length === 1).length;
    const totalDualRoleUsers = usersForRoleProfile.filter((user) => user.roles.length > 1).length;

    const totalDepositsMilliFec = depositsAgg._sum.amountMilliFec ?? 0;
    const totalWithdrawalsMilliFec = withdrawalsAgg._sum.amountMilliFec ?? 0;
    const platformJobPostingFeesMilliFec = jobPostingFeesAgg._sum.amountMilliFec ?? 0;

    const ledgerCommissionMilliFec = ledgerCommissionAgg._sum.amountMilliFec ?? 0;
    const platformLedgerCommissionMilliFec = platformLedgerCommissionAgg._sum.amountMilliFec ?? 0;

    const platformCommissionMilliFec =
      ledgerCommissionMilliFec + platformLedgerCommissionMilliFec;

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

    const buckets: Array<{
      key: string;
      label: string;
      from: Date;
      to: Date;
    }> = [];

    if (range === "day") {
      for (let hour = 0; hour < 24; hour += 1) {
        const start = new Date(from);
        start.setHours(hour, 0, 0, 0);

        const end = new Date(start);
        end.setHours(hour + 1, 0, 0, 0);

        buckets.push({
          key: `${hour}`,
          label: `${String(hour).padStart(2, "0")}:00`,
          from: start,
          to: end,
        });
      }
    } else if (range === "week") {
      for (let i = 0; i < 7; i += 1) {
        const start = new Date(from);
        start.setDate(from.getDate() + i);
        start.setHours(0, 0, 0, 0);

        const end = new Date(start);
        end.setDate(start.getDate() + 1);

        buckets.push({
          key: start.toISOString(),
          label: new Intl.DateTimeFormat("en-NG", { weekday: "short" }).format(start),
          from: start,
          to: end,
        });
      }
    } else if (range === "month") {
      const daysInMonth = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day += 1) {
        const start = new Date(to.getFullYear(), to.getMonth(), day, 0, 0, 0, 0);
        const end = new Date(to.getFullYear(), to.getMonth(), day + 1, 0, 0, 0, 0);

        buckets.push({
          key: start.toISOString(),
          label: String(day),
          from: start,
          to: end,
        });
      }
    } else if (range === "year") {
      for (let month = 0; month < 12; month += 1) {
        const start = new Date(to.getFullYear(), month, 1, 0, 0, 0, 0);
        const end = new Date(to.getFullYear(), month + 1, 1, 0, 0, 0, 0);

        buckets.push({
          key: start.toISOString(),
          label: new Intl.DateTimeFormat("en-NG", { month: "short" }).format(start),
          from: start,
          to: end,
        });
      }
    } else {
      for (let year = from.getFullYear(); year <= to.getFullYear(); year += 1) {
        const start = new Date(year, 0, 1, 0, 0, 0, 0);
        const end = new Date(year + 1, 0, 1, 0, 0, 0, 0);

        buckets.push({
          key: String(year),
          label: String(year),
          from: start,
          to: end,
        });
      }
    }

    const results = await Promise.all(
      buckets.map(async (bucket) => {
        const [jobsPosted, jobsCompleted, depositsAgg, withdrawalsAgg] = await Promise.all([
          this.prisma.job.count({
            where: {
              createdAt: {
                gte: bucket.from,
                lt: bucket.to,
              },
            },
          }),
          this.prisma.job.count({
            where: {
              status: "COMPLETED",
              completedApprovedAt: {
                gte: bucket.from,
                lt: bucket.to,
              },
            },
          }),
          this.prisma.depositIntent.aggregate({
            _sum: {
              amountMilliFec: true,
            },
            where: {
              status: "SUCCEEDED",
              createdAt: {
                gte: bucket.from,
                lt: bucket.to,
              },
            },
          }),
          this.prisma.withdrawalRequest.aggregate({
            _sum: {
              amountMilliFec: true,
            },
            where: {
              status: {
                in: ["APPROVED", "PAID"],
              },
              createdAt: {
                gte: bucket.from,
                lt: bucket.to,
              },
            },
          }),
        ]);

        return {
          label: bucket.label,
          jobsPosted,
          jobsCompleted,
          depositsMilliFec: depositsAgg._sum.amountMilliFec ?? 0,
          withdrawalsMilliFec: withdrawalsAgg._sum.amountMilliFec ?? 0,
        };
      })
    );

    return results;
  }
}