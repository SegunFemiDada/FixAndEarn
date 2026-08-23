//path: apps/web/src/app/app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMyJobs, useMyApplications } from "@/lib/jobs/queries";
import { useMyVerification } from "@/lib/verification/queries";
import { getActiveRole, getToken } from "@/lib/auth/session";
import { decodeJwtUserId } from "@/lib/auth/jwt";
import {
  fetchMyAvailability,
  setMyAvailability,
  type FixerAvailabilityResponse,
} from "@/lib/fixers/availability";


function formatFecFromMilli(milli: number) {
  const fec = milli / 1000;
  return `${fec.toFixed(2)} FEC`;
}

function getDisplayedJobAmountMilliFec(job: any) {
  const locked = Number(job?.lockedPriceMilliFec);
  if (Number.isFinite(locked) && locked > 0) return locked;

  const base = Number(job?.priceMilliFec);
  if (Number.isFinite(base) && base > 0) return base;

  return 0;
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "OPEN":
      return "border-[#5B8FCC] dark:border-[#5B8FCC] bg-[#5B8FCC] text-white";
    case "IN_PROGRESS":
      return "border-[#F5A623] dark:border-[#F5A623] bg-[#F5A623] text-white";
    case "COMPLETED":
      return "border-[#2E7D32] dark:border-green-700 bg-[#2E7D32] dark:bg-green-700 text-white";
    case "CANCELLED":
    case "REJECTED":
      return "border-[#D9534F] dark:border-red-700 bg-[#D9534F] dark:bg-red-700 text-white";
    default:
      return "border-[#9BAEC8] dark:border-[#4A6080] bg-[#9BAEC8] dark:bg-[#4A6080] text-white";
  }
}

function JobCard({
  job,
  secondaryAction,
}: {
  job: any;
  secondaryAction?: { href: string; label: string } | null;
}) {
  const location = [job.area, job.lga, job.city, job.state].filter(Boolean).join(", ");
  const displayAmountMilliFec = getDisplayedJobAmountMilliFec(job);
  const isNegotiatedPrice =
    Number.isFinite(Number(job?.lockedPriceMilliFec)) && Number(job?.lockedPriceMilliFec) > 0;
  const status = String(job?.status ?? "UNKNOWN");

  return (
    <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
  <div className="flex items-center justify-between gap-4">
    {/* Left content */}
    <div className="min-w-0">
      <div className="truncate text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        {job.skillCategory}
      </div>
      <div className="mt-1 truncate text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        {location || "Location not available"}
      </div>
    </div>

    {/* Right content */}
<div className="flex flex-col items-end justify-center gap-2 pt-1 shrink-0 text-right">
  {isNegotiatedPrice && (
    <div className="inline-flex rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-2.5 py-1 text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
      Locked agreed price
    </div>
  )}
  <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
    {formatFecFromMilli(displayAmountMilliFec)}
  </div>
  <div
    className={[
      "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
      getStatusBadgeClass(status),
    ].join(" ")}
  >
    {status}
  </div>
</div>

  </div>

  {/* Actions */}
  <div className="mt-4 flex flex-wrap gap-2">
    <Link
      href={`/app/jobs/${job.id}`}
      className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-semibold
        bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-400
        transition-colors shadow-md
        dark:bg-blue-500 dark:text-white dark:hover:bg-blue-600 dark:focus:ring-blue-300"
    >
      View job
    </Link>

    {secondaryAction && (
      <Link
        href={secondaryAction.href}
        className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 font-semibold
          bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-2 focus:ring-gray-400
          transition-colors
          dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500"
      >
        {secondaryAction.label}
      </Link>
    )}
  </div>
</div>

  );
}

