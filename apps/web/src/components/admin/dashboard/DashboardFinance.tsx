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

  return (
    <AdminSection
      title="Finance"
      description="Live overview of withdrawal operations across the platform."
    >
      <div className="space-y-8">
        <div>
          <h3 className="mb-4 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Withdrawals
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              title="Total Withdrawals"
              value={totalWithdrawals.toLocaleString()}
              subtitle="All withdrawal requests"
              accent="blue"
            />

            <AdminStatCard
              title="Pending"
              value={withdrawals.pending.toLocaleString()}
              subtitle="Waiting for review"
              accent="amber"
            />

            <AdminStatCard
              title="Approved"
              value={withdrawals.approved.toLocaleString()}
              subtitle="Approved for manual payment"
              accent="purple"
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
        </div>
      </div>
    </AdminSection>
  );
}