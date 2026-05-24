"use client";

import Card from "@/components/ui/Card";

import type {
  ChatJob,
} from "@/lib/chat/types";

type Props = {
  job: ChatJob | null;
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
}: Props) {
  if (!job) {
    return null;
  }

  return (
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

          <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
            Status:{" "}
            {String(
              job.status ??
                "—"
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}