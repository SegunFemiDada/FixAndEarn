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
  const healthy =
    admins.lockedAdmins === 0;

  return (
    <AdminSection
      title="Administrator Environment"
      description="Current administrator activity and access health across the platform."
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
          subtitle="Administrators currently locked"
          accent={
            admins.lockedAdmins > 0
              ? "red"
              : "green"
          }
        />

        <AdminStatCard
          title="Environment Status"
          value={
            healthy
              ? "Healthy"
              : "Attention"
          }
          subtitle={
            healthy
              ? "No locked administrator accounts"
              : "Review administrator lockouts"
          }
          accent={
            healthy
              ? "green"
              : "amber"
          }
        />
      </div>

      <div className="mt-8 rounded-2xl border border-[#E4ECF7] dark:border-[#2D3F55] bg-[#F8FBFF] dark:bg-[#16202E] p-5">
        <h3 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          Operational Summary
        </h3>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div>
            <p className="text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC]">
              Active Administrators
            </p>

            <p className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {admins.activeAdmins.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC]">
              Authenticated Sessions
            </p>

            <p className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {admins.activeSessions.toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC]">
              Locked Accounts
            </p>

            <p
              className={`mt-2 text-lg font-semibold ${
                admins.lockedAdmins > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {admins.lockedAdmins.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </AdminSection>
  );
}