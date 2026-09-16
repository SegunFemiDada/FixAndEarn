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
  const statusLabel = system.healthy ? "Healthy" : "Attention";
  const backendLabel = system.healthy ? "Online" : "Degraded";

  return (
    <AdminSection
      title="System Health"
      description="Current operational status of the administration platform."
    >
      <div
        className={[
          "rounded-xl border p-5",
          system.healthy
            ? "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/20"
            : "border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20",
        ].join(" ")}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span
              className={[
                "mt-1 h-3 w-3 shrink-0 rounded-full",
                system.healthy
                  ? "bg-emerald-500"
                  : "bg-red-500",
              ].join(" ")}
            />

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3
                  className={[
                    "text-lg font-semibold",
                    system.healthy
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-red-700 dark:text-red-300",
                  ].join(" ")}
                >
                  {statusLabel}
                </h3>

                <span
                  className={[
                    "rounded-full px-2.5 py-1 text-xs font-semibold",
                    system.healthy
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                  ].join(" ")}
                >
                  {backendLabel}
                </span>
              </div>

              <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                {system.healthy
                  ? "All monitored dashboard services are operating normally."
                  : "One or more services require administrator attention."}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-left lg:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Last Generated
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {formatTimestamp(system.generatedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-[#E4ECF7] bg-[#FBFDFF] px-4 py-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Backend Status
              </p>

              <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {backendLabel}
              </p>
            </div>

            <span
              className={[
                "h-2.5 w-2.5 rounded-full",
                system.healthy
                  ? "bg-emerald-500"
                  : "bg-red-500",
              ].join(" ")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#E4ECF7] bg-[#FBFDFF] px-4 py-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Monitoring
              </p>

              <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Live
              </p>
            </div>

            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
        </div>
      </div>
    </AdminSection>
  );
}