function ClientDashboard() {
  const { data: jobs, isLoading, isError } = useMyJobs(
    { skip: 0, take: 50 },
    { enabled: true }
  );

  const list = Array.isArray(jobs) ? jobs : [];

  const grouped = useMemo(() => {
    const byStatus: Record<string, any[]> = {};
    for (const j of list) {
      const s = String(j?.status ?? "UNKNOWN");
      byStatus[s] ??= [];
      byStatus[s].push(j);
    }
    return byStatus;
  }, [list]);

  return (
    <div className="space-y-4">

      {isLoading ? (
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          Loading your jobs…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          Failed to load your jobs.
        </div>
      ) : null}

      {!isLoading && !isError && list.length === 0 ? (
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">No jobs yet</div>
          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Post a job and it will show up here.
          </div>
        </div>
      ) : null}

      {!isLoading && !isError && list.length > 0 ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Status summary</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(grouped).map(([status, items]) => (
              <span
                key={status}
                className={[
                  "inline-flex rounded-full border px-3 py-1.5 text-xs font-medium",
                  getStatusBadgeClass(status),
                ].join(" ")}
              >
                {status}: {items.length}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-3">
        {list.map((job: any) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

function FixerDashboard() {
  const myUserId = useMemo(() => decodeJwtUserId(getToken()), []);
  const { data: apps, isLoading, isError } = useMyApplications(
    { skip: 0, take: 50 },
    { enabled: true }
  );

  const [avail, setAvail] = useState<FixerAvailabilityResponse | null>(null);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState<string | null>(null);

  async function updateAvailability(status: "AVAILABLE" | "UNAVAILABLE") {
    setAvailLoading(true);
    setAvailError(null);
    try {
      const r = await setMyAvailability(status);
      setAvail(r);
    } catch (e: any) {
      setAvailError(e?.message || "Failed to update availability");
    } finally {
      setAvailLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    setAvailLoading(true);
    setAvailError(null);

    fetchMyAvailability()
      .then((r) => {
        if (!cancelled) setAvail(r);
      })
      .catch((e: any) => {
        if (!cancelled) setAvailError(e?.message || "Failed to load availability");
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const applications = Array.isArray(apps) ? apps : [];
  const jobs = applications.map((a: any) => a?.job).filter(Boolean);

return (
  <div className="space-y-4">
    <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Availability
          </div>
        </div>

        <div className="shrink-0 text-right text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          {availLoading ? (
            <span>Loading…</span>
          ) : avail ? (
            <span>
              Current status:{" "}
              <b className="text-[#1A2B4A] dark:text-[#E8F0FA]">
                {avail.effective}
              </b>
            </span>
          ) : (
            <span>—</span>
          )}
        </div>
      </div>

      {availError ? (
        <div className="mt-3 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 px-4 py-3 text-sm text-[#D9534F] dark:text-red-300">
          {availError}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => updateAvailability("UNAVAILABLE")}
          disabled={availLoading || avail?.effective === "BUSY"}
          className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2.5 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA] disabled:cursor-not-allowed disabled:opacity-60"
        >
          🔴 Unavailable
        </button>

        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2.5 text-sm font-medium text-[#9BAEC8] dark:text-[#4A6080] opacity-70"
          title="Busy is automatic when you have an IN_PROGRESS job"
        >
          🟡 Busy (auto)
        </button>

        <button
          type="button"
          onClick={() => updateAvailability("AVAILABLE")}
          disabled={availLoading || avail?.effective === "BUSY"}
          className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2.5 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA] disabled:cursor-not-allowed disabled:opacity-60"
        >
          🟢 Available
        </button>
      </div>

      {avail?.effective === "BUSY" ? (
        <div className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          You can&apos;t switch to Available or Unavailable while you have an{" "}
          <b className="text-[#1A2B4A] dark:text-[#E8F0FA]">IN_PROGRESS</b> job.
        </div>
      ) : null}

      {avail ? (
        <div className="mt-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
          Preferred status:{" "}
          <b className="text-[#1A2B4A] dark:text-[#E8F0FA]">
            {avail.preferred}
          </b>
          {avail.updatedAt
            ? ` • Updated: ${new Date(avail.updatedAt).toLocaleString()}`
            : null}
        </div>
      ) : null}
    </section>

    <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="space-y-1">
        <div className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          My applications
        </div>
      </div>
    </section>

    {isLoading ? (
      <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        Loading your applications…
      </div>
    ) : null}

    {isError ? (
      <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        Failed to load your applications.
      </div>
    ) : null}

    {!isLoading && !isError && applications.length === 0 ? (
      <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          No applications yet
        </div>
        <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Apply to a job and it will show up here.
        </div>
      </div>
    ) : null}

      <div className="grid gap-3">
        {jobs.map((job: any) => (
          <JobCard
            key={job.id}
            job={job}
            secondaryAction={
            myUserId && job?.status !== "COMPLETED"
              ? { href: `/app/jobs/${job.id}/chats/${myUserId}`, label: "Open my chat" }
              : null
          }
          />
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const { data: verification, isLoading: verLoading } = useMyVerification();

  useEffect(() => {
    setMounted(true);
    setActiveRole(getActiveRole() ?? null);
  }, []);

  if (!mounted) return null;

  if (!activeRole) {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Dashboard</div>
          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Choose an active role before continuing.
          </div>
        </div>

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Choose an active role</div>
          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Switch to CLIENT or FIXER, then come back.
          </div>
        </div>
      </div>
    );
  }

  if (verLoading) {
    return (
      <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        Checking verification…
      </div>
    );
  }

  const status = (verification as any)?.status;

  if (status !== "APPROVED") {
    return (
      <div className="space-y-4">
        <div>
          <div className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Dashboard</div>
          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Verification is required before using the dashboard.
          </div>
        </div>

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Verification required</div>
          <div className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
            Your verification status is <b>{String(status ?? "UNKNOWN")}</b>. You need
            APPROVED verification to use dashboards.
          </div>
          <div className="mt-4">
            <Link
              href="/app/verification"
              className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2.5 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
            >
              Go to verification
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
  <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <div className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {activeRole === "CLIENT"
            ? "Client Dashboard"
            : activeRole === "FIXER"
              ? "Fixer Dashboard"
              : "Dashboard"}
        </div>
        <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Active role: {activeRole}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
  href="/app/chats"
  className="
    i   inline-flex items-center justify-center
    rounded-lg px-4 py-2.5 font-semibold
    bg-green-600 text-white
    hover:bg-green-700 focus:ring-2 focus:ring-green-400
    transition-colors shadow-md
    dark:bg-green-500 dark:text-white
    dark:hover:bg-green-600 dark:focus:ring-green-300
  "
>
  My Chats
</Link>

      </div>
    </div>

    {activeRole === "CLIENT" ? <ClientDashboard /> : null}
    {activeRole === "FIXER" ? <FixerDashboard /> : null}

    {activeRole !== "CLIENT" && activeRole !== "FIXER" ? (
      <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          Unsupported role
        </div>
        <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          This dashboard is only for CLIENT and FIXER roles.
        </div>
      </div>
    ) : null}
  </div>
);
}