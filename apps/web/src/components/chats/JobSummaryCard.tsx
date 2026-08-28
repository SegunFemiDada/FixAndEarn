"use client";

import { useState } from "react";
import Card from "@/components/ui/Card";

import type {
  ChatJob,
} from "@/lib/chat/types";

type Props = {
  job: ChatJob | null;
  myUserId: string | null;
  role: "client" | "fixer";
};

function fmtFecFromMilli(
  milli?: number | null
): string {
  if (
    typeof milli !==
    "number"
  ) {
    return "—";
  }

  return `${(
    milli / 1000
  ).toFixed(2)} FEC`;
}

export default function JobSummaryCard({
  job,
  myUserId,
  role,
}: Props) {
  const [showClosedInfo, setShowClosedInfo] =
    useState(false);

  if (!job) {
    return null;
  }

  const isSelectedFixer =
    role === "client" ||
    job.fixerId === myUserId;

  const displayStatus =
    role === "fixer" && !isSelectedFixer
      ? "CLOSED"
      : job.status ?? "—";

  const isInProgress =
    displayStatus === "IN_PROGRESS";

  const isClosed =
    displayStatus === "CLOSED";

  return (
    <>
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {job.skillCategory ??
                "Job"}
            </div>

            <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              {job.city ??
                "City"}
              ,{" "}
              {job.state ??
                "State"}
            </div>

            {(job.area ||
              job.lga) && (
              <div className="mt-1 text-xs text-[#8FA0BC]">
                {job.area}
                {job.area &&
                job.lga
                  ? ", "
                  : ""}
                {job.lga}
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {fmtFecFromMilli(
                job.lockedPriceMilliFec ??
                  job.priceMilliFec
              )}
            </div>

            <div className="flex items-center justify-end gap-2 text-xs">
              <span className="text-[#6B7C99] dark:text-[#8FA0BC]">
                Status:
              </span>

              <span
                className={`rounded-full px-2 py-0.5 font-semibold ${
                  isInProgress
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : isClosed
                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : "bg-gray-100 text-[#6B7C99] dark:bg-[#25344F] dark:text-[#8FA0BC]"
                }`}
              >
                {displayStatus}
              </span>

              {isClosed && (
                <button
                  type="button"
                  onClick={() =>
                    setShowClosedInfo(true)
                  }
                  aria-label="More information about closed chat"
                  title="Why is this chat closed?"
                  className="flex h-4 w-4 items-center justify-center rounded-full border border-[#8FA0BC] text-[10px] font-bold text-[#6B7C99] transition hover:border-[#5B8FCC] hover:text-[#5B8FCC] dark:border-[#6F809C] dark:text-[#8FA0BC] dark:hover:border-[#7EA6D8] dark:hover:text-[#7EA6D8]"
                >
                  i
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {showClosedInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() =>
            setShowClosedInfo(false)
          }
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-[#1E2A3A]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                i
              </div>

              <div>
                <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Chat Closed
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  The client has completed the
                  final payment process with
                  another fixer for this job.
                  This conversation is now
                  closed, but your previous
                  messages remain available
                  for reference.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowClosedInfo(false)
              }
              className="mt-5 w-full rounded-xl bg-[#5B8FCC] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4A7BB5]"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}