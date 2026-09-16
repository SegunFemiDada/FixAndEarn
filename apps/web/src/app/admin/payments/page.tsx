"use client";

import Link from "next/link";
import * as React from "react";
import { useAdminPaymentsList } from "@/lib/admin/payments/queries";
import type {
  AdminPaymentStatus,
  AdminPaymentType,
} from "@/lib/admin/payments/types";

const STATUS_OPTIONS: Array<{
  label: string;
  value: "" | AdminPaymentStatus;
}> = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Success", value: "SUCCESS" },
  { label: "Failed", value: "FAILED" },
  { label: "Expired", value: "EXPIRED" },
];

const TYPE_OPTIONS: Array<{
  label: string;
  value: "" | AdminPaymentType;
}> = [
  { label: "All payment types", value: "" },
  { label: "Posting", value: "POSTING" },
  { label: "Urgent", value: "URGENT" },
  { label: "Final", value: "FINAL" },
];

function formatFec(milli: number | null | undefined) {
  if (typeof milli !== "number") return "—";

  return `${(milli / 1000).toFixed(2)} FEC`;
}

function formatNaira(milli: number | null | undefined) {
  if (typeof milli !== "number") return "—";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(milli);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: AdminPaymentStatus) {
  switch (status) {
    case "SUCCESS":
      return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";

    case "PENDING":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200";

    case "FAILED":
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";

    case "EXPIRED":
      return "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200";

    default:
      return "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200";
  }
}

function typeClass(type: AdminPaymentType) {
  switch (type) {
    case "POSTING":
      return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-200";

    case "URGENT":
      return "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-200";

    case "FINAL":
      return "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-200";

    default:
      return "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200";
  }
}

