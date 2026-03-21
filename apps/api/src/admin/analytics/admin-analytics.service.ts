import { Injectable } from "@nestjs/common";
import {
  AdminAnalyticsRange,
  AdminAnalyticsRepo,
} from "./admin-analytics.repo";

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly repo: AdminAnalyticsRepo) {}

  async getOverview(range: AdminAnalyticsRange) {
    const overview = await this.repo.getOverview(range);
    const timeline = await this.repo.getTimeline(range);

    return {
      period: {
        range,
        label: overview.period.label,
        from: overview.period.from ? overview.period.from.toISOString() : null,
        to: overview.period.to.toISOString(),
      },
      users: overview.users,
      jobs: overview.jobs,
      finance: overview.finance,
      charts: {
        usersByRoleProfile: [
          { label: "Single role", value: overview.users.totalSingleRoleUsers },
          { label: "Dual role", value: overview.users.totalDualRoleUsers },
        ],
        jobsByOutcome: [
          { label: "Completed without dispute", value: overview.jobs.totalJobsCompletedWithoutDispute },
          { label: "Completed with dispute", value: overview.jobs.totalJobsCompletedWithDispute },
        ],
        financeBreakdown: [
          { label: "Job posting fees", value: overview.finance.platformJobPostingFeesMilliFec },
          { label: "Commission", value: overview.finance.platformCommissionMilliFec },
          { label: "Total platform funds", value: overview.finance.totalPlatformFundsMilliFec },
        ],
        timeline,
      },
    };
  }
}