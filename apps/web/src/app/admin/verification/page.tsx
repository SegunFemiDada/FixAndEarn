// Path: apps/web/src/app/admin/verification/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { usePendingVerifications } from "@/lib/admin/verification/queries";

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatSkills(skills: string | null) {
  if (!skills?.trim()) return [];

  return skills
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatLocation(parts: Array<string | null | undefined>) {
  return parts.filter((part) => part && part.trim()).join(", ");
}

export default function AdminVerificationQueuePage() {
  const [skip, setSkip] = React.useState(0);
  const take = 20;

  const query = usePendingVerifications({ skip, take });

  const items = query.data ?? [];
  const hasPrevious = skip > 0;
  const hasNext = items.length === take;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Verification</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Pending verification queue</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Uses the live pending verification endpoint with backend pagination parameters only.
        </p>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#C5D5EE] dark:border-[#2D3F55] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Submissions awaiting review</h3>
            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Ordered by oldest first, matching backend behavior.
            </p>
          </div>

          <div className="flex items-center gap-2">
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
        </div>

        {query.isLoading ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading pending verifications...</div>
        ) : query.isError ? (
          <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(query.error)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No pending verification submissions found.</div>
        ) : (
          <div className="mt-4 grid gap-4">
            {items.map((item) => {
              const skills = formatSkills(item.skills);
              const location = formatLocation([item.lga, item.city, item.state]);

              return (
                <article key={item.id} className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{item.user.fullName}</h4>
                        <span className="rounded-full border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 px-3 py-1 text-xs font-medium text-[#B45309] dark:text-amber-300">
                          {item.status}
                        </span>
                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-medium",
                            item.user.isActive
                              ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                              : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                          ].join(" ")}
                        >
                          {item.user.isActive ? "Active user" : "Inactive user"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{item.user.email}</p>

                      <div className="mt-3 grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Verification ID
                          </span>
                          <span className="mt-1 block break-all">{item.id}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            User ID
                          </span>
                          <span className="mt-1 block break-all">{item.userId}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Submitted
                          </span>
                          <span className="mt-1 block">{formatDateTime(item.createdAt)}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Location
                          </span>
                          <span className="mt-1 block">{location || "Not available"}</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                          Skills
                        </span>
                        {skills.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {skills.map((skill) => (
                              <span
                                key={`${item.id}-${skill}`}
                                className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-3 py-1 text-xs font-medium text-[#6B7C99] dark:text-[#8FA0BC]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No skills provided.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0">
                      <Link
                        href={`/admin/verification/${item.id}`}
                        className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
                      >
                        Open details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}