"use client";

import * as React from "react";
import Link from "next/link";

import AdminPageHero from "@/components/admin/admin-page-hero";

type DashboardHeroProps = {
  generatedAt: string;
  healthy: boolean;
};

function formatGeneratedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DashboardHero({
  generatedAt,
  healthy,
}: DashboardHeroProps) {
  return (
    <AdminPageHero
      eyebrow="Administration"
      title="Platform Dashboard"
      description="Monitor platform activity, user growth, verification progress, financial operations, moderation workload, and overall system health from a single operational dashboard."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium ${
              healthy
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                healthy ? "bg-emerald-500" : "bg-red-500"
              }`}
            />

            {healthy ? "System Healthy" : "Attention Required"}
          </div>

          <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#16202E] px-4 py-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Last Updated
            <div className="mt-1 font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              {formatGeneratedAt(generatedAt)}
            </div>
          </div>

          <Link
            href="/admin/analytics"
            className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4678B7]"
          >
            View Analytics
          </Link>

          <Link
            href="/admin/reports"
            className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E]"
          >
            Open Reports
          </Link>
        </div>
      }
    />
  );
}