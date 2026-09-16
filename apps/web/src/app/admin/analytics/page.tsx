"use client";

import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { useAdminAnalyticsOverview } from "@/lib/admin/analytics/queries";
import type {
  AdminAnalyticsChartItem,
  AdminAnalyticsRange,
  AdminAnalyticsTimelineItem,
} from "@/lib/admin/analytics/types";
import { formatFecFromMilli } from "@/lib/wallet/ui";

const RANGE_OPTIONS: Array<{
  label: string;
  value: AdminAnalyticsRange;
}> = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All time", value: "all" },
];

const PIE_SEGMENT_COLORS = [
  "#2563EB",
  "#7C3AED",
  "#0891B2",
  "#059669",
  "#D97706",
];

const PIE_LEGEND_BG = [
  "bg-blue-600",
  "bg-violet-600",
  "bg-cyan-600",
  "bg-emerald-600",
  "bg-amber-600",
];

type ChartMode = "bar" | "pie";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatInteger(value: number | null | undefined) {
  return new Intl.NumberFormat("en-NG").format(Number(value ?? 0));
}

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

const panelClass =
  "rounded-xl border border-[#C5D5EE] bg-white shadow-[0_4px_24px_rgba(91,143,204,0.10)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]";

const mutedPanelClass =
  "rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#16202E]";

const labelClass =
  "text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]";

const valueClass =
  "text-[#1A2B4A] dark:text-[#E8F0FA]";

