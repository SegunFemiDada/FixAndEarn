// Path: apps/web/src/app/app/notifications/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  isNotificationVisibleForRole,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from "@/lib/notifications/queries";
import type { NotificationRow } from "@/lib/notifications/api";
import { getActiveRole, type Role } from "@/lib/auth/session";

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().replace("T", " ").replace("Z", " UTC").slice(0, 23);
}

function resolveHref(n: NotificationRow): string | null {
  const data = (n as any)?.data ?? {};
  const jobId = typeof data.jobId === "string" ? data.jobId : null;

  if (typeof data.href === "string" && data.href.trim()) {
    return data.href.trim();
  }

  switch (n.type) {
    case "JOB_APPLIED":
      return jobId
        ? `/app/jobs/${jobId}/applications`
        : null;

    case "JOB_COMPLETION_REQUESTED":
    case "JOB_COMPLETION_APPROVED":
    case "JOB_COMPLETION_REJECTED":
      return jobId
        ? `/app/jobs/${jobId}`
        : null;

    case "WITHDRAWAL_REQUESTED":
    case "WITHDRAWAL_APPROVED":
    case "WITHDRAWAL_REJECTED":
    case "WITHDRAWAL_PAID":
    case "DEPOSIT_SUCCEEDED":
      return "/app/wallet";

    case "DISPUTE_OPENED":
    case "DISPUTE_RESOLVED":
      return jobId
        ? `/app/jobs/${jobId}`
        : null;

    case "SYSTEM_ANNOUNCEMENT":
      return typeof data.href === "string" && data.href.trim()
        ? data.href.trim()
        : null;

    default:
      return null;
  }
}

function roleHeading(role: Role | null) {
  if (role === "CLIENT") return "Client notifications";
  if (role === "FIXER") return "Fixer notifications";
  return "Notifications";
}

export default function NotificationsPage() {
  const [mounted, setMounted] = useState(false);
  const [activeRole, setActiveRole] = useState<Role | null>(null);

  useEffect(() => {
    setMounted(true);
    setActiveRole(getActiveRole());
  }, []);

  const { data, isLoading, isError, refetch } = useNotificationsList({ skip: 0, take: 50 });
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead(activeRole);
  const items = useMemo(() => {
    const rows = data?.notifications ?? [];
    return rows.filter((n) => isNotificationVisibleForRole(n, activeRole));
  }, [data?.notifications, activeRole]);

  const unreadCount = useMemo(() => items.filter((n) => !n.readAt).length, [items]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {roleHeading(activeRole)}
            </h1>
            <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>

          <div className="flex items-center gap-2">
           <button
  type="button"
  onClick={() => refetch()}
  disabled={isLoading}
  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100
    disabled:opacity-60 disabled:cursor-not-allowed`}
>
  Refresh
</button>

<button
  type="button"
  onClick={() => markAll.mutate(items)}
  disabled={isLoading || markAll.isPending || items.length === 0 || unreadCount === 0}
  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100
    disabled:opacity-60 disabled:cursor-not-allowed`}
>
  Mark all read
</button>

          </div>
        </div>

        {activeRole && (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
            Showing notifications for active role:{" "}
            <span className="font-semibold">{activeRole}</span>
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Loading…
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="font-semibold">Failed to load notifications</div>
            <div className="mt-3">
              <button
  type="button"
  onClick={() => refetch()}
  className={`rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors
    border-red-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700
    dark:border-red-700 dark:bg-gray-800 dark:text-red-300 dark:hover:bg-red-900/20`}
>
  Try again
</button>

            </div>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">No notifications yet</div>
            <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Nothing relevant to this active role yet.
            </div>
          </div>
        )}

        <div className="grid gap-3">
                    {items.map((n) => {
            const href = resolveHref(n);
            const isUnread = !n.readAt;
            const title = n.title || n.type || "Notification";

            return (
              <div
                key={n.id}
                className="relative overflow-hidden rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
              >
                {href ? (
                  <Link
                    href={href}
                    onClick={() => {
                      if (!n.readAt) markOne.mutate(n.id);
                    }}
                    aria-label={`Open ${title}`}
                    className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:focus-visible:ring-blue-300"
                  >
                    <span className="sr-only">Open notification</span>
                  </Link>
                ) : null}

                <div className="relative z-0 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="truncate font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {title}
                      </div>
                      {isUnread && (
                        <span className="rounded-full border border-[#5B8FCC] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 px-2 py-0.5 text-xs font-medium text-[#1A2B4A] dark:text-[#7AAEE0]">
                          Unread
                        </span>
                      )}
                    </div>

                    {n.body && (
                      <div className="mt-1 wrap-break-word text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                        {n.body}
                      </div>
                    )}

                    {n.createdAt && (
                      <div className="mt-2 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        {formatDate(n.createdAt)}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}