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

          <div className="divide-y divide-[#E4ECF7] dark:divide-[#2D3F55]">
            {activities.map((activity) => {
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
        </div>
      )}
    </AdminSection>
  );
}