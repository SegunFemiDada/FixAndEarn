// Path: apps/api/src/admin/analytics/admin-analytics.repo.ts
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { Prisma, WithdrawalStatus, JobStatus } from "@prisma/client";

export type AdminAnalyticsRange = "day" | "week" | "month" | "year" | "all";

type PeriodBounds = {
  from: Date | null;
  to: Date;
  label: string;
};

type TimelineBucket = {
  label: string;
  from: Date;
  to: Date;
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

  private buildDateWhere(
    from: Date | null,
    to: Date
  ): Prisma.DateTimeFilter | undefined {
    if (!from) return undefined;
    return { gte: from, lte: to };
  }

  private buildDateWhereLt(
    from: Date | null,
    to: Date
  ): Prisma.DateTimeFilter | undefined {
    if (!from) return undefined;
    return { gte: from, lt: to };
  }

  private async getRoleUserIds(roleCode: "CLIENT" | "FIXER"): Promise<string[]> {
    const rows = await this.prisma.userRole.findMany({
      where: {
        role: {
          code: roleCode,
        },
      },
      select: {
        userId: true,
      },
    });

    return rows.map((row) => row.userId);
  }

  private buildTimelineBuckets(range: AdminAnalyticsRange): TimelineBucket[] {
    const period = this.getPeriod(range);
    const to = period.to;
    const from = period.from ?? new Date(to.getFullYear() - 4, 0, 1);

    const buckets: TimelineBucket[] = [];

    if (range === "day") {
      for (let h = 0; h < 24; h += 1) {
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

      return buckets;
    }

    if (range === "week") {
      for (let i = 0; i < 7; i += 1) {
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

      return buckets;
    }

    if (range === "month") {
      const days = new Date(to.getFullYear(), to.getMonth() + 1, 0).getDate();

      for (let d = 1; d <= days; d += 1) {
        const start = new Date(to.getFullYear(), to.getMonth(), d);
        const end = new Date(to.getFullYear(), to.getMonth(), d + 1);

        buckets.push({
          label: String(d),
          from: start,
          to: end,
        });
      }

      return buckets;
    }

    if (range === "year") {
      for (let m = 0; m < 12; m += 1) {
        const start = new Date(to.getFullYear(), m, 1);
        const end = new Date(to.getFullYear(), m + 1, 1);

        buckets.push({
          label: new Intl.DateTimeFormat("en-NG", { month: "short" }).format(start),
          from: start,
          to: end,
        });
      }

      return buckets;
    }

    for (let y = from.getFullYear(); y <= to.getFullYear(); y += 1) {
      const start = new Date(y, 0, 1);
      const end = new Date(y + 1, 0, 1);

      buckets.push({
        label: String(y),
        from: start,
        to: end,
      });
    }

    return buckets;
  }

  async getOverview(range: AdminAnalyticsRange) {
    const period = this.getPeriod(range);
    const createdAtWhere = this.buildDateWhere(period.from, period.to);

    const [clientUserIds, fixerUserIds] = await Promise.all([
      this.getRoleUserIds("CLIENT"),
      this.getRoleUserIds("FIXER"),
    ]);

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
      totalDepositsMilliFecRows,
      withdrawalsAgg,
      jobPostingFeesAgg,
      platformCommissionAgg,
      urgentHireFeesAgg,
      registrationsInRange,
      activeClientRows,
      activeWorkingFixerRows,
      applyingOnlyFixerRows,
      clientsWithOpenJobsRows,
      clientsWithCompletedJobsRows,
      clientsWhoNeverPostedRows,
    ] = await Promise.all([
      this.prisma.user.count(),

      this.prisma.user.count({
        where: {
          roles: {
            some: {
              role: { code: "FIXER" },
            },
          },
        },
      }),

      this.prisma.user.count({
        where: {
          roles: {
            some: {
              role: { code: "CLIENT" },
            },
          },
        },
      }),

      this.prisma.user.findMany({
        select: {
          id: true,
          roles: {
            select: { roleId: true },
          },
        },
      }),

      this.prisma.user.count({
        where: { isActive: true },
      }),

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

      this.prisma.jobPayment.aggregate({
  _sum: {
    amountMilliFec: true,
  },
  where: {
    type: "POSTING",
    status: "SUCCESS",
    ...(createdAtWhere
      ? {
          paidAt: createdAtWhere,
        }
      : {}),
  },
}),

      this.prisma.platformLedgerEntry.aggregate({
  _sum: {
    amountMilliFec: true,
  },
  where: {
    type: "COMMISSION",
    direction: "CREDIT",
    ...(createdAtWhere
      ? {
          createdAt: createdAtWhere,
        }
      : {}),
  },
}),

      this.prisma.jobPayment.aggregate({
  _sum: {
    amountMilliFec: true,
  },
  where: {
    type: "URGENT",
    status: "SUCCESS",
    ...(createdAtWhere
      ? {
          paidAt: createdAtWhere,
        }
      : {}),
  },
}),

      this.prisma.user.count({
        where: createdAtWhere ? { createdAt: createdAtWhere } : undefined,
      }),

      this.prisma.job.findMany({
        where: {
          clientId: { in: clientUserIds.length ? clientUserIds : ["__none__"] },
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
        distinct: ["clientId"],
        select: {
          clientId: true,
        },
      }),

      this.prisma.job.findMany({
        where: {
          fixerId: { in: fixerUserIds.length ? fixerUserIds : ["__none__"] },
          status: {
            in: [JobStatus.IN_PROGRESS, JobStatus.COMPLETED],
          },
          ...(createdAtWhere
            ? {
                OR: [
                  { updatedAt: createdAtWhere },
                  { completedApprovedAt: createdAtWhere },
                ],
              }
            : {}),
        },
        distinct: ["fixerId"],
        select: {
          fixerId: true,
        },
      }),

      this.prisma.jobApplication.findMany({
        where: {
          fixerId: { in: fixerUserIds.length ? fixerUserIds : ["__none__"] },
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
        distinct: ["fixerId"],
        select: {
          fixerId: true,
        },
      }),

      this.prisma.job.findMany({
        where: {
          clientId: { in: clientUserIds.length ? clientUserIds : ["__none__"] },
          status: JobStatus.OPEN,
          ...(createdAtWhere ? { createdAt: createdAtWhere } : {}),
        },
        distinct: ["clientId"],
        select: {
          clientId: true,
        },
      }),

      this.prisma.job.findMany({
        where: {
          clientId: { in: clientUserIds.length ? clientUserIds : ["__none__"] },
          status: JobStatus.COMPLETED,
          ...(createdAtWhere ? { completedApprovedAt: createdAtWhere } : {}),
        },
        distinct: ["clientId"],
        select: {
          clientId: true,
        },
      }),

      this.prisma.user.findMany({
        where: {
          id: { in: clientUserIds.length ? clientUserIds : ["__none__"] },
          jobsPosted: {
            none: {},
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    const totalSingleRoleUsers = usersForRoleProfile.filter(
      (u: { roles: unknown[] }) => u.roles.length === 1
    ).length;

    const totalDualRoleUsers = usersForRoleProfile.filter(
      (u: { roles: unknown[] }) => u.roles.length > 1
    ).length;

    const totalDepositsMilliFec = Number(totalDepositsMilliFecRows[0]?.sum ?? 0);
    const totalWithdrawalsMilliFec = withdrawalsAgg._sum.amountMilliFec ?? 0;
    const platformJobPostingFeesMilliFec = jobPostingFeesAgg._sum.amountMilliFec ?? 0;
    const platformCommissionMilliFec = platformCommissionAgg._sum.amountMilliFec  ?? 0;
    const platformUrgentHireFeesMilliFec = urgentHireFeesAgg._sum.amountMilliFec ?? 0;
    const totalPlatformFundsMilliFec =
      platformJobPostingFeesMilliFec +
      platformCommissionMilliFec +
      platformUrgentHireFeesMilliFec;

    const activeClientIds = new Set(activeClientRows.map((row) => row.clientId));
    const activeWorkingFixerIds = new Set(
      activeWorkingFixerRows
        .map((row) => row.fixerId)
        .filter((value): value is string => Boolean(value))
    );
    const applyingOnlyFixerIdsRaw = new Set(
      applyingOnlyFixerRows.map((row) => row.fixerId)
    );

    const applyingOnlyFixerIds = Array.from(applyingOnlyFixerIdsRaw).filter(
      (fixerId): fixerId is string =>
        Boolean(fixerId) && !activeWorkingFixerIds.has(fixerId)
    );

    const totalActiveClients = activeClientIds.size;
    const totalDormantClients = Math.max(totalClients - totalActiveClients, 0);
    const totalClientsWithOpenJobs = clientsWithOpenJobsRows.length;
    const totalClientsWithCompletedJobs = clientsWithCompletedJobsRows.length;
    const totalClientsWhoNeverPosted = clientsWhoNeverPostedRows.length;

    const totalActiveWorkingFixers = activeWorkingFixerIds.size;
    const totalDormantFixers = Math.max(totalFixers - totalActiveWorkingFixers, 0);
    const totalApplyingOnlyFixers = applyingOnlyFixerIds.length;

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
      registrations: {
        totalRegistrations: totalUsers,
        registrationsInRange,
      },
      jobs: {
        totalJobsPosted,
        totalJobsCompletedWithoutDispute,
        totalJobsCompletedWithDispute,
        totalJobsCompletedOverall,
      },
      clientActivity: {
        totalClients,
        activeClients: totalActiveClients,
        dormantClients: totalDormantClients,
        clientsWithOpenJobs: totalClientsWithOpenJobs,
        clientsWithCompletedJobs: totalClientsWithCompletedJobs,
        clientsWhoNeverPosted: totalClientsWhoNeverPosted,
      },
      fixerActivity: {
        totalFixers,
        activeWorkingFixers: totalActiveWorkingFixers,
        dormantFixers: totalDormantFixers,
        applyingOnlyFixers: totalApplyingOnlyFixers,
      },
      finance: {
        totalDepositsMilliFec,
        totalWithdrawalsMilliFec,
        platformJobPostingFeesMilliFec,
        platformCommissionMilliFec,
        platformUrgentHireFeesMilliFec,
        totalPlatformFundsMilliFec,
      },
    };
  }

  async getTimeline(range: AdminAnalyticsRange) {
    const buckets = this.buildTimelineBuckets(range);

    return Promise.all(
      buckets.map(async (bucket) => {

        const [
          registrations,
          jobsPosted,
          jobsCompleted,
          deposits,
          withdrawals,
          postingFees,
          urgentHireFees,
          platformCommission,
        ] = await Promise.all([
          this.prisma.user.count({
            where: {
              createdAt: { gte: bucket.from, lt: bucket.to },
            },
          }),

          this.prisma.job.count({
            where: {
              createdAt: { gte: bucket.from, lt: bucket.to },
            },
          }),

          this.prisma.job.count({
            where: {
              status: JobStatus.COMPLETED,
              completedApprovedAt: { gte: bucket.from, lt: bucket.to },
            },
          }),

          this.prisma.$queryRaw<{ sum: number | null }[]>`
            SELECT COALESCE(SUM("amountMilliFec"), 0) AS sum
            FROM "Deposit"
            WHERE status = 'SUCCEEDED'
              AND "createdAt" >= ${bucket.from}
              AND "createdAt" < ${bucket.to}
          `,

          this.prisma.withdrawalRequest.aggregate({
            _sum: { amountMilliFec: true },
            where: {
              status: {
                in: [WithdrawalStatus.APPROVED, WithdrawalStatus.PAID],
              },
              createdAt: { gte: bucket.from, lt: bucket.to },
            },
          }),
          this.prisma.jobPayment.aggregate({
  _sum: {
    amountMilliFec: true,
  },
  where: {
    type: "POSTING",
    status: "SUCCESS",
    paidAt: {
      gte: bucket.from,
      lt: bucket.to,
    },
  },
}),

          this.prisma.jobPayment.aggregate({
  _sum: {
    amountMilliFec: true,
  },
  where: {
    type: "URGENT",
    status: "SUCCESS",
    paidAt: {
      gte: bucket.from,
      lt: bucket.to,
    },
  },
}),
this.prisma.platformLedgerEntry.aggregate({
  _sum: {
    amountMilliFec: true,
  },
  where: {
    type: "COMMISSION",
    direction: "CREDIT",
    createdAt: {
      gte: bucket.from,
      lt: bucket.to,
    },
  },
}),
]);


    return {
  label: bucket.label,
  registrations,
  jobsPosted,
  jobsCompleted,
  depositsMilliFec: Number(deposits[0]?.sum ?? 0),
  withdrawalsMilliFec: withdrawals._sum.amountMilliFec ?? 0,
  postingFeesMilliFec: postingFees._sum.amountMilliFec ?? 0,
  urgentHireFeesMilliFec: urgentHireFees._sum.amountMilliFec ?? 0,
  platformCommissionMilliFec:
    platformCommission._sum.amountMilliFec ?? 0,
};
      })
    );
  }
}