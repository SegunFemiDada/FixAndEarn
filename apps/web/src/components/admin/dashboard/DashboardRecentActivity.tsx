"use client";

import * as React from "react";

import AdminSection from "@/components/admin/AdminSection";
import AdminActivityCard from "@/components/admin/AdminActivityCard";

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

function badgeColor(
  action: string,
):
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple" {
  const value = action.toLowerCase();

  if (
    value.includes("delete") ||
    value.includes("reject") ||
    value.includes("lock")
  ) {
    return "red";
  }

  if (
    value.includes("approve") ||
    value.includes("create") ||
    value.includes("complete")
  ) {
    return "green";
  }

  if (
    value.includes("withdraw") ||
    value.includes("finance") ||
    value.includes("payment")
  ) {
    return "amber";
  }

  if (
    value.includes("security") ||
    value.includes("permission")
  ) {
    return "purple";
  }

  return "blue";
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
        <div className="flex min-h-45 items-center justify-center rounded-2xl border border-dashed border-[#C5D5EE] dark:border-[#2D3F55] bg-[#FBFDFF] dark:bg-[#16202E]">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              No recent activity
            </h3>

            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Administrator actions will appear here once activity is
              recorded.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <AdminActivityCard
              key={activity.id}
              title={activity.action}
              description={activity.description}
              timestamp={formatDate(activity.createdAt)}
              actor={`${activity.actor.fullName} (${activity.actor.role})`}
              badge={activity.action}
              badgeColor={badgeColor(activity.action)}
            />
          ))}
        </div>
      )}
    </AdminSection>
  );
}