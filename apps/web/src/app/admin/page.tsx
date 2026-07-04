"use client";

import * as React from "react";

import { useAdminDashboard } from "@/lib/admin/dashboard/queries";

import DashboardHero from "@/components/admin/dashboard/DashboardHero";
import DashboardOverview from "@/components/admin/dashboard/DashboardOverview";
import DashboardJobs from "@/components/admin/dashboard/DashboardJobs";
import DashboardFinance from "@/components/admin/dashboard/DashboardFinance";
import DashboardModeration from "@/components/admin/dashboard/DashboardModeration";
import DashboardAdminOverview from "@/components/admin/dashboard/DashboardAdminOverview";
import DashboardRecentActivity from "@/components/admin/dashboard/DashboardRecentActivity";
import DashboardSystemHealth from "@/components/admin/dashboard/DashboardSystemHealth";
import DashboardLoading from "@/components/admin/dashboard/DashboardLoading";
import DashboardError from "@/components/admin/dashboard/DashboardError";


export default function AdminDashboardPage() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useAdminDashboard();

  const loading = isLoading || isFetching;

  if (loading && !data) {
    return <DashboardLoading />;
  }

  if (isError || !data) {
    return (
      <DashboardError
        message={
          error instanceof Error
            ? error.message
            : "Unable to load dashboard."
        }
        onRetry={() => {
          void refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHero
        generatedAt={data.system.generatedAt}
        healthy={data.system.healthy}
      />

      <DashboardOverview
      users={data.users}
      admins={data.admins}
      verification={data.verification}
    />

      <DashboardJobs
        jobs={data.jobs}
      />

      <DashboardFinance
        deposits={data.deposits}
        withdrawals={data.withdrawals}
      />

      <DashboardModeration
        reports={data.reports}
        disputes={data.disputes}
      />

      <DashboardAdminOverview
        admins={data.admins}
      />

      <DashboardRecentActivity
        activities={data.recentActivity}
      />

      <DashboardSystemHealth
        system={data.system}
      />
    </div>
  );
}