function PageHeader({
  range,
  chartMode,
  onRangeChange,
  onChartModeChange,
}: {
  range: AdminAnalyticsRange;
  chartMode: ChartMode;
  onRangeChange: (range: AdminAnalyticsRange) => void;
  onChartModeChange: (mode: ChartMode) => void;
}) {
  return (
    <section className={cn(panelClass, "p-5 xl:p-6")}>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA]">
              Admin analytics
            </h1>

            <span className="inline-flex items-center rounded-full border border-[#C5D5EE] bg-[#EAF0FB] px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]">
              Live data
            </span>
          </div>

          <p className="mt-1.5 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Operational overview of users, marketplace activity, jobs, and
            platform finance.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end xl:justify-end">
          <div className="min-w-45">
            <label
              htmlFor="analytics-range"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]"
            >
              Time range
            </label>

            <select
              id="analytics-range"
              value={range}
              onChange={(event) =>
                onRangeChange(event.target.value as AdminAnalyticsRange)
              }
              className="h-10 w-full rounded-lg border border-[#C5D5EE] bg-white px-3 text-sm text-[#1A2B4A] outline-none transition focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:focus:border-[#5B8FCC]"
            >
              {RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Chart mode
            </span>

            <div
              className="flex h-10 rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] p-1 dark:border-[#2D3F55] dark:bg-[#16202E]"
              role="tablist"
              aria-label="Chart mode"
            >
              <button
                type="button"
                onClick={() => onChartModeChange("bar")}
                className={cn(
                  "rounded-md px-4 text-sm font-medium transition",
                  chartMode === "bar"
                    ? "bg-[#5B8FCC] text-white shadow-sm"
                    : "text-[#6B7C99] hover:bg-[#EAF0FB] dark:text-[#8FA0BC] dark:hover:bg-[#1E2A3A]"
                )}
                aria-pressed={chartMode === "bar"}
              >
                Bar
              </button>

              <button
                type="button"
                onClick={() => onChartModeChange("pie")}
                className={cn(
                  "rounded-md px-4 text-sm font-medium transition",
                  chartMode === "pie"
                    ? "bg-[#5B8FCC] text-white shadow-sm"
                    : "text-[#6B7C99] hover:bg-[#EAF0FB] dark:text-[#8FA0BC] dark:hover:bg-[#1E2A3A]"
                )}
                aria-pressed={chartMode === "pie"}
              >
                Pie
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        {title}
      </h2>

      {description ? (
        <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function KpiCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <article
      className={cn(
        panelClass,
        "min-w-0 p-4 transition-shadow hover:shadow-[0_8px_30px_rgba(91,143,204,0.16)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
      )}
    >
      <p className={labelClass}>{label}</p>

      <div
        className={cn(
          "mt-2 wrap-break-word text-2xl font-semibold leading-tight",
          valueClass
        )}
      >
        {value}
      </div>

      {helper ? (
        <p className="mt-2 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
          {helper}
        </p>
      ) : null}
    </article>
  );
}

function EmptyChartState({
  message = "No data available.",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-55 items-center justify-center rounded-lg border border-dashed border-[#C5D5EE] bg-[#F4F8FF] px-4 text-center text-sm text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]">
      {message}
    </div>
  );
}

function SimpleBarChart({
  title,
  items,
  valueFormatter,
}: {
  title: string;
  items: AdminAnalyticsChartItem[];
  valueFormatter?: (value: number) => string;
}) {
  const max = Math.max(0, ...items.map((item) => item.value));

  return (
    <section className={cn(panelClass, "p-5")}>
      <h3 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        {title}
      </h3>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyChartState />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const width =
              max > 0 ? `${(item.value / max) * 100}%` : "0%";

            return (
              <div key={item.label}>
                <div className="mb-1.5 flex items-start justify-between gap-4 text-sm">
                  <span className="min-w-0 font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {item.label}
                  </span>

                  <span className="shrink-0 text-right font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {valueFormatter
                      ? valueFormatter(item.value)
                      : formatInteger(item.value)}
                  </span>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-[#EAF0FB] dark:bg-[#16202E]">
                  <div
                    className="h-full rounded-full bg-[#5B8FCC] transition-[width] duration-300 dark:bg-[#5B8FCC]"
                    style={{ width }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PieChartCard({
  title,
  items,
  valueFormatter,
}: {
  title: string;
  items: AdminAnalyticsChartItem[];
  valueFormatter?: (value: number) => string;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);

  const segments = React.useMemo(() => {
    if (total <= 0) {
      return "conic-gradient(#C5D5EE 0deg 360deg)";
    }

    let cursor = 0;

    const stops = items.map((item, index) => {
      const angle = (item.value / total) * 360;
      const start = cursor;
      const end = cursor + angle;

      cursor = end;

      return `${PIE_SEGMENT_COLORS[index % PIE_SEGMENT_COLORS.length]} ${start}deg ${end}deg`;
    });

    return `conic-gradient(${stops.join(", ")})`;
  }, [items, total]);

  return (
    <section className={cn(panelClass, "p-5")}>
      <h3 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        {title}
      </h3>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyChartState />
        </div>
      ) : (
        <div className="mt-5 grid gap-6 xl:grid-cols-[200px_minmax(0,1fr)] xl:items-center">
          <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-[#C5D5EE] bg-white dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
            <div
              className="relative h-40 w-40 rounded-full"
              style={{ background: segments }}
              aria-hidden="true"
            >
              <div className="absolute inset-[22%] rounded-full bg-white dark:bg-[#1E2A3A]" />
            </div>
          </div>

          <div className="min-w-0 space-y-2.5">
            <div
              className={cn(
                mutedPanelClass,
                "flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm"
              )}
            >
              <span className="text-[#6B7C99] dark:text-[#8FA0BC]">
                Total
              </span>

              <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {valueFormatter
                  ? valueFormatter(total)
                  : formatInteger(total)}
              </span>
            </div>

            {items.map((item, index) => {
              const pct =
                total > 0
                  ? ((item.value / total) * 100).toFixed(1)
                  : "0.0";

              return (
                <div
                  key={item.label}
                  className={cn(
                    mutedPanelClass,
                    "flex items-center justify-between gap-3 px-3.5 py-2.5"
                  )}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 shrink-0 rounded-full",
                        PIE_LEGEND_BG[index % PIE_LEGEND_BG.length]
                      )}
                    />

                    <span className="truncate text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {item.label}
                    </span>
                  </div>

                  <div className="shrink-0 text-right text-sm">
                    <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {valueFormatter
                        ? valueFormatter(item.value)
                        : formatInteger(item.value)}
                    </div>

                    <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      {pct}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function TimelineBarChart({
  items,
}: {
  items: AdminAnalyticsTimelineItem[];
}) {
  const maxValue = Math.max(
    0,
    ...items.flatMap((item) => [
      item.registrations,
      item.jobsPosted,
      item.jobsCompleted,
      item.withdrawalsMilliFec,
      item.postingFeesMilliFec,
      item.urgentHireFeesMilliFec,
      item.platformCommissionMilliFec,
    ])
  );

  const metrics: Array<{
    key:
      | "registrations"
      | "jobsPosted"
      | "jobsCompleted"
      | "withdrawalsMilliFec"
      | "postingFeesMilliFec"
      | "urgentHireFeesMilliFec"
      | "platformCommissionMilliFec";
    label: string;
    formatter: (value: number) => string;
  }> = [
    {
      key: "registrations",
      label: "Registrations",
      formatter: formatInteger,
    },
    {
      key: "jobsPosted",
      label: "Jobs posted",
      formatter: formatInteger,
    },
    {
      key: "jobsCompleted",
      label: "Jobs completed",
      formatter: formatInteger,
    },
    {
      key: "withdrawalsMilliFec",
      label: "Withdrawals",
      formatter: formatFecFromMilli,
    },
    {
      key: "postingFeesMilliFec",
      label: "Posting fees",
      formatter: formatFecFromMilli,
    },
    {
      key: "urgentHireFeesMilliFec",
      label: "Urgent hire fees",
      formatter: formatFecFromMilli,
    },
    {
      key: "platformCommissionMilliFec",
      label: "Platform commission",
      formatter: formatFecFromMilli,
    },
  ];

  return (
    <section className={cn(panelClass, "p-5")}>
      <div>
        <h3 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          Timeline
        </h3>

        <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Backend timeline for jobs and finance in the selected period.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyChartState message="No timeline data available." />
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {items.map((item) => (
            <div
              key={item.label}
              className={cn(
                mutedPanelClass,
                "overflow-hidden p-4"
              )}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {item.label}
                </span>
              </div>

              <div className="grid gap-x-6 gap-y-4 xl:grid-cols-2">
                {metrics.map((metric) => {
                  const value = item[metric.key];

                  const width =
                    maxValue > 0
                      ? `${(value / maxValue) * 100}%`
                      : "0%";

                  return (
                    <div key={metric.key}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                        <span className="text-[#6B7C99] dark:text-[#8FA0BC]">
                          {metric.label}
                        </span>

                        <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {metric.formatter(value)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[#EAF0FB] dark:bg-[#16202E]">
                        <div
                          className="h-full rounded-full bg-[#5B8FCC] dark:bg-[#5B8FCC]"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AnalyticsLoadingState() {
  return (
    <div className="space-y-6">
      <section className={cn(panelClass, "p-6")}>
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
          <div className="h-4 w-80 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />

          <div className="grid gap-4 xl:grid-cols-[1fr_auto_auto]">
            <div className="h-10 rounded-lg bg-[#EAF0FB] dark:bg-[#16202E]" />
            <div className="h-10 w-45 rounded-lg bg-[#EAF0FB] dark:bg-[#16202E]" />
            <div className="h-10 w-40 rounded-lg bg-[#EAF0FB] dark:bg-[#16202E]" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              panelClass,
              "h-30 animate-pulse"
            )}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              panelClass,
              "h-72 animate-pulse"
            )}
          />
        ))}
      </section>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] p-6 dark:border-red-700 dark:bg-red-900/20">
      <h2 className="text-base font-semibold text-[#D9534F] dark:text-red-300">
        Failed to load analytics
      </h2>

      <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">
        {message}
      </p>
    </section>
  );
}

function NoDataState() {
  return (
    <section className={cn(panelClass, "p-6")}>
      <h2 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        Admin analytics
      </h2>

      <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        No analytics data was returned.
      </p>
    </section>
  );
}

export default function AdminAnalyticsPage() {
  const [range, setRange] =
    React.useState<AdminAnalyticsRange>("week");

  const [chartMode, setChartMode] =
    React.useState<ChartMode>("bar");

  const query = useAdminAnalyticsOverview(
    {
      range,
    },
    true
  );

  const analytics = query.data;

  const financeFormatter = React.useCallback(
    (value: number) => formatFecFromMilli(value),
    []
  );

  if (query.isLoading) {
    return <AnalyticsLoadingState />;
  }

  if (query.isError) {
    return (
      <ErrorState
        message={extractApiErrorMessage(query.error)}
      />
    );
  }

  if (!analytics) {
    return <NoDataState />;
  }

  const registrationTimelineItems: AdminAnalyticsChartItem[] =
    analytics.charts.timeline.map((item) => ({
      label: item.label,
      value: item.registrations,
    }));

  return (
    <div className="space-y-7">
      <PageHeader
        range={range}
        chartMode={chartMode}
        onRangeChange={setRange}
        onChartModeChange={setChartMode}
      />

      <section className="space-y-4">
        <SectionHeader
          title="Period snapshot"
          description="The selected reporting window and current platform snapshot."
        />

        <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
          <div className={cn(panelClass, "p-5")}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className={cn(mutedPanelClass, "p-4")}>
                <p className={labelClass}>Selected period</p>

                <div className="mt-2 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {analytics.period.label}
                </div>
              </div>

              <div className={cn(mutedPanelClass, "p-4")}>
                <p className={labelClass}>From</p>

                <div className="mt-2 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatDateTime(analytics.period.from)}
                </div>
              </div>

              <div className={cn(mutedPanelClass, "p-4")}>
                <p className={labelClass}>To</p>

                <div className="mt-2 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatDateTime(analytics.period.to)}
                </div>
              </div>
            </div>
          </div>

          <div className={cn(panelClass, "p-5")}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div className={cn(mutedPanelClass, "p-4")}>
                <p className={labelClass}>Total platform funds</p>

                <div className="mt-2 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatFecFromMilli(
                    analytics.finance.totalPlatformFundsMilliFec
                  )}
                </div>
              </div>

              <div className={cn(mutedPanelClass, "p-4")}>
                <p className={labelClass}>Jobs completed overall</p>

                <div className="mt-2 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatInteger(
                    analytics.jobs.totalJobsCompletedOverall
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Registration metrics"
          description="New user sign-ups in the selected period."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Registrations in selected period"
            value={formatInteger(
              analytics.registrations.registrationsInRange
            )}
            helper="New users in the selected period"
          />

          <KpiCard
            label="Total registrations"
            value={formatInteger(
              analytics.registrations.totalRegistrations
            )}
            helper="All registered users ever"
          />
        </div>
      </section>

      <SimpleBarChart
        title="Registrations over time"
        items={registrationTimelineItems}
      />

      <section className="space-y-4">
        <SectionHeader
          title="Client activity"
          description="Based on job posting behaviour within the selected period."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total clients"
            value={formatInteger(
              analytics.clientActivity.totalClients
            )}
          />

          <KpiCard
            label="Active clients"
            value={formatInteger(
              analytics.clientActivity.activeClients
            )}
            helper="Posted at least one job in period"
          />

          <KpiCard
            label="Dormant clients"
            value={formatInteger(
              analytics.clientActivity.dormantClients
            )}
            helper="No job posted in period"
          />

          <KpiCard
            label="Never posted"
            value={formatInteger(
              analytics.clientActivity.clientsWhoNeverPosted
            )}
            helper="Registered but never posted any job"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Fixer activity"
          description="Based on assigned IN_PROGRESS or COMPLETED jobs within the selected period."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total fixers"
            value={formatInteger(
              analytics.fixerActivity.totalFixers
            )}
          />

          <KpiCard
            label="Active working fixers"
            value={formatInteger(
              analytics.fixerActivity.activeWorkingFixers
            )}
            helper="Assigned to active or completed job in period"
          />

          <KpiCard
            label="Dormant fixers"
            value={formatInteger(
              analytics.fixerActivity.dormantFixers
            )}
            helper="No assigned work in period"
          />

          <KpiCard
            label="Applying only"
            value={formatInteger(
              analytics.fixerActivity.applyingOnlyFixers
            )}
            helper="Applied but never assigned"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="User metrics"
          description="Role distribution and current user activity."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <KpiCard
            label="Total users"
            value={formatInteger(analytics.users.totalUsers)}
            helper="All registered users"
          />

          <KpiCard
            label="Total fixers"
            value={formatInteger(analytics.users.totalFixers)}
            helper="Users with fixer role"
          />

          <KpiCard
            label="Total clients"
            value={formatInteger(analytics.users.totalClients)}
            helper="Users with client role"
          />

          <KpiCard
            label="Single-role users"
            value={formatInteger(
              analytics.users.totalSingleRoleUsers
            )}
            helper="Users with one active marketplace role"
          />

          <KpiCard
            label="Dual-role users"
            value={formatInteger(
              analytics.users.totalDualRoleUsers
            )}
            helper="Users with both client and fixer roles"
          />

          <KpiCard
            label="Current active users"
            value={formatInteger(
              analytics.users.currentActiveUsers
            )}
            helper="Currently active accounts"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Job metrics"
          description="Delivery outcomes across posted and completed jobs."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Jobs posted"
            value={formatInteger(
              analytics.jobs.totalJobsPosted
            )}
          />

          <KpiCard
            label="Completed without dispute"
            value={formatInteger(
              analytics.jobs.totalJobsCompletedWithoutDispute
            )}
          />

          <KpiCard
            label="Completed with dispute"
            value={formatInteger(
              analytics.jobs.totalJobsCompletedWithDispute
            )}
          />

          <KpiCard
            label="Completed overall"
            value={formatInteger(
              analytics.jobs.totalJobsCompletedOverall
            )}
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Finance metrics"
          description="Withdrawals, fees, commission, and total platform funds."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Total withdrawals"
            value={formatFecFromMilli(
              analytics.finance.totalWithdrawalsMilliFec
            )}
          />

          <KpiCard
            label="Job posting fees"
            value={formatFecFromMilli(
              analytics.finance.platformJobPostingFeesMilliFec
            )}
          />

          <KpiCard
            label="Urgent hire fees"
            value={formatFecFromMilli(
              analytics.finance.platformUrgentHireFeesMilliFec
            )}
          />

          <KpiCard
            label="Platform commission"
            value={formatFecFromMilli(
              analytics.finance.platformCommissionMilliFec
            )}
          />

          <KpiCard
            label="Total platform funds"
            value={formatFecFromMilli(
              analytics.finance.totalPlatformFundsMilliFec
            )}
            helper="Posting fees + urgent hire fees + commission"
          />
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Analytics breakdown"
          description="Distribution of users, activity, job outcomes, and platform finance."
        />

        <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {chartMode === "bar" ? (
            <>
              <SimpleBarChart
                title="Users by role profile"
                items={analytics.charts.usersByRoleProfile}
              />

              <SimpleBarChart
                title="Client activity"
                items={analytics.charts.clientActivityBreakdown}
              />

              <SimpleBarChart
                title="Fixer activity"
                items={analytics.charts.fixerActivityBreakdown}
              />

              <SimpleBarChart
                title="Jobs by outcome"
                items={analytics.charts.jobsByOutcome}
              />

              <SimpleBarChart
                title="Finance breakdown"
                items={analytics.charts.financeBreakdown}
                valueFormatter={financeFormatter}
              />
            </>
          ) : (
            <>
              <PieChartCard
                title="Users by role profile"
                items={analytics.charts.usersByRoleProfile}
              />

              <PieChartCard
                title="Client activity"
                items={analytics.charts.clientActivityBreakdown}
              />

              <PieChartCard
                title="Fixer activity"
                items={analytics.charts.fixerActivityBreakdown}
              />

              <PieChartCard
                title="Jobs by outcome"
                items={analytics.charts.jobsByOutcome}
              />

              <PieChartCard
                title="Finance breakdown"
                items={analytics.charts.financeBreakdown}
                valueFormatter={financeFormatter}
              />
            </>
          )}
        </div>
      </section>

      <TimelineBarChart
        items={analytics.charts.timeline}
      />
    </div>
  );
}