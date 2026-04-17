// Path: apps/api/src/admin/analytics/admin-analytics.service.ts
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
      range,
      period: {
        label: overview.period.label,
        from: overview.period.from ? overview.period.from.toISOString() : null,
        to: overview.period.to.toISOString(),
      },
      users: overview.users,
      registrations: overview.registrations,
      jobs: overview.jobs,
      clientActivity: overview.clientActivity,
      fixerActivity: overview.fixerActivity,
      finance: overview.finance,
      charts: {
        usersByRoleProfile: [
          { label: "Single role", value: overview.users.totalSingleRoleUsers },
          { label: "Dual role", value: overview.users.totalDualRoleUsers },
        ],
        jobsByOutcome: [
          {
            label: "Completed without dispute",
            value: overview.jobs.totalJobsCompletedWithoutDispute,
          },
          {
            label: "Completed with dispute",
            value: overview.jobs.totalJobsCompletedWithDispute,
          },
        ],
        clientActivityBreakdown: [
          { label: "Active clients", value: overview.clientActivity.activeClients },
          { label: "Dormant clients", value: overview.clientActivity.dormantClients },
          {
            label: "Never posted",
            value: overview.clientActivity.clientsWhoNeverPosted,
          },
        ],
        fixerActivityBreakdown: [
          {
            label: "Active working",
            value: overview.fixerActivity.activeWorkingFixers,
          },
          {
            label: "Dormant",
            value: overview.fixerActivity.dormantFixers,
          },
          {
            label: "Applying only",
            value: overview.fixerActivity.applyingOnlyFixers,
          },
        ],
        financeBreakdown: [
          {
            label: "Job posting fees",
            value: overview.finance.platformJobPostingFeesMilliFec,
          },
          {
            label: "Urgent hire fees",
            value: overview.finance.platformUrgentHireFeesMilliFec,
          },
          {
            label: "Commission",
            value: overview.finance.platformCommissionMilliFec,
          },
          {
            label: "Total platform funds",
            value: overview.finance.totalPlatformFundsMilliFec,
          },
        ],
        timeline,
      },
    };
  }
}