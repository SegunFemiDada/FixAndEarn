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
  admins,
  verification,
}: DashboardOverviewProps) {
  return (
    <AdminSection
      title="Platform Overview"
      description="High-level operational metrics across users, verification, and administrator activity."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Total Users"
          value={users.totalUsers.toLocaleString()}
          subtitle="Registered accounts"
        />

        <AdminStatCard
          title="Active Users"
          value={users.activeUsers.toLocaleString()}
          subtitle="Currently active accounts"
        />

        <AdminStatCard
          title="New Users"
          value={users.newUsers.toLocaleString()}
          subtitle="Joined within the last 24 hours"
        />

        <AdminStatCard
          title="Approved Verification"
          value={verification.approved.toLocaleString()}
          subtitle="Verified identities"
        />

        <AdminStatCard
          title="Pending Verification"
          value={verification.pending.toLocaleString()}
          subtitle="Awaiting review"
        />

        <AdminStatCard
          title="Rejected Verification"
          value={verification.rejected.toLocaleString()}
          subtitle="Rejected submissions"
        />

        <AdminStatCard
          title="Active Admins"
          value={admins.activeAdmins.toLocaleString()}
          subtitle="Enabled administrator accounts"
        />

        <AdminStatCard
          title="Active Sessions"
          value={admins.activeSessions.toLocaleString()}
          subtitle="Logged-in administrator sessions"
        />
      </div>

      {admins.lockedAdmins > 0 && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <span className="font-semibold">
            {admins.lockedAdmins.toLocaleString()}
          </span>{" "}
          administrator{admins.lockedAdmins === 1 ? "" : "s"} currently have
          locked accounts.
        </div>
      )}
    </AdminSection>
  );
}