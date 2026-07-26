"use client";

import * as React from "react";

import AdminSection from "@/components/admin/AdminSection";
import AdminStatCard from "@/components/admin/AdminStatCard";

type DashboardFinanceProps = {
  // deposits: {
  //   pending: number;
  //   succeeded: number;
  //   failed: number;
  // };

  withdrawals: {
    pending: number;
    processing: number;
    paid: number;
    rejected: number;
    failed: number;
  };
};

export default function DashboardFinance({
  // deposits,
  withdrawals,
}: DashboardFinanceProps) {
  // const totalDeposits =
  //   deposits.pending +
  //   deposits.succeeded +
  //   deposits.failed;

  const totalWithdrawals =
    withdrawals.pending +
    withdrawals.processing +
    withdrawals.paid +
    withdrawals.rejected +
    withdrawals.failed;

  return (
    <AdminSection
      title="Finance"
      description="Live overview of deposit and withdrawal operations across the platform."
    >
      <div className="space-y-8">
        {/* <div>
          <h3 className="mb-4 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Deposits
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              title="Total Deposits"
              value={totalDeposits.toLocaleString()}
              subtitle="All deposit requests"
              accent="blue"
            />

            <AdminStatCard
              title="Pending"
              value={deposits.pending.toLocaleString()}
              subtitle="Awaiting confirmation"
              accent="amber"
            />

            <AdminStatCard
              title="Succeeded"
              value={deposits.succeeded.toLocaleString()}
              subtitle="Successfully completed"
              accent="green"
            />

            <AdminStatCard
              title="Failed"
              value={deposits.failed.toLocaleString()}
              subtitle="Payment failures"
              accent="red"
            />
          </div>
        </div> */}

        <div className="border-t border-[#E4ECF7] pt-8 dark:border-[#2D3F55]">
          <h3 className="mb-4 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Withdrawals
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard
              title="Total Withdrawals"
              value={totalWithdrawals.toLocaleString()}
              subtitle="All payout requests"
              accent="blue"
            />

            <AdminStatCard
              title="Pending"
              value={withdrawals.pending.toLocaleString()}
              subtitle="Waiting for review"
              accent="amber"
            />

            <AdminStatCard
              title="Processing"
              value={withdrawals.processing.toLocaleString()}
              subtitle="Currently being paid"
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

            <AdminStatCard
              title="Failed"
              value={withdrawals.failed.toLocaleString()}
              subtitle="Payment failures"
              accent="red"
            />
          </div>
        </div>
      </div>
    </AdminSection>
  );
}