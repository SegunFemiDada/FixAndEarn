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

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();

    setSkip(0);
    setSearchTerm(searchInput.trim());
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
          className="grid gap-4 border-b border-[#C5D5EE] pb-4 dark:border-[#2D3F55] lg:grid-cols-[1fr_200px_200px_auto]"
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
          <div className="mt-4 space-y-4">
            {items.map((payment) => (
              <article
                key={payment.id}
                className="rounded-2xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${typeClass(
                          payment.type,
                        )}`}
                      >
                        {payment.type}
                      </span>

                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClass(
                          payment.status as AdminPaymentStatus,
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {formatFec(payment.amountMilliFec)}
                      </p>

                      <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        {formatNaira(payment.amountMilliFec)}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Payment ID
                        </p>

                        <p className="mt-1 break-all text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {payment.id}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Monnify Reference
                        </p>

                        <p className="mt-1 break-all text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {payment.paymentReference}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Job
                        </p>

                        <p className="mt-1 break-all text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {payment.jobId}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Created
                        </p>

                        <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatDate(payment.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Client
                        </p>

                        <p className="mt-1 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {payment.job.client.fullName}
                        </p>

                        <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                          {payment.job.client.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Fixer
                        </p>

                        <p className="mt-1 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {payment.job.fixer?.fullName ??
                            "Not assigned"}
                        </p>

                        <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                          {payment.job.fixer?.email ?? "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Payment Fee
                        </p>

                        <p className="mt-1 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatNaira(
                            payment.paymentFeeMilliFec,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Paid At
                        </p>

                        <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatDate(payment.paidAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/payments/${payment.id}`}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-400 dark:bg-green-500 dark:hover:bg-green-600"
                  >
                    Open Investigation
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <span className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
            Showing {items.length} of {total}
          </span>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setSkip((current) =>
                  Math.max(0, current - take),
                )
              }
              disabled={!hasPrevious}
              className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() =>
                setSkip((current) => current + take)
              }
              disabled={!hasNext}
              className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}