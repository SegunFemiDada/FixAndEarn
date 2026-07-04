"use client";

import * as React from "react";

type DashboardErrorProps = {
  message?: string;
  onRetry?: () => void;
};

export default function DashboardError({
  message = "Unable to load dashboard data.",
  onRetry,
}: DashboardErrorProps) {
  return (
    <div className="flex min-h-125 items-center justify-center">
      <div className="w-full max-w-2xl rounded-2xl border border-red-200 dark:border-red-900 bg-white dark:bg-[#1E2A3A] p-10 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v4m0 4h.01M10.29 3.86L1.82 18A2 2 0 003.55 21h16.9a2 2 0 001.73-3l-8.47-14.14a2 2 0 00-3.46 0z"
            />
          </svg>
        </div>

        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Dashboard unavailable
          </h2>

          <p className="mt-4 text-base leading-7 text-[#6B7C99] dark:text-[#8FA0BC]">
            {message}
          </p>

          <p className="mt-2 text-sm text-[#7E8FAE] dark:text-[#8FA0BC]">
            This is usually caused by a temporary network issue or the backend
            service being unavailable.
          </p>

          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4A7DB9] focus:outline-none focus:ring-2 focus:ring-[#5B8FCC] focus:ring-offset-2 dark:focus:ring-offset-[#1E2A3A]"
            >
              Try Again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}