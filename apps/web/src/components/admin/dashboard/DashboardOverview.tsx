"use client";

import * as React from "react";

import AdminSection from "@/components/admin/AdminSection";
import AdminStatCard from "@/components/admin/AdminStatCard";

type DashboardOverviewProps = {
  users: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  };

  admins: {
    activeAdmins: number;
    lockedAdmins: number;
    activeSessions: number;
  };

  verification: {
    approved: number;
    pending: number;
    rejected: number;
  };
};

export default function DashboardOverview({
  users,
  verification,
}: DashboardOverviewProps) {
  return (
    <AdminSection
      title="Platform Overview"
      description="Core user and identity-verification metrics across the platform."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          title="Total Users"
          value={users.totalUsers.toLocaleString()}
          subtitle="Registered accounts"
          accent="blue"
        />

        <AdminStatCard
          title="Active Users"
          value={users.activeUsers.toLocaleString()}
          subtitle="Currently active accounts"
          accent="green"
        />

        <AdminStatCard
          title="New Users"
          value={users.newUsers.toLocaleString()}
          subtitle="Joined within the last 24 hours"
          accent="purple"
        />
      </div>

      <div className="mt-8 border-t border-[#E4ECF7] pt-8 dark:border-[#2D3F55]">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Identity Verification
            </h3>

            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Current verification workload and submission outcomes.
            </p>
          </div>

          {verification.pending > 0 ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              {verification.pending.toLocaleString()} pending
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              Queue clear
            </span>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <AdminStatCard
            title="Pending"
            value={verification.pending.toLocaleString()}
            subtitle="Awaiting review"
            accent={verification.pending > 0 ? "amber" : "green"}
          />

          <AdminStatCard
            title="Approved"
            value={verification.approved.toLocaleString()}
            subtitle="Verified identities"
            accent="green"
          />

          <AdminStatCard
            title="Rejected"
            value={verification.rejected.toLocaleString()}
            subtitle="Rejected submissions"
            accent="red"
          />
        </div>
      </div>
    </AdminSection>
  );
}