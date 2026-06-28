// Path: apps/web/src/app/admin/finance/withdrawals/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { useAdminWithdrawalsList } from "@/lib/admin/finance/queries";
import type { WithdrawalStatus } from "@/lib/admin/finance/types";
import { formatFecFromMilli } from "@/lib/wallet/ui";

const STATUS_OPTIONS: Array<{ label: string; value: "" | WithdrawalStatus }> = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Paid", value: "PAID" },
];

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClass(status: WithdrawalStatus) {
  switch (status) {
    case "PENDING":
      return "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
    case "APPROVED":
      return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 text-[#5B8FCC] dark:text-[#7AAEE0]";
    case "PAID":
      return "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200";
    case "REJECTED":
      return "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300";
    default:
      return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] text-[#6B7C99] dark:text-[#8FA0BC]";
  }
}

export default function AdminWithdrawalsPage() {
  const [status, setStatus] = React.useState<"" | WithdrawalStatus>("PENDING");
  const [skip, setSkip] = React.useState(0);
  const take = 30;

  const query = useAdminWithdrawalsList(
    {
      status: status || undefined,
      skip,
      take,
    },
    true
  );

  const items = query.data ?? [];
  const hasPrevious = skip > 0;
  const hasNext = items.length === take;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Finance</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Withdrawal management</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Review withdrawal requests using the live admin finance endpoints only. Filters are limited to what the
          backend actually supports.
        </p>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#C5D5EE] dark:border-[#2D3F55] pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Withdrawal queue</h3>
            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Oldest requests appear first, matching backend ordering.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <label htmlFor="withdrawal-status" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Filter by status
            </label>
            <select
              id="withdrawal-status"
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as "" | WithdrawalStatus);
                setSkip(0);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {query.isLoading ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading withdrawals...</div>
        ) : query.isError ? (
          <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(query.error)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No withdrawals found for the current filter.</div>
        ) : (
          <div className="mt-4 grid gap-4">
            {items.map((withdrawal) => (
              <article key={withdrawal.id} className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{withdrawal.user.fullName}</h4>
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-medium",
                          getStatusClass(withdrawal.status),
                        ].join(" ")}
                      >
                        {withdrawal.status}
                      </span>
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-medium",
                          withdrawal.user.isActive
                            ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                            : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                        ].join(" ")}
                      >
                        {withdrawal.user.isActive ? "Active user" : "Inactive user"}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{withdrawal.user.email}</p>

                    <div className="mt-3 grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Withdrawal ID
                        </span>
                        <span className="mt-1 block break-all">{withdrawal.id}</span>
                      </div>

                      <div>
                        <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Amount
                        </span>
                        <span className="mt-1 block font-semibold">
                          {formatFecFromMilli(Number(withdrawal.amountMilliFec ?? 0))}
                        </span>
                      </div>

                      <div>
                        <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Requested
                        </span>
                        <span className="mt-1 block">{formatDateTime(withdrawal.createdAt)}</span>
                      </div>

                      <div>
                        <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Review note
                        </span>
                        <span className="mt-1 block">{withdrawal.reviewNote || "Not available"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="block text-xs font-medium uppercase text-[#6B7C99] dark:text-[#8FA0BC]">
                      Payout Mode
                    </span>
                    <span className="mt-1 block text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {withdrawal.payoutMode === "PAYSTACK"
                        ? "Paystack"
                        : withdrawal.payoutMode === "MANUAL"
                        ? "Manual"
                        : "—"}
                    </span>
                  </div>
                  <div className="flex shrink-0">
                    <Link
  href={`/admin/finance/withdrawals/${withdrawal.id}`}
  className="
    inline-flex items-center justify-center
    rounded-lg px-4 py-2 font-semibold
    bg-blue-600 text-white
    hover:bg-blue-700 focus:ring-2 focus:ring-blue-400
    transition-colors shadow-md
    dark:bg-blue-500 dark:text-white
    dark:hover:bg-blue-600 dark:focus:ring-blue-300
  "
>
  Open details
</Link>

                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button
  type="button"
  onClick={() => setSkip((current) => Math.max(0, current - take))}
  disabled={!hasPrevious || query.isLoading}
  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors
    ${!hasPrevious || query.isLoading
      ? "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-700"
      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
    }`}
>
  Previous
</button>

<button
  type="button"
  onClick={() => setSkip((current) => current + take)}
  disabled={!hasNext || query.isLoading}
  className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors
    ${!hasNext || query.isLoading
      ? "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-300 dark:border-gray-700"
      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
    }`}
>
  Next
</button>

        </div>
      </section>
    </div>
  );
}