"use client";

import * as React from "react";

import AdminSection from "@/components/admin/AdminSection";
import AdminStatCard from "@/components/admin/AdminStatCard";

type DashboardAdminOverviewProps = {
  admins: {
    activeAdmins: number;
    lockedAdmins: number;
    activeSessions: number;
  };
};

export default function DashboardAdminOverview({
  admins,
}: DashboardAdminOverviewProps) {
  const hasLockouts = admins.lockedAdmins > 0;

  return (
    <AdminSection
      title="Security & Administrator Access"
      description="Current administrator accounts, authenticated sessions, and access exceptions."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Active Administrators"
          value={admins.activeAdmins.toLocaleString()}
          subtitle="Enabled administrator accounts"
          accent="green"
        />

        <AdminStatCard
          title="Active Sessions"
          value={admins.activeSessions.toLocaleString()}
          subtitle="Currently authenticated sessions"
          accent="blue"
        />

        <AdminStatCard
          title="Locked Accounts"
          value={admins.lockedAdmins.toLocaleString()}
          subtitle={
            hasLockouts
              ? "Administrator accounts requiring review"
              : "No administrator accounts locked"
          }
          accent={hasLockouts ? "red" : "green"}
        />

        <AdminStatCard
          title="Access Status"
          value={hasLockouts ? "Attention" : "Healthy"}
          subtitle={
            hasLockouts
              ? "Review administrator lockouts"
              : "No current access exceptions"
          }
          accent={hasLockouts ? "amber" : "green"}
        />
      </div>

      <div className="mt-6 border-t border-[#E4ECF7] pt-6 dark:border-[#2D3F55]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Access Monitoring
            </h3>

            <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
              Administrator access remains within the current platform security state.
            </p>
          </div>

          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
              hasLockouts
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                hasLockouts
                  ? "bg-red-500"
                  : "bg-emerald-500"
              }`}
            />

            {hasLockouts
              ? `${admins.lockedAdmins.toLocaleString()} locked account${
                  admins.lockedAdmins === 1 ? "" : "s"
                }`
              : "No locked accounts"}
          </div>
        </div>
      </div>
    </AdminSection>
  );
}