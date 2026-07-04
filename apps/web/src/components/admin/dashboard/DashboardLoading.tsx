"use client";

import * as React from "react";

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5">
      <div className="h-4 w-28 rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />

      <div className="mt-5 h-9 w-20 rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />

      <div className="mt-4 h-3 w-36 rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6">
      <div className="h-6 w-48 rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />

      <div className="mt-3 h-4 w-80 max-w-full rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Hero */}

      <div className="animate-pulse rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-8">
        <div className="h-4 w-36 rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />

        <div className="mt-4 h-10 w-80 max-w-full rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />

        <div className="mt-5 h-4 w-full max-w-3xl rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />

        <div className="mt-3 h-4 w-2/3 rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />
      </div>

      {/* KPI Overview */}

      <SkeletonSection />

      {/* Jobs */}

      <SkeletonSection />

      {/* Finance */}

      <SkeletonSection />

      {/* Moderation */}

      <SkeletonSection />

      {/* Admin */}

      <SkeletonSection />

      {/* Recent Activity */}

      <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6">
        <div className="animate-pulse">
          <div className="h-6 w-56 rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />

          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-[#E4ECF7] dark:border-[#2D3F55] p-4"
              >
                <div className="h-4 w-48 rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />

                <div className="mt-3 h-3 w-full rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />

                <div className="mt-2 h-3 w-3/4 rounded bg-[#E4ECF7] dark:bg-[#2D3F55]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}