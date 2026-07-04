"use client";

import * as React from "react";

import AdminSection from "@/components/admin/AdminSection";

type DashboardSystemHealthProps = {
  system: {
    healthy: boolean;
    generatedAt: string;
  };
};

function formatTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DashboardSystemHealth({
  system,
}: DashboardSystemHealthProps) {
  return (
    <AdminSection
      title="System Health"
      description="Current operational status of the administration platform."
    >
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div
          className={[
            "flex flex-col items-center justify-center rounded-2xl border p-6",
            system.healthy
              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
              : "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30",
          ].join(" ")}
        >
          <div
            className={[
              "mb-4 h-5 w-5 rounded-full",
              system.healthy
                ? "bg-emerald-500"
                : "bg-red-500",
            ].join(" ")}
          />

          <h3
            className={[
              "text-xl font-bold",
              system.healthy
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300",
            ].join(" ")}
          >
            {system.healthy ? "Healthy" : "Attention"}
          </h3>

          <p className="mt-2 text-center text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {system.healthy
              ? "All monitored dashboard services are operating normally."
              : "One or more services require administrator attention."}
          </p>
        </div>

        <div className="rounded-2xl border border-[#E4ECF7] dark:border-[#2D3F55] bg-[#FBFDFF] dark:bg-[#16202E] p-6">
          <h3 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Dashboard Status
          </h3>

          <dl className="mt-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E4ECF7] pb-4 dark:border-[#2D3F55]">
              <dt className="text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC]">
                Backend Status
              </dt>

              <dd
                className={[
                  "rounded-full px-3 py-1 text-sm font-medium",
                  system.healthy
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                ].join(" ")}
              >
                {system.healthy ? "Online" : "Degraded"}
              </dd>
            </div>

            <div className="flex items-center justify-between border-b border-[#E4ECF7] pb-4 dark:border-[#2D3F55]">
              <dt className="text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC]">
                Dashboard Generated
              </dt>

              <dd className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                {formatTimestamp(system.generatedAt)}
              </dd>
            </div>

            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC]">
                Monitoring
              </dt>

              <dd className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Live
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </AdminSection>
  );
}