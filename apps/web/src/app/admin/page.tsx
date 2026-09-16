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

  if (isLoading && !data) {
    return <DashboardLoading />;
  }

  if (isError && !data) {
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

  if (!data) {
    return <DashboardLoading />;
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

      <div className="grid gap-8 2xl:grid-cols-2">
        <DashboardJobs jobs={data.jobs} />

        <DashboardFinance
          withdrawals={data.withdrawals}
        />
      </div>

      <DashboardModeration
        reports={data.reports}
        disputes={data.disputes}
      />

      <DashboardAdminOverview
        admins={data.admins}
      />

      <div className="grid gap-8 2xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)]">
        <DashboardRecentActivity
          activities={data.recentActivity}
        />

        <DashboardSystemHealth
          system={data.system}
        />
      </div>

      {isFetching ? (
        <div className="flex items-center justify-end gap-2 text-xs text-[#7E8FAE] dark:text-[#8FA0BC]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#5B8FCC]" />
          Refreshing dashboard data...
        </div>
      ) : null}
    </div>
  );
}