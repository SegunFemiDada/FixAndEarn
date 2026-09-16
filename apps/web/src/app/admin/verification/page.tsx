// Path: apps/web/src/app/admin/verification/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { usePendingVerifications } from "@/lib/admin/verification/queries";

const PANEL_CLASS =
  "rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]";

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatLocation(parts: Array<string | null | undefined>) {
  return parts.filter((part) => part && part.trim()).join(", ");
}

function formatSkills(skills: string | null) {
  if (!skills?.trim()) return [];

  return skills
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning" | "success" | "danger" | "info";
}) {
  const styles = {
    neutral:
      "border-[#CBD5E1] bg-[#F8FAFC] text-[#475569] dark:border-[#475569] dark:bg-[#1E293B] dark:text-[#CBD5E1]",
    warning:
      "border-[#F5A623] bg-[#FEF8E7] text-[#B45309] dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    success:
      "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200",
    danger:
      "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
    info:
      "border-[#BFD5F2] bg-[#F1F6FD] text-[#31557D] dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

export default function AdminVerificationQueuePage() {
  const [skip, setSkip] = React.useState(0);
  const take = 20;

  const query = usePendingVerifications({ skip, take });

  const items = query.data ?? [];
  const hasPrevious = skip > 0;
  const hasNext = items.length === take;

  return (
    <div className="min-w-0 space-y-6">
      {/* Page header */}
      <section className={PANEL_CLASS}>
        <div className="px-6 py-5 xl:px-7 xl:py-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                Verification
              </p>

              <h1 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Pending verification queue
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                Review verification submissions awaiting admin action using
                the live pending verification endpoint.
              </p>
            </div>

            <div className="rounded-xl border border-[#D7E2F2] bg-[#F4F8FF] px-4 py-3 dark:border-[#30445C] dark:bg-[#16202E]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#8EA3BC]">
                Page size
              </p>

              <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {take} submissions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Operational queue */}
      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-4 border-b border-[#D7E2F2] px-6 py-5 dark:border-[#30445C] xl:flex-row xl:items-center xl:justify-between xl:px-7">
          <div>
            <h2 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Submissions awaiting review
            </h2>

            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Ordered by oldest first, matching backend behavior.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setSkip((current) => Math.max(0, current - take))
              }
              disabled={!hasPrevious || query.isLoading}
              className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                !hasPrevious || query.isLoading
                  ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              }`}
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => setSkip((current) => current + take)}
              disabled={!hasNext || query.isLoading}
              className={`inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                !hasNext || query.isLoading
                  ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              }`}
            >
              Next
            </button>
          </div>
        </div>

        {query.isLoading ? (
          <div className="px-6 py-10 text-sm text-[#6B7C99] dark:text-[#8FA0BC] xl:px-7">
            Loading pending verifications...
          </div>
        ) : query.isError ? (
          <div className="p-6 xl:p-7">
            <div className="rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] p-4 text-sm text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
              {extractApiErrorMessage(query.error)}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-10 text-sm text-[#6B7C99] dark:text-[#8FA0BC] xl:px-7">
            No pending verification submissions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-295 w-full text-left">
              <thead className="border-b border-[#D7E2F2] bg-[#F8FAFD] dark:border-[#30445C] dark:bg-[#172334]">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#8EA3BC]">
                    Applicant
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#8EA3BC]">
                    Verification
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#8EA3BC]">
                    Account
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#8EA3BC]">
                    NIN
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#8EA3BC]">
                    Location
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#8EA3BC]">
                    Submitted
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[#64748B] dark:text-[#8EA3BC]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#30445C]">
                {items.map((item) => {
                  const location = formatLocation([
                    item.lga,
                    item.city,
                    item.state,
                  ]);

                  const skills = formatSkills(item.skills);

                  return (
                    <tr
                      key={item.id}
                      className="transition-colors hover:bg-[#F8FAFD] dark:hover:bg-[#172334]"
                    >
                      {/* Applicant */}
                      <td className="px-5 py-4 align-top">
                        <div className="min-w-55">
                          <p className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {item.user.fullName}
                          </p>

                          <p className="mt-1 max-w-62.5 truncate text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                            {item.user.email}
                          </p>

                          <p className="mt-1 break-all text-xs text-[#8291A7] dark:text-[#74859C]">
                            {item.userId}
                          </p>
                        </div>
                      </td>

                      {/* Verification */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          <StatusBadge tone="warning">
                            {item.status}
                          </StatusBadge>

                          <p className="max-w-47.5 break-all text-xs text-[#8291A7] dark:text-[#74859C]">
                            {item.id}
                          </p>

                          {skills.length > 0 && (
                            <p className="text-xs text-[#64748B] dark:text-[#8FA0BC]">
                              {skills.length} skill
                              {skills.length === 1 ? "" : "s"} provided
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Account */}
                      <td className="px-5 py-4 align-top">
                        <StatusBadge
                          tone={item.user.isActive ? "success" : "danger"}
                        >
                          {item.user.isActive ? "Active" : "Inactive"}
                        </StatusBadge>
                      </td>

                      {/* NIN */}
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-2">
                          <StatusBadge
                            tone={
                              item.ninVerificationStatus === "VERIFIED"
                                ? "success"
                                : item.ninVerificationStatus === "FAILED"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {item.ninVerificationStatus}
                          </StatusBadge>

                          {item.ninVerificationNote && (
                            <p className="max-w-55 text-xs leading-5 text-[#64748B] dark:text-[#8FA0BC]">
                              {item.ninVerificationNote}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="px-5 py-4 align-top">
                        <p className="max-w-45 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {location || "Not available"}
                        </p>
                      </td>

                      {/* Submitted */}
                      <td className="px-5 py-4 align-top">
                        <p className="whitespace-nowrap text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatDateTime(item.createdAt)}
                        </p>

                        <p className="mt-1 text-xs text-[#8291A7] dark:text-[#74859C]">
                          Updated {formatDateTime(item.updatedAt)}
                        </p>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-4 text-right align-top">
                        <Link
                          href={`/admin/verification/${item.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] bg-white px-4 py-2 text-sm font-medium text-[#31557D] transition hover:bg-[#F4F8FF] hover:text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#AFC6E1] dark:hover:bg-[#16202E] dark:hover:text-[#E8F0FA]"
                        >
                          Open details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!query.isLoading && !query.isError && items.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-[#D7E2F2] px-6 py-4 dark:border-[#30445C] sm:flex-row sm:items-center sm:justify-between xl:px-7">
            <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
              Showing {skip + 1} to {skip + items.length}
            </p>

            <p className="text-xs text-[#8291A7] dark:text-[#74859C]">
              Page {Math.floor(skip / take) + 1}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}