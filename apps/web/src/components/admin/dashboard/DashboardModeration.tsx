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

  const activeModerationWorkload =
    reports.pending + disputes.open;

  return (
    <AdminSection
      title="Moderation"
      description="Current reports and dispute workload requiring administrative oversight."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Needs Attention"
          value={activeModerationWorkload.toLocaleString()}
          subtitle={`${reports.pending.toLocaleString()} reports · ${disputes.open.toLocaleString()} disputes`}
          accent={
            activeModerationWorkload > 0
              ? "amber"
              : "green"
          }
        />

        <AdminStatCard
          title="Pending Reports"
          value={reports.pending.toLocaleString()}
          subtitle="Awaiting moderation"
          accent={reports.pending > 0 ? "amber" : "green"}
        />

        <AdminStatCard
          title="Open Disputes"
          value={disputes.open.toLocaleString()}
          subtitle="Require administrator attention"
          accent={disputes.open > 0 ? "amber" : "green"}
        />

        <AdminStatCard
          title="Total Reports"
          value={totalReports.toLocaleString()}
          subtitle="All submitted reports"
          accent="blue"
        />
      </div>

      <div className="mt-6 border-t border-[#E4ECF7] pt-6 dark:border-[#2D3F55]">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Report Outcomes
                </h3>

                <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  Completed moderation outcomes.
                </p>
              </div>

              <span className="text-xs font-medium text-[#6B7C99] dark:text-[#8FA0BC]">
                {totalReports.toLocaleString()} total
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E4ECF7] bg-[#FBFDFF] px-4 py-3 dark:border-[#2D3F55] dark:bg-[#16202E]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Resolved
                </p>

                <p className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {reports.resolved.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-[#E4ECF7] bg-[#FBFDFF] px-4 py-3 dark:border-[#2D3F55] dark:bg-[#16202E]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Dismissed
                </p>

                <p className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {reports.dismissed.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Dispute Outcomes
                </h3>

                <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  Current and completed job disputes.
                </p>
              </div>

              <span className="text-xs font-medium text-[#6B7C99] dark:text-[#8FA0BC]">
                {totalDisputes.toLocaleString()} total
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E4ECF7] bg-[#FBFDFF] px-4 py-3 dark:border-[#2D3F55] dark:bg-[#16202E]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Open
                </p>

                <p className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {disputes.open.toLocaleString()}
                </p>
              </div>

              <div className="rounded-xl border border-[#E4ECF7] bg-[#FBFDFF] px-4 py-3 dark:border-[#2D3F55] dark:bg-[#16202E]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Resolved
                </p>

                <p className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {disputes.resolved.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminSection>
  );
}