//path: apps/web/src/app/app/jobs/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useJobsList, useMarketplaceStats, } from "@/lib/jobs/queries";
import { useMyVerification } from "@/lib/verification/queries";
import {
  getStoredRoles,
  getActiveRole,
  getToken,
  type Role,
} from "@/lib/auth/session";
import { decodeJwtUserId } from "@/lib/auth/jwt";
import HiringPathModal from "@/components/jobs/HiringPathModal";

function formatFec(milli?: number | null) {
  if (typeof milli !== "number") return "—";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

function roleForUi(roles: Role[], active: Role | null): Role | null {
  if (active) return active;
  if (roles.length === 1) return roles[0];
  return null;
}

function backendMsg(err: unknown): string {
  const e: any = err;
  if (Array.isArray(e?.response?.data?.message)) {
    return e.response.data.message.join(", ");
  }
  return e?.response?.data?.message || e?.message || "Failed to load jobs";
}

function buildImageSrc(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http")) return path;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

function firstJobImage(job: any) {
  const first = job?.images?.[0];
  return buildImageSrc(first?.imagePath ?? first?.imageUrl ?? null);
}

function parseFecInputToMilliFec(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;

  return Math.round(n * 1000);
}

export default function JobsPage() {
  const [mounted, setMounted] = useState(false);

  const [skill, setSkill] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const [showHiringModal, setShowHiringModal] = useState(false);

  useEffect(() => setMounted(true), []);

  const token = mounted ? getToken() : null;
  const roles = mounted ? getStoredRoles() : [];
  const activeRole = mounted ? getActiveRole() : null;
  const myUserId = mounted ? decodeJwtUserId(token) : null;

  const uiRole = roleForUi(roles, activeRole);
  const isClient = uiRole === "CLIENT";
  const isFixer = uiRole === "FIXER";
  const isAuthed = !!token;

  const { data: verification, isLoading, isError } = useMyVerification();
  const isApproved = verification?.status === "APPROVED";

  const showGate = mounted && (!isAuthed || isLoading || isError || !isApproved);

  useEffect(() => {
    if (mounted && isClient && isApproved) {
      setShowHiringModal(true);
    }
  }, [mounted, isClient, isApproved]);

  const jobsFilters = useMemo(() => {
    if (!isFixer) return undefined;

    return {
      skill: skill.trim() || undefined,
      state: state.trim() || undefined,
      city: city.trim() || undefined,
      minPriceMilliFec: parseFecInputToMilliFec(minPrice),
      maxPriceMilliFec: parseFecInputToMilliFec(maxPrice),
    };
  }, [isFixer, skill, state, city, minPrice, maxPrice]);

  const {
    data,
    isLoading: jobsLoading,
    isError: jobsError,
    error,
  } = useJobsList(jobsFilters);

  const items = data ?? [];
  const { data: stats } = useMarketplaceStats();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Marketplace
          </h1>

        {mounted && isApproved && isClient ? (
          <button
  onClick={() => setShowHiringModal(true)}
  className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors
    bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300`}
>
  Post / Hire
</button>

        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
      Open Jobs
    </p>

    <p className="mt-2 text-3xl font-bold text-blue-900 dark:text-white">
      {stats?.openJobs ?? "—"}
    </p>

    <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
      Available for fixers
    </p>
  </div>

  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
      In Progress
    </p>

    <p className="mt-2 text-3xl font-bold text-amber-900 dark:text-white">
      {stats?.inProgressJobs ?? "—"}
    </p>

    <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
      Jobs currently being worked on
    </p>
  </div>

  <div className="rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20">
    <p className="text-sm font-medium text-green-700 dark:text-green-300">
      Completed
    </p>

    <p className="mt-2 text-3xl font-bold text-green-900 dark:text-white">
      {stats?.completedJobs ?? "—"}
    </p>

    <p className="mt-1 text-xs text-green-600 dark:text-green-400">
      Successfully completed jobs
    </p>
  </div>
</div>
<div>
          <h1 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            {isClient ? "Open Jobs" : isFixer ? "Fixer Jobs" : "Jobs"}
          </h1>
          
        </div>

      {!mounted ? (
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          Loading…
        </div>
      ) : showGate ? (
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 text-sm shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          {!isAuthed ? (
            <div className="space-y-2">
              <p className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Not authenticated</p>
              <Link
  href="/login"
  className="font-semibold text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
>
  Go to login
</Link>

            </div>
          ) : isLoading ? (
            <p className="text-[#6B7C99] dark:text-[#8FA0BC]">Checking verification…</p>
          ) : isError ? (
            <p className="text-[#D9534F] dark:text-red-300">Not verified. Go to Verification.</p>
          ) : (
            <div className="space-y-2">
              <p className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Verification required</p>
              <Link href="/app/verification" className="font-medium text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Complete verification
              </Link>
            </div>
          )}
        </div>
      ) : (
        <>
          {isFixer ? (
            <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="mb-3">
                <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Filter jobs
                </div>
                <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Narrow down open jobs by skill, location, and price range.
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  placeholder="Skill"
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                />
                <input
                  placeholder="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                />
                <input
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                />
                <input
                  placeholder="Min price (FEC)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                />
                <input
                  placeholder="Max price (FEC)"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 sm:col-span-2"
                />
              </div>
            </section>
          ) : null}

          {jobsLoading ? (
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              Loading jobs…
            </div>
          ) : jobsError ? (
            <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              {backendMsg(error)}
            </div>
          ) : (
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                  No jobs found.
                </div>
              ) : (
                items.map((j: any) => {
                  const preview = firstJobImage(j);
                  const isMine = myUserId && j.clientId === myUserId;

                  return (
                    <Link
  key={j.id}
  href={`/app/jobs/${j.id}`}
  className={`block rounded-2xl border p-4 transition shadow-md
    border-gray-300 bg-white hover:bg-gray-50
    dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700`}
>
  {preview ? (
    <div className="relative mb-4 h-44 overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-900">
      <Image
        src={preview}
        alt="Job"
        fill
        unoptimized
        className="object-cover"
      />
    </div>
  ) : null}

  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0">
      <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {j.skillCategory}
      </p>

      {isFixer && isMine ? (
        <span className="mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium
          border-amber-400 bg-amber-50 text-amber-700
          dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
          Your job
        </span>
      ) : null}

      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        {[j.city, j.state].filter(Boolean).join(", ") || "Location not available"}
      </p>
    </div>

    <div className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
      {formatFec(j.priceMilliFec)}
    </div>
  </div>
</Link>

                  );
                })
              )}
            </div>
          )}
        </>
      )}

      <HiringPathModal
        open={showHiringModal}
        onClose={() => setShowHiringModal(false)}
      />
    </div>
  );
}