export default function AdminPaymentsPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");

  const [status, setStatus] = React.useState<
    "" | AdminPaymentStatus
  >("");

  const [type, setType] = React.useState<
    "" | AdminPaymentType
  >("");

  const [skip, setSkip] = React.useState(0);

  const take = 20;

  const query = useAdminPaymentsList({
    q: searchTerm || undefined,
    status: status || undefined,
    type: type || undefined,
    skip,
    take,
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;

  const hasPrevious = skip > 0;
  const hasNext = skip + take < total;

  const pageNumber = Math.floor(skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(total / take));

  const firstItem = total === 0 ? 0 : skip + 1;
  const lastItem = Math.min(skip + take, total);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();

    setSkip(0);
    setSearchTerm(searchInput.trim());
  }

  function goToPreviousPage() {
    if (!hasPrevious) return;

    setSkip(Math.max(0, skip - take));
  }

  function goToNextPage() {
    if (!hasNext) return;

    setSkip(skip + take);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
          Payments
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          Payment Operations
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Investigate job payments, payment status, Monnify references,
          payment timing, and their relationship to jobs and users.
        </p>

        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          Payment Operations is for investigation and reconciliation.
          Customer payments are processed through Monnify; this page does
          not custody funds or initiate withdrawals.
        </div>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] bg-white p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] sm:p-6">
        <form
          onSubmit={submitSearch}
          className="grid gap-4 border-b border-[#C5D5EE] pb-4 dark:border-[#2D3F55] lg:grid-cols-[minmax(320px,1fr)_200px_200px_auto]"
        >
          <div>
            <label
              htmlFor="payment-search"
              className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
            >
              Search
            </label>

            <input
              id="payment-search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Payment ID, reference, job ID, client, or fixer"
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            />
          </div>

          <div>
            <label
              htmlFor="payment-status"
              className="sr-only"
            >
              Payment status
            </label>

            <select
              id="payment-status"
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value as
                    | ""
                    | AdminPaymentStatus,
                );
                setSkip(0);
              }}
              className="w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            >
              {STATUS_OPTIONS.map((option) => (
                <option
                  key={option.label}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="payment-type"
              className="sr-only"
            >
              Payment type
            </label>

            <select
              id="payment-type"
              value={type}
              onChange={(event) => {
                setType(
                  event.target.value as
                    | ""
                    | AdminPaymentType,
                );
                setSkip(0);
              }}
              className="w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            >
              {TYPE_OPTIONS.map((option) => (
                <option
                  key={option.label}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        {query.isLoading ? (
          <div className="py-8 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading payments...
          </div>
        ) : query.isError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            Failed to load payment records.
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No payment records found.
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-hidden rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55]">
              <div className="overflow-x-auto">
                <table className="min-w-325 w-full border-collapse text-left">
                  <thead className="sticky top-0 z-10 bg-[#EEF4FC] dark:bg-[#1A2636]">
                    <tr className="border-b border-[#C5D5EE] dark:border-[#2D3F55]">
                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Payment
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Status
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Amount
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Monnify Reference
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Job
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Client
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Fixer
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Fee
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Created
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Paid At
                      </th>

                      <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#D9E3F1] dark:divide-[#2D3F55]">
                    {items.map((payment) => (
                      <tr
                        key={payment.id}
                        className="bg-white transition-colors hover:bg-[#F4F8FF] dark:bg-[#1E2A3A] dark:hover:bg-[#243247]"
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-50">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${typeClass(
                                payment.type,
                              )}`}
                            >
                              {payment.type}
                            </span>

                            <div className="mt-2 max-w-55 truncate text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {payment.id}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                              payment.status as AdminPaymentStatus,
                            )}`}
                          >
                            {payment.status}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="min-w-32.5">
                            <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {formatFec(
                                payment.amountMilliFec,
                              )}
                            </div>

                            <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                              {formatNaira(
                                payment.amountMilliFec,
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="min-w-55">
                            <div className="break-all text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {payment.paymentReference}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="min-w-42.5">
                            <div className="break-all text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {payment.jobId}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="min-w-47.5">
                            <div className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {payment.job.client.fullName}
                            </div>

                            <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                              {payment.job.client.email}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="min-w-47.5">
                            <div className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {payment.job.fixer?.fullName ??
                                "Not assigned"}
                            </div>

                            <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                              {payment.job.fixer?.email ?? "—"}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="min-w-27.5 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {formatNaira(
                              payment.paymentFeeMilliFec,
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="min-w-40 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {formatDate(payment.createdAt)}
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="min-w-40 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {formatDate(payment.paidAt)}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right align-top">
                          <Link
                            href={`/admin/payments/${payment.id}`}
                            className="inline-flex whitespace-nowrap rounded-lg border border-[#B8CBE5] bg-white px-3 py-2 text-sm font-semibold text-[#315A8A] transition-colors hover:bg-[#EEF4FC] focus:outline-none focus:ring-2 focus:ring-[#5B8FCC]/30 dark:border-[#3B506A] dark:bg-[#16202E] dark:text-[#A9C8EA] dark:hover:bg-[#243247]"
                          >
                            View details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#C5D5EE] pt-4 dark:border-[#2D3F55] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Showing{" "}
                <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {firstItem}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {lastItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {total}
                </span>{" "}
                payments
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={!hasPrevious}
                  className="rounded-lg border border-[#C5D5EE] bg-white px-3 py-2 text-sm font-semibold text-[#315A8A] transition-colors hover:bg-[#EEF4FC] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3B506A] dark:bg-[#16202E] dark:text-[#A9C8EA] dark:hover:bg-[#243247]"
                >
                  Previous
                </button>

                <span className="min-w-24 text-center text-sm font-medium text-[#516786] dark:text-[#AAB9D0]">
                  Page {pageNumber} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={!hasNext}
                  className="rounded-lg border border-[#C5D5EE] bg-white px-3 py-2 text-sm font-semibold text-[#315A8A] transition-colors hover:bg-[#EEF4FC] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3B506A] dark:bg-[#16202E] dark:text-[#A9C8EA] dark:hover:bg-[#243247]"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}