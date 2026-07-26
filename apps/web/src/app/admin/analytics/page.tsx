// Path: apps/web/src/app/admin/analytics/page.tsx
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

const RANGE_OPTIONS: Array<{ label: string; value: AdminAnalyticsRange }> = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All time", value: "all" },
];

// Colors for pie chart – adapt for dark mode by keeping them visible
const PIE_SEGMENT_COLORS = ["#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af"];
const PIE_LEGEND_BG = ["bg-gray-800", "bg-gray-700", "bg-gray-600", "bg-gray-500", "bg-gray-400"];

type ChartMode = "bar" | "pie";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

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

function PageSection({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-[#C5D5EE] dark:border-[#2D3F55] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{title}</h3>
          {description ? <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{description}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="mt-5">{children}</div>
    </section>
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
    <article className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] transition-shadow hover:shadow-[0_8px_32px_rgba(91,143,204,0.2)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">{label}</p>
      <div className="mt-3 wrap-break-word text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        {value}
      </div>
      {helper ? <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{helper}</p> : null}
    </article>
  );
}

function EmptyChartState({ message = "No data available." }: { message?: string }) {
  return (
    <div className="flex min-h-55 items-center justify-center rounded-2xl border border-dashed border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 text-center text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
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
    <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{title}</h3>

      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyChartState />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {items.map((item) => {
            const width = max > 0 ? `${(item.value / max) * 100}%` : "0%";

            return (
              <div key={item.label}>
                <div className="mb-2 flex items-start justify-between gap-3 text-sm">
                  <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">{item.label}</span>
                  <span className="text-right font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {valueFormatter ? valueFormatter(item.value) : formatInteger(item.value)}
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[#EAF0FB] dark:bg-[#16202E]">
                  <div
                    className="h-full rounded-full bg-[#5B8FCC] dark:bg-[#5B8FCC] transition-[width] duration-300"
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
    if (total <= 0) return "conic-gradient(#C5D5EE 0deg 360deg)";

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
    <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{title}</h3>

      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyChartState />
        </div>
      ) : (
        <div className="mt-5 grid gap-6 xl:grid-cols-[220px_1fr] xl:items-center">
          <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A]">
            <div
              className="relative h-44 w-44 rounded-full"
              style={{ background: segments }}
              aria-hidden="true"
            >
              <div className="absolute inset-[22%] rounded-full bg-white dark:bg-[#1E2A3A]" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
              Total{" "}
              <span className="font-semibold">
                {valueFormatter ? valueFormatter(total) : formatInteger(total)}
              </span>
            </div>

            {items.map((item, index) => {
              const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";

              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "block h-3 w-3 shrink-0 rounded-full",
                        PIE_LEGEND_BG[index % PIE_LEGEND_BG.length]
                      )}
                    />
                    <span className="truncate text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">{item.label}</span>
                  </div>

                  <div className="text-right text-sm">
                    <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {valueFormatter ? valueFormatter(item.value) : formatInteger(item.value)}
                    </div>
                    <div className="text-[#6B7C99] dark:text-[#8FA0BC]">{pct}%</div>
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

  return (
    <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Timeline</h3>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Real backend timeline for jobs and finance in the selected period.
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-5">
          <EmptyChartState message="No timeline data available." />
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {items.map((item) => {
            const registrationsWidth =
  maxValue > 0 ? `${(item.registrations / maxValue) * 100}%` : "0%";

const postedWidth =
  maxValue > 0 ? `${(item.jobsPosted / maxValue) * 100}%` : "0%";

const completedWidth =
  maxValue > 0 ? `${(item.jobsCompleted / maxValue) * 100}%` : "0%";

const withdrawalsWidth =
  maxValue > 0 ? `${(item.withdrawalsMilliFec / maxValue) * 100}%` : "0%";

const postingFeesWidth =
  maxValue > 0 ? `${(item.postingFeesMilliFec / maxValue) * 100}%` : "0%";

const urgentHireWidth =
  maxValue > 0 ? `${(item.urgentHireFeesMilliFec / maxValue) * 100}%` : "0%";

const commissionWidth =
  maxValue > 0 ? `${(item.platformCommissionMilliFec / maxValue) * 100}%` : "0%";

            return (
              <div key={item.label} className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{item.label}</div>
                </div>

                <div className="grid gap-4">
                  <div>
  <div className="mb-1 flex items-center justify-between gap-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
    <span>Registrations</span>
    <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
      {formatInteger(item.registrations)}
    </span>
  </div>

  <div className="h-2 overflow-hidden rounded-full bg-[#EAF0FB] dark:bg-[#16202E]">
    <div
      className="h-full rounded-full bg-[#7C3AED] dark:bg-violet-500"
      style={{ width: registrationsWidth }}
    />
  </div>
</div>
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      <span>Jobs posted</span>
                      <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">{formatInteger(item.jobsPosted)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EAF0FB] dark:bg-[#16202E]">
                      <div className="h-full rounded-full bg-[#5B8FCC] dark:bg-[#5B8FCC]" style={{ width: postedWidth }} />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      <span>Jobs completed</span>
                      <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {formatInteger(item.jobsCompleted)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EAF0FB] dark:bg-[#16202E]">
                      <div className="h-full rounded-full bg-[#2E7D32] dark:bg-green-600" style={{ width: completedWidth }} />
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      <span>Withdrawals</span>
                      <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {formatFecFromMilli(item.withdrawalsMilliFec)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#EAF0FB] dark:bg-[#16202E]">
                      <div className="h-full rounded-full bg-[#D9534F] dark:bg-red-500" style={{ width: withdrawalsWidth }} />
                    </div>
                  </div>
                  <div>
  <div className="mb-1 flex items-center justify-between gap-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
    <span>Posting fees</span>
    <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
      {formatFecFromMilli(item.postingFeesMilliFec)}
    </span>
  </div>

  <div className="h-2 overflow-hidden rounded-full bg-[#EAF0FB] dark:bg-[#16202E]">
    <div
      className="h-full rounded-full bg-[#2563EB] dark:bg-blue-500"
      style={{ width: postingFeesWidth }}
    />
  </div>
</div>
<div>
  <div className="mb-1 flex items-center justify-between gap-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
    <span>Urgent hire fees</span>
    <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
      {formatFecFromMilli(item.urgentHireFeesMilliFec)}
    </span>
  </div>

  <div className="h-2 overflow-hidden rounded-full bg-[#EAF0FB] dark:bg-[#16202E]">
    <div
      className="h-full rounded-full bg-[#F59E0B] dark:bg-amber-500"
      style={{ width: urgentHireWidth }}
    />
  </div>
</div>
<div>
  <div className="mb-1 flex items-center justify-between gap-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
    <span>Platform commission</span>
    <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
      {formatFecFromMilli(item.platformCommissionMilliFec)}
    </span>
  </div>

  <div className="h-2 overflow-hidden rounded-full bg-[#EAF0FB] dark:bg-[#16202E]">
    <div
      className="h-full rounded-full bg-[#DC2626] dark:bg-red-600"
      style={{ width: commissionWidth }}
    />
  </div>
</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AnalyticsLoadingState() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-24 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
          <div className="h-8 w-56 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
          <div className="h-4 w-full max-w-2xl rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-11 rounded-xl bg-[#EAF0FB] dark:bg-[#16202E]" />
            <div className="h-11 rounded-xl bg-[#EAF0FB] dark:bg-[#16202E]" />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-80 animate-pulse rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          />
        ))}
      </section>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = React.useState<AdminAnalyticsRange>("week");
  const [chartMode, setChartMode] = React.useState<ChartMode>("bar");

  const query = useAdminAnalyticsOverview({ range }, true);
  const analytics = query.data;

  const financeFormatter = React.useCallback((value: number) => formatFecFromMilli(value), []);

  if (query.isLoading) {
    return <AnalyticsLoadingState />;
  }

  if (query.isError) {
    return (
      <section className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">Failed to load analytics</h3>
        <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">{extractApiErrorMessage(query.error)}</p>
      </section>
    );
  }

  if (!analytics) {
    return (
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Admin analytics</h3>
        <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No analytics data was returned.</p>
      </section>
    );
  }

  const registrationTimelineItems: AdminAnalyticsChartItem[] = analytics.charts.timeline.map((item) => ({
    label: item.label,
    value: item.registrations,
  }));

  return (
    <div className="space-y-6">
      <PageSection
        title="Admin analytics"
        description="Live admin KPIs computed from the backend. No placeholders, no fake aggregates."
        right={
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="analytics-range" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Time range
              </label>
              <select
                id="analytics-range"
                value={range}
                onChange={(event) => setRange(event.target.value as AdminAnalyticsRange)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Chart mode</span>
              <div
                className="mt-1 grid grid-cols-2 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-1"
                role="tablist"
                aria-label="Chart mode"
              >
                <button
                  type="button"
                  onClick={() => setChartMode("bar")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    chartMode === "bar"
                      ? "bg-[#5B8FCC] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)]"
                      : "text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#EAF0FB] dark:hover:bg-[#1E2A3A]"
                  )}
                  aria-pressed={chartMode === "bar"}
                >
                  Bar
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode("pie")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition",
                    chartMode === "pie"
                      ? "bg-[#5B8FCC] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)]"
                      : "text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#EAF0FB] dark:hover:bg-[#1E2A3A]"
                  )}
                  aria-pressed={chartMode === "pie"}
                >
                  Pie
                </button>
              </div>
            </div>
          </div>
        }
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Selected period</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[#1A2B4A] dark:text-[#E8F0FA]">
                {analytics.period.label}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">From</div>
                <div className="mt-1 font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatDateTime(analytics.period.from)}
                </div>
              </div>
              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">To</div>
                <div className="mt-1 font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatDateTime(analytics.period.to)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Snapshot</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Total platform funds
                </div>
                <div className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatFecFromMilli(analytics.finance.totalPlatformFundsMilliFec)}
                </div>
              </div>
              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-3">
                <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Jobs completed overall
                </div>
                <div className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatInteger(analytics.jobs.totalJobsCompletedOverall)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageSection>

      {/* Registration metrics */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Registration metrics</h3>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">New user sign‑ups in the selected period.</p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Registrations today"
            value={formatInteger(analytics.registrations.registrationsInRange)}
            helper="New users in the selected period"
          />
          <KpiCard
            label="Total registrations (all‑time)"
            value={formatInteger(analytics.registrations.totalRegistrations)}
            helper="All registered users ever"
          />
        </section>
      </div>

      {/* Registration timeline chart */}
      <SimpleBarChart
        title="Registrations over time"
        items={registrationTimelineItems}
      />

      {/* Client activity metrics */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Client activity</h3>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Based on job posting behaviour within the selected period.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total clients"
            value={formatInteger(analytics.clientActivity.totalClients)}
          />
          <KpiCard
            label="Active clients"
            value={formatInteger(analytics.clientActivity.activeClients)}
            helper="Posted at least one job in period"
          />
          <KpiCard
            label="Dormant clients"
            value={formatInteger(analytics.clientActivity.dormantClients)}
            helper="No job posted in period"
          />
          <KpiCard
            label="Never posted"
            value={formatInteger(analytics.clientActivity.clientsWhoNeverPosted)}
            helper="Registered but never posted any job"
          />
        </section>
      </div>

      {/* Fixer activity metrics */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Fixer activity</h3>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Based on assigned IN_PROGRESS or COMPLETED jobs within the selected period.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total fixers"
            value={formatInteger(analytics.fixerActivity.totalFixers)}
          />
          <KpiCard
            label="Active working fixers"
            value={formatInteger(analytics.fixerActivity.activeWorkingFixers)}
            helper="Assigned to active/completed job in period"
          />
          <KpiCard
            label="Dormant fixers"
            value={formatInteger(analytics.fixerActivity.dormantFixers)}
            helper="No assigned work in period"
          />
          <KpiCard
            label="Applying only"
            value={formatInteger(analytics.fixerActivity.applyingOnlyFixers)}
            helper="Applied but never assigned"
          />
        </section>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">User metrics</h3>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Role distribution and current user activity.</p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
            value={formatInteger(analytics.users.totalSingleRoleUsers)}
            helper="Users with one active marketplace role"
          />
          <KpiCard
            label="Dual-role users"
            value={formatInteger(analytics.users.totalDualRoleUsers)}
            helper="Users with both client and fixer roles"
          />
          <KpiCard
            label="Current active users"
            value={formatInteger(analytics.users.currentActiveUsers)}
            helper="Currently active accounts"
          />
        </section>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Job metrics</h3>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Delivery outcomes across posted and completed jobs.</p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Jobs posted"
            value={formatInteger(analytics.jobs.totalJobsPosted)}
          />
          <KpiCard
            label="Jobs completed without dispute"
            value={formatInteger(analytics.jobs.totalJobsCompletedWithoutDispute)}
          />
          <KpiCard
            label="Jobs completed with dispute"
            value={formatInteger(analytics.jobs.totalJobsCompletedWithDispute)}
          />
          <KpiCard
            label="Jobs completed overall"
            value={formatInteger(analytics.jobs.totalJobsCompletedOverall)}
          />
        </section>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Finance metrics</h3>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Withdrawals, fees, commission, and total platform funds.
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard
            label="Total withdrawals"
            value={formatFecFromMilli(analytics.finance.totalWithdrawalsMilliFec)}
          />
          <KpiCard
            label="Job posting fees"
            value={formatFecFromMilli(analytics.finance.platformJobPostingFeesMilliFec)}
          />
          <KpiCard
            label="Platform commission"
            value={formatFecFromMilli(analytics.finance.platformCommissionMilliFec)}
          />
          <KpiCard
            label="Total platform funds"
            value={formatFecFromMilli(analytics.finance.totalPlatformFundsMilliFec)}
            helper="Posting fees + urgent hire fees + commission"
          />
        </section>
      </div>

      <section className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-3">
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
      </section>

      <TimelineBarChart items={analytics.charts.timeline} />
    </div>
  );
}