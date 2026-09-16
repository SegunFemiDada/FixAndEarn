"use client";

import * as React from "react";

import AdminSection from "@/components/admin/AdminSection";
import AdminStatCard from "@/components/admin/AdminStatCard";

type DashboardFinanceProps = {
  withdrawals: {
    pending: number;
    approved: number;
    paid: number;
    rejected: number;
  };
};

export default function DashboardFinance({
  withdrawals,
}: DashboardFinanceProps) {
  const totalWithdrawals =
    withdrawals.pending +
    withdrawals.approved +
    withdrawals.paid +
    withdrawals.rejected;

  const outstandingWithdrawals =
    withdrawals.pending + withdrawals.approved;

  return (
    <AdminSection
      title="Finance"
      description="Current withdrawal workload and processing status across the platform."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Total Withdrawals"
          value={totalWithdrawals.toLocaleString()}
          subtitle="All withdrawal requests"
          accent="blue"
        />

        <AdminStatCard
          title="Needs Processing"
          value={outstandingWithdrawals.toLocaleString()}
          subtitle={`${withdrawals.pending.toLocaleString()} pending · ${withdrawals.approved.toLocaleString()} approved`}
          accent={
            outstandingWithdrawals > 0
              ? "amber"
              : "green"
          }
        />

        <AdminStatCard
          title="Paid"
          value={withdrawals.paid.toLocaleString()}
          subtitle="Successfully completed"
          accent="green"
        />

        <AdminStatCard
          title="Rejected"
          value={withdrawals.rejected.toLocaleString()}
          subtitle="Rejected requests"
          accent="red"
        />
      </div>

      <div className="mt-6 border-t border-[#E4ECF7] pt-6 dark:border-[#2D3F55]">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Pending Review
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {withdrawals.pending.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Approved
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {withdrawals.approved.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Paid
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {withdrawals.paid.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Rejected
              </p>

              <p className="mt-0.5 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {withdrawals.rejected.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminSection>
  );
}