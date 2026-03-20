import { Injectable } from "@nestjs/common";
import { AdminAnalyticsRepo } from "./admin-analytics.repo";

type AnalyticsRange = "day" | "week" | "month" | "year" | "all";

type TimeBucket = {
  label: string;
  from: Date;
  to: Date;
};

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly repo: AdminAnalyticsRepo) {}

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private addHours(date: Date, hours: number) {
    const next = new Date(date);
    next.setHours(next.getHours() + hours);
    return next;
  }

  private addMonths(date: Date, months: number) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }

  private startOfMonth(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
  }

  private startOfYear(date: Date) {
    return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  private formatShortDate(date: Date) {
    return new Intl.DateTimeFormat("en-NG", {
      month: "short",
      day: "numeric",
    }).format(date);
  }

  private formatMonthLabel(date: Date) {
    return new Intl.DateTimeFormat("en-NG", {
      month: "short",
      year: "numeric",
    }).format(date);
  }

  private formatHourLabel(date: Date) {
    return new Intl.DateTimeFormat("en-NG", {
      hour: "numeric",
    }).format(date);
  }

  private buildPeriod(range: AnalyticsRange, anchor: Date) {
    const safeAnchor = new Date(anchor);

    if (range === "day") {
      const from = this.startOfDay(safeAnchor);
      const to = this.addDays(from, 1);

      return {
        from,
        to,
        label: "Today",
        buckets: Array.from({ length: 24 }, (_, index) => {
          const bucketFrom = this.addHours(from, index);
          const bucketTo = this.addHours(bucketFrom, 1);

          return {
            label: this.formatHourLabel(bucketFrom),
            from: bucketFrom,
            to: bucketTo,
          } satisfies TimeBucket;
        }),
      };
    }

    if (range === "week") {
      const todayStart = this.startOfDay(safeAnchor);
      const from = this.addDays(todayStart, -6);
      const to = this.addDays(todayStart, 1);

      return {
        from,
        to,
        label: "Last 7 days",
        buckets: Array.from({ length: 7 }, (_, index) => {
          const bucketFrom = this.addDays(from, index);
          const bucketTo = this.addDays(bucketFrom, 1);

          return {
            label: this.formatShortDate(bucketFrom),
            from: bucketFrom,
            to: bucketTo,
          } satisfies TimeBucket;
        }),
      };
    }

    if (range === "month") {
      const todayStart = this.startOfDay(safeAnchor);
      const from = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1, 0, 0, 0, 0);
      const to = this.addMonths(from, 1);
      const daysInMonth = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

      return {
        from,
        to,
        label: "This month",
        buckets: Array.from({ length: daysInMonth }, (_, index) => {
          const bucketFrom = this.addDays(from, index);
          const bucketTo = this.addDays(bucketFrom, 1);

          return {
            label: this.formatShortDate(bucketFrom),
            from: bucketFrom,
            to: bucketTo,
          } satisfies TimeBucket;
        }),
      };
    }

    if (range === "year") {
      const from = this.startOfYear(safeAnchor);
      const to = new Date(from.getFullYear() + 1, 0, 1, 0, 0, 0, 0);

      return {
        from,
        to,
        label: "This year",
        buckets: Array.from({ length: 12 }, (_, index) => {
          const bucketFrom = new Date(from.getFullYear(), index, 1, 0, 0, 0, 0);
          const bucketTo = new Date(from.getFullYear(), index + 1, 1, 0, 0, 0, 0);

          return {
            label: this.formatMonthLabel(bucketFrom),
            from: bucketFrom,
            to: bucketTo,
          } satisfies TimeBucket;
        }),
      };
    }

    const to = this.addDays(this.startOfDay(safeAnchor), 1);
    const from = this.addMonths(this.startOfMonth(safeAnchor), -23);

    return {
      from,
      to,
      label: "Last 24 months",
      buckets: Array.from({ length: 24 }, (_, index) => {
        const bucketFrom = this.addMonths(from, index);
        const bucketTo = this.addMonths(bucketFrom, 1);

        return {
          label: this.formatMonthLabel(bucketFrom),
          from: bucketFrom,
          to: bucketTo,
        } satisfies TimeBucket;
      }),
    };
  }

  async getOverview(args: { range?: AnalyticsRange; anchor?: string }) {
    const range = args.range ?? "week";
    const anchor = args.anchor ? new Date(args.anchor) : new Date();
    const safeAnchor = Number.isNaN(anchor.getTime()) ? new Date() : anchor;

    const period = this.buildPeriod(range, safeAnchor);

    const [
      totalUsers,
      totalFixers,
      totalClients,
      totalSingleRoleUsers,
      totalDualRoleUsers,
      currentActiveUsers,
      totalJobsPosted,
      totalJobsCompletedWithoutDispute,
      totalJobsCompletedWithDispute,
      totalJobsCompletedOverall,
      totalDepositsMilliFec,
      totalWithdrawalsMilliFec,
      platformJobPostingFeesMilliFec,
      platformCommissionMilliFec,
      totalPlatformFundsMilliFec,
    ] = await Promise.all([
      this.repo.countTotalUsers(),
      this.repo.countUsersWithRole("FIXER"),
      this.repo.countUsersWithRole("CLIENT"),
      this.repo.countSingleRoleUsers(),
      this.repo.countDualRoleUsers(),
      this.repo.countActiveUsers(),
      this.repo.countJobsPosted(period.from, period.to),
      this.repo.countCompletedJobsWithoutDispute(period.from, period.to),
      this.repo.countCompletedJobsWithDispute(period.from, period.to),
      this.repo.countCompletedJobsOverall(period.from, period.to),
      this.repo.sumSucceededDeposits(period.from, period.to),
      this.repo.sumPaidWithdrawals(period.from, period.to),
      this.repo.sumJobPostingFees(period.from, period.to),
      this.repo.sumPlatformCommission(period.from, period.to),
      this.repo.getPlatformFundsBalance(),
    ]);

    const timeline = await Promise.all(
      period.buckets.map(async (bucket) => {
        const [jobsPosted, jobsCompleted, depositsMilliFec, withdrawalsMilliFec] = await Promise.all([
          this.repo.countJobsPosted(bucket.from, bucket.to),
          this.repo.countCompletedJobsOverall(bucket.from, bucket.to),
          this.repo.sumSucceededDeposits(bucket.from, bucket.to),
          this.repo.sumPaidWithdrawals(bucket.from, bucket.to),
        ]);

        return {
          label: bucket.label,
          jobsPosted,
          jobsCompleted,
          depositsMilliFec,
          withdrawalsMilliFec,
        };
      })
    );

    return {
      range,
      period: {
        from: period.from.toISOString(),
        to: period.to.toISOString(),
        label: period.label,
      },
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
      charts: {
        usersByRoleProfile: [
          { label: "Single role", value: totalSingleRoleUsers },
          { label: "Dual role", value: totalDualRoleUsers },
        ],
        jobsByOutcome: [
          { label: "Completed without dispute", value: totalJobsCompletedWithoutDispute },
          { label: "Completed with dispute", value: totalJobsCompletedWithDispute },
        ],
        financeBreakdown: [
          { label: "Deposits", value: totalDepositsMilliFec },
          { label: "Withdrawals", value: totalWithdrawalsMilliFec },
          { label: "Job posting fees", value: platformJobPostingFeesMilliFec },
          { label: "Commission", value: platformCommissionMilliFec },
        ],
        timeline,
      },
    };
  }
}