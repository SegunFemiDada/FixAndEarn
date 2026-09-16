// Path: apps/web/src/app/admin/finance/withdrawals/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { useAdminWithdrawalsList } from "@/lib/admin/finance/queries";
import type { WithdrawalStatus } from "@/lib/admin/finance/types";
import { formatFecFromMilli } from "@/lib/wallet/ui";

const STATUS_OPTIONS: Array<{
  label: string;
  value: "" | WithdrawalStatus;
}> = [
  { label: "All", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Paid", value: "PAID" },
];

const PANEL_CLASS =
  "rounded-2xl border border-[#C5D5EE] bg-white shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]";

const INPUT_CLASS =
  "rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-2.5 text-sm text-[#1A2B4A] outline-none transition focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:focus:border-[#5B8FCC]";

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

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
      return "border border-[#F5A623] bg-[#FEF8E7] text-[#B45309] dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300";

    case "APPROVED":
      return "border border-[#C5D5EE] bg-[#EAF0FB] text-[#5B8FCC] dark:border-[#2D3F55] dark:bg-blue-900/20 dark:text-[#7AAEE0]";

    case "PAID":
      return "border border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";

    case "REJECTED":
      return "border border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300";

    default:
      return "border border-[#C5D5EE] bg-[#F4F8FF] text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]";
  }
}

function getPayoutModeLabel(
  mode: WithdrawalListItemPayoutMode | undefined,
) {
  switch (mode) {
    case "BANK_TRANSFER":
      return "Bank transfer";

    case "MANUAL":
      return "Manual";

    default:
      return "Not available";
  }
}

type WithdrawalListItemPayoutMode = "BANK_TRANSFER" | "MANUAL";

function truncateReference(value: string | null, length = 18) {
  if (!value) return "Not available";
  if (value.length <= length) return value;

  return `${value.slice(0, length)}...`;
}

export default function AdminWithdrawalsPage() {
  const [status, setStatus] =
    React.useState<"" | WithdrawalStatus>("PENDING");

  const [skip, setSkip] = React.useState(0);

  const take = 30;

  const query = useAdminWithdrawalsList(
    {
      status: status || undefined,
      skip,
      take,
    },
    true,
  );

  const items = query.data ?? [];

  const hasPrevious = skip > 0;
  const hasNext = items.length === take;

  return (
    <div className="space-y-6">
      <section className={`${PANEL_CLASS} p-6`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Finance
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Withdrawal management
            </h2>

            <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Review withdrawal requests, payout details and transfer
              information using the live admin finance endpoint.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[#C5D5EE] bg-[#F4F8FF] px-3 py-1 text-xs font-semibold text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]">
              {items.length} loaded
            </span>
          </div>
        </div>
      </section>

      <section className={`${PANEL_CLASS} overflow-hidden`}>
        <div className="border-b border-[#C5D5EE] p-5 dark:border-[#2D3F55] xl:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Withdrawal queue
              </h3>

              <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Oldest requests appear first, matching backend ordering.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label
                htmlFor="withdrawal-status"
                className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
              >
                Status
              </label>

              <select
                id="withdrawal-status"
                value={status}
                onChange={(event) => {
                  setStatus(
                    event.target.value as "" | WithdrawalStatus,
                  );
                  setSkip(0);
                }}
                className={INPUT_CLASS}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {query.isLoading ? (
          <div className="p-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading withdrawals...
          </div>
        ) : query.isError ? (
          <div className="m-6 rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] p-4 text-sm text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
            {extractApiErrorMessage(query.error)}
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No withdrawals found for the current filter.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-7xl w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#C5D5EE] bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#16202E]">
                    <th className="sticky left-0 z-10 bg-[#F4F8FF] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:bg-[#16202E] dark:text-[#8FA0BC]">
                      Withdrawal
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      User
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Amount
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Status
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Payout
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Requested
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Review
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Transfer
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((withdrawal) => (
                    <tr
                      key={withdrawal.id}
                      className="border-b border-[#E4ECF7] last:border-b-0 hover:bg-[#F8FBFF] dark:border-[#2D3F55] dark:hover:bg-[#1A2635]"
                    >
                      <td className="sticky left-0 z-1 bg-white px-5 py-4 dark:bg-[#1E2A3A]">
                        <div className="min-w-45">
                          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                            Withdrawal
                          </div>

                          <div className="mt-1 break-all text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                            {withdrawal.id}
                          </div>

                          <div className="mt-2 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                            User ID
                          </div>

                          <div className="break-all text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {withdrawal.userId}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-47.5">
                          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {withdrawal.user.fullName}
                          </div>

                          <div className="mt-1 break-all text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                            {withdrawal.user.email}
                          </div>

                          <div className="mt-2">
                            <span
                              className={[
                                "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
                                withdrawal.user.isActive
                                  ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                                  : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
                              ].join(" ")}
                            >
                              {withdrawal.user.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-32.5 font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatFecFromMilli(
                            Number(withdrawal.amountMilliFec ?? 0),
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            withdrawal.status,
                          )}`}
                        >
                          {withdrawal.status}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-30">
                          <div className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {getPayoutModeLabel(withdrawal.payoutMode)}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-37.5 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatDateTime(withdrawal.createdAt)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-45">
                          <div className="text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {withdrawal.reviewNote || "No review note"}
                          </div>

                          <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                            {withdrawal.reviewedAt
                              ? `Reviewed ${formatDateTime(
                                  withdrawal.reviewedAt,
                                )}`
                              : "Not reviewed"}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-47.5">
                          <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Reference
                          </div>

                          <div
                            title={
                              withdrawal.transferReference ??
                              undefined
                            }
                            className="mt-1 break-all text-sm text-[#1A2B4A] dark:text-[#E8F0FA]"
                          >
                            {truncateReference(
                              withdrawal.transferReference,
                            )}
                          </div>

                          {withdrawal.transferCode ? (
                            <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                              Code: {withdrawal.transferCode}
                            </div>
                          ) : null}

                          {withdrawal.transferId ? (
                            <div className="mt-1 break-all text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                              ID: {withdrawal.transferId}
                            </div>
                          ) : null}

                          {withdrawal.paidAt ? (
                            <div className="mt-1 text-xs font-medium text-[#2E7D32] dark:text-green-300">
                              Paid {formatDateTime(withdrawal.paidAt)}
                            </div>
                          ) : null}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/admin/finance/withdrawals/${withdrawal.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1D4ED8] dark:bg-blue-500 dark:hover:bg-blue-600"
                        >
                          Open details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-[#C5D5EE] p-4 dark:border-[#2D3F55] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {items.length > 0
              ? `Showing ${skip + 1} to ${skip + items.length}`
              : "No records on this page"}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSkip((current) => Math.max(0, current - take))
              }
              disabled={!hasPrevious || query.isLoading}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                !hasPrevious || query.isLoading
                  ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              }`}
            >
              Previous
            </button>

            <span className="rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] px-3 py-2 text-sm font-medium text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]">
              Page {Math.floor(skip / take) + 1}
            </span>

            <button
              type="button"
              onClick={() => setSkip((current) => current + take)}
              disabled={!hasNext || query.isLoading}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                !hasNext || query.isLoading
                  ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}