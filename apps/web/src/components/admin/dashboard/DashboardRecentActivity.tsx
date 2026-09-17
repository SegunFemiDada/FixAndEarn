"use client";

import * as React from "react";

import AdminSection from "@/components/admin/AdminSection";

type Activity = {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
};

type DashboardRecentActivityProps = {
  activities: Activity[];
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function badgeColor(action: string) {
  const value = action.toLowerCase();

  if (
    value.includes("delete") ||
    value.includes("reject") ||
    value.includes("lock")
  ) {
    return {
      background:
        "bg-red-100 dark:bg-red-900/30",
      text:
        "text-red-700 dark:text-red-300",
    };
  }

  if (
    value.includes("approve") ||
    value.includes("create") ||
    value.includes("complete")
  ) {
    return {
      background:
        "bg-emerald-100 dark:bg-emerald-900/30",
      text:
        "text-emerald-700 dark:text-emerald-300",
    };
  }

  if (
    value.includes("withdraw") ||
    value.includes("finance") ||
    value.includes("payment")
  ) {
    return {
      background:
        "bg-amber-100 dark:bg-amber-900/30",
      text:
        "text-amber-700 dark:text-amber-300",
    };
  }

  if (
    value.includes("security") ||
    value.includes("permission")
  ) {
    return {
      background:
        "bg-violet-100 dark:bg-violet-900/30",
      text:
        "text-violet-700 dark:text-violet-300",
    };
  }

  return {
    background:
      "bg-[#EAF3FF] dark:bg-[#203247]",
    text:
      "text-[#2B6CB0] dark:text-[#8EC5FF]",
  };
}

function PaginatedActivityList({
  activities,
}: {
  activities: Activity[];
}) {
  const pageSize = 10;
  const [page, setPage] = React.useState(1);

  const pageCount = Math.max(1, Math.ceil(activities.length / pageSize));

  React.useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  const startIndex = (page - 1) * pageSize;
  const visibleActivities = activities.slice(
    startIndex,
    startIndex + pageSize,
  );

  const startItem = activities.length === 0 ? 0 : startIndex + 1;
  const endItem = Math.min(startIndex + pageSize, activities.length);

  const pageNumbers = React.useMemo(() => {
    if (pageCount <= 5) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    const pages: Array<number | "ellipsis"> = [1];

    if (page > 3) {
      pages.push("ellipsis");
    }

    const rangeStart = Math.max(2, page - 1);
    const rangeEnd = Math.min(pageCount - 1, page + 1);

    for (let value = rangeStart; value <= rangeEnd; value += 1) {
      pages.push(value);
    }

    if (page < pageCount - 2) {
      pages.push("ellipsis");
    }

    pages.push(pageCount);

    return pages;
  }, [page, pageCount]);

  if (activities.length === 0) {
    return null;
  }

  return (
    <>
      <div className="divide-y divide-[#E4ECF7] dark:divide-[#2D3F55]">
        {visibleActivities.map((activity) => {
          const badge = badgeColor(activity.action);

          return (
            <div
              key={activity.id}
              className="grid grid-cols-[minmax(0,1.8fr)_minmax(12rem,1fr)_auto_auto] items-center gap-6 px-5 py-4 transition hover:bg-[#F8FBFF] dark:hover:bg-[#1B2838]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {activity.action}
                </p>

                <p className="mt-1 truncate text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  {activity.description}
                </p>
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {activity.actor.fullName}
                </p>

                <p className="mt-1 truncate text-xs text-[#7E8FAE] dark:text-[#8FA0BC]">
                  {activity.actor.role}
                </p>
              </div>

              <span
                className={[
                  "rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
                  badge.background,
                  badge.text,
                ].join(" ")}
              >
                {activity.action}
              </span>

              <span className="whitespace-nowrap text-xs text-[#7E8FAE] dark:text-[#8FA0BC]">
                {formatDate(activity.createdAt)}
              </span>
            </div>
          );
        })}
      </div>

      {activities.length > pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E4ECF7] px-5 py-3 dark:border-[#2D3F55]">
          <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
            Showing {startItem}&ndash;{endItem} of {activities.length}
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page === 1}
              className="rounded-lg border border-[#D7E2F1] px-3 py-1.5 text-xs font-medium text-[#4A5F7D] transition hover:bg-[#F8FBFF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#334961] dark:text-[#B7C5D9] dark:hover:bg-[#1B2838]"
            >
              Previous
            </button>

            {pageNumbers.map((pageNumber, index) =>
              pageNumber === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-xs text-[#7E8FAE] dark:text-[#8FA0BC]"
                >
                  ...
                </span>
              ) : (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  aria-current={page === pageNumber ? "page" : undefined}
                  className={[
                    "min-w-8 rounded-lg px-2 py-1.5 text-xs font-medium transition",
                    page === pageNumber
                      ? "bg-[#1A2B4A] text-white dark:bg-[#8EC5FF] dark:text-[#142235]"
                      : "text-[#4A5F7D] hover:bg-[#F1F6FC] dark:text-[#B7C5D9] dark:hover:bg-[#1B2838]",
                  ].join(" ")}
                >
                  {pageNumber}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) => Math.min(pageCount, currentPage + 1))
              }
              disabled={page === pageCount}
              className="rounded-lg border border-[#D7E2F1] px-3 py-1.5 text-xs font-medium text-[#4A5F7D] transition hover:bg-[#F8FBFF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#334961] dark:text-[#B7C5D9] dark:hover:bg-[#1B2838]"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default function DashboardRecentActivity({
  activities,
}: DashboardRecentActivityProps) {
  return (
    <AdminSection
      title="Recent Administrator Activity"
      description="Latest actions performed by administrators across the platform."
    >
      {activities.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-[#C5D5EE] bg-[#FBFDFF] dark:border-[#2D3F55] dark:bg-[#16202E]">
          <div className="max-w-md text-center">
            <h3 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              No recent activity
            </h3>

            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Administrator actions will appear here once activity is
              recorded.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E4ECF7] bg-white dark:border-[#2D3F55] dark:bg-[#16202E]">
          <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(12rem,1fr)_auto_auto] items-center gap-6 border-b border-[#E4ECF7] bg-[#F8FBFF] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#1B2838] dark:text-[#8FA0BC]">
            <span>Activity</span>
            <span>Administrator</span>
            <span>Action</span>
            <span>Time</span>
          </div>

          <PaginatedActivityList activities={activities} />
        </div>
      )}
    </AdminSection>
  );
}
