"use client";

import Link from "next/link";
import * as React from "react";
import { useAdminJobsList } from "@/lib/admin/jobs/queries";
import type {
  AdminJobModerationStatus,
  AdminJobPostingType,
  AdminJobStatus,
} from "@/lib/admin/jobs/types";

const STATUS_OPTIONS: Array<{
  label: string;
  value: "" | AdminJobStatus;
}> = [
  { label: "All statuses", value: "" },
  { label: "Draft", value: "DRAFT" },
  { label: "Open", value: "OPEN" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Disputed", value: "DISPUTED" },
  { label: "Cancelled", value: "CANCELLED" },
];

const TYPE_OPTIONS: Array<{
  label: string;
  value: "" | AdminJobPostingType;
}> = [
  { label: "All job types", value: "" },
  { label: "Standard", value: "STANDARD" },
  { label: "Urgent", value: "URGENT" },
];
const MODERATION_OPTIONS: Array<{
  label: string;
  value: "" | AdminJobModerationStatus;
}> = [
  { label: "All moderation", value: "" },
  { label: "Clear", value: "CLEAR" },
  { label: "Flagged", value: "FLAGGED" },
];

function formatFec(milli: number | null | undefined) {
  if (typeof milli !== "number") return "—";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: AdminJobStatus) {
  switch (status) {
    case "OPEN":
      return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";

    case "IN_PROGRESS":
      return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-200";

    case "COMPLETED":
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200";

    case "DISPUTED":
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";

    case "DRAFT":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200";

    default:
      return "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200";
  }
}

export default function AdminJobsPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");

  const [status, setStatus] = React.useState<"" | AdminJobStatus>("");

  const [postingType, setPostingType] = React.useState<
    "" | AdminJobPostingType
  >("");

  const [moderationStatus, setModerationStatus] = React.useState<
    "" | AdminJobModerationStatus
  >("");

  const [skip, setSkip] = React.useState(0);

  const take = 20;

  const query = useAdminJobsList({
    q: searchTerm || undefined,
    status: status || undefined,
    postingType: postingType || undefined,
    moderationStatus: moderationStatus || undefined,
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
          Jobs
        </p>

        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          Job Operations
        </h2>

        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Investigate jobs across clients, fixers, applications, negotiations,
          payments, completion, and disputes.
        </p>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] bg-white p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] sm:p-6">
        <form
          onSubmit={submitSearch}
          className="grid gap-4 border-b border-[#C5D5EE] pb-4 dark:border-[#2D3F55] lg:grid-cols-[1fr_180px_180px_180px_auto]"
        >
          <div>
            <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Search
            </label>

            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Job ID, skill, client, or fixer"
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | AdminJobStatus);
              setSkip(0);
            }}
            className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={moderationStatus}
            onChange={(event) => {
              setModerationStatus(
                event.target.value as "" | AdminJobModerationStatus,
              );
              setSkip(0);
            }}
            className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
          >
            {MODERATION_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={postingType}
            onChange={(event) => {
              setPostingType(event.target.value as "" | AdminJobPostingType);
              setSkip(0);
            }}
            className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        {query.isLoading ? (
          <div className="py-8 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading jobs...
          </div>
        ) : query.isError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            Failed to load jobs.
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No jobs found.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {items.map((job) => (
              <article
                key={job.id}
                className="rounded-2xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {job.skillCategory}
                      </h3>

                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${statusClass(job.status)}`}
                      >
                        {job.status}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${
                          job.moderationStatus === "FLAGGED"
                            ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200"
                            : "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                        }`}
                      >
                        {job.moderationStatus === "FLAGGED"
                          ? "FLAGGED"
                          : "CLEAR"}
                      </span>

                      <span className="rounded-full border border-[#C5D5EE] bg-white px-2 py-1 text-xs font-medium text-[#516786] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#AAB9D0]">
                        {job.postingType}
                      </span>
                    </div>

                    <p className="mt-2 break-all text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      {job.id}
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Client
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {job.client.fullName}
                        </p>
                        <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                          {job.client.email}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Fixer
                        </p>
                        <p className="mt-1 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {job.fixer?.fullName ?? "Not assigned"}
                        </p>
                        <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                          {job.fixer?.email ?? "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Price
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatFec(
                            job.lockedPriceMilliFec ?? job.priceMilliFec,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Created
                        </p>
                        <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatDate(job.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      <span>{job._count.applications} applications</span>
                      <span>{job._count.conversations} conversations</span>
                      <span>{job._count.payments} payments</span>
                    </div>
                  </div>
                  {job.moderationStatus === "FLAGGED" &&
                    job.flagReason && (
                      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
                        <p className="font-semibold">
                          Moderation reason
                        </p>
                        <p className="mt-1">{job.flagReason}</p>
                      </div>
                    )}

                  <Link
                    href={`/admin/jobs/${job.id}`}
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
              onClick={() => setSkip((current) => Math.max(0, current - take))}
              disabled={!hasPrevious}
              className="rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setSkip((current) => current + take)}
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
