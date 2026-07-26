// Path: apps/web/src/lib/admin/analytics/types.ts
export type AdminAnalyticsRange = "day" | "week" | "month" | "year" | "all";

export type AdminAnalyticsChartItem = {
  label: string;
  value: number;
};

export type AdminAnalyticsTimelineItem = {
  label: string;
  registrations: number;
  jobsPosted: number;
  jobsCompleted: number;
  depositsMilliFec: number;
  withdrawalsMilliFec: number;
  postingFeesMilliFec: number;
  urgentHireFeesMilliFec: number;
  platformCommissionMilliFec: number;
};

export type AdminAnalyticsOverviewResponse = {
  range: AdminAnalyticsRange;
  period: {
    from: string | null;
    to: string | null;
    label: string;
  };
  users: {
    totalUsers: number;
    totalFixers: number;
    totalClients: number;
    totalSingleRoleUsers: number;
    totalDualRoleUsers: number;
    currentActiveUsers: number;
  };
  registrations: {
    totalRegistrations: number;
    registrationsInRange: number;
  };
  jobs: {
    totalJobsPosted: number;
    totalJobsCompletedWithoutDispute: number;
    totalJobsCompletedWithDispute: number;
    totalJobsCompletedOverall: number;
  };
  clientActivity: {
    totalClients: number;
    activeClients: number;
    dormantClients: number;
    clientsWithOpenJobs: number;
    clientsWithCompletedJobs: number;
    clientsWhoNeverPosted: number;
  };
  fixerActivity: {
    totalFixers: number;
    activeWorkingFixers: number;
    dormantFixers: number;
    applyingOnlyFixers: number;
  };
  finance: {
    totalDepositsMilliFec: number;
    totalWithdrawalsMilliFec: number;
    platformJobPostingFeesMilliFec: number;
    platformCommissionMilliFec: number;
    platformUrgentHireFeesMilliFec: number;
    totalPlatformFundsMilliFec: number;
  };
  charts: {
    usersByRoleProfile: AdminAnalyticsChartItem[];
    jobsByOutcome: AdminAnalyticsChartItem[];
    clientActivityBreakdown: AdminAnalyticsChartItem[];
    fixerActivityBreakdown: AdminAnalyticsChartItem[];
    financeBreakdown: AdminAnalyticsChartItem[];
    timeline: AdminAnalyticsTimelineItem[];
  };
};

export type GetAdminAnalyticsOverviewParams = {
  range?: AdminAnalyticsRange;
  anchor?: string;
};