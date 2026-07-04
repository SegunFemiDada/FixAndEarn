"use client";

import * as React from "react";

import AdminSection from "@/components/admin/AdminSection";
import AdminStatCard from "@/components/admin/AdminStatCard";

type DashboardModerationProps = {
  reports: {
    pending: number;
    resolved: number;
    dismissed: number;
  };

  disputes: {
    open: number;
    resolved: number;
  };
};

export default function DashboardModeration({
  reports,
  disputes,
}: DashboardModerationProps) {
  const totalReports =
    reports.pending +
    reports.resolved +
    reports.dismissed;

  const totalDisputes =
    disputes.open +
    disputes.resolved;

  return (
    <AdminSection
      title="Moderation"
      description="Monitor reports submitted by users together with active dispute resolution workload."
    >
      <div className="space-y-8">
        {/* Reports */}

        <div>
          <h3 className="mb-4 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Reports
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              title="Total Reports"
              value={totalReports.toLocaleString()}
              subtitle="All submitted reports"
              accent="blue"
            />

            <AdminStatCard
              title="Pending"
              value={reports.pending.toLocaleString()}
              subtitle="Awaiting moderation"
              accent="amber"
            />

            <AdminStatCard
              title="Resolved"
              value={reports.resolved.toLocaleString()}
              subtitle="Successfully handled"
              accent="green"
            />

            <AdminStatCard
              title="Dismissed"
              value={reports.dismissed.toLocaleString()}
              subtitle="Closed without action"
              accent="purple"
            />
          </div>
        </div>

        {/* Disputes */}

        <div className="border-t border-[#E4ECF7] pt-8 dark:border-[#2D3F55]">
          <h3 className="mb-4 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Job Disputes
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard
              title="Total Disputes"
              value={totalDisputes.toLocaleString()}
              subtitle="All recorded disputes"
              accent="blue"
            />

            <AdminStatCard
              title="Open"
              value={disputes.open.toLocaleString()}
              subtitle="Require administrator attention"
              accent="amber"
            />

            <AdminStatCard
              title="Resolved"
              value={disputes.resolved.toLocaleString()}
              subtitle="Successfully concluded"
              accent="green"
            />
          </div>
        </div>
      </div>
    </AdminSection>
  );
}