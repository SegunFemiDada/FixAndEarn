//path: apps/web/src/components/admin/AdminActivityCard.tsx

import * as React from "react";

export type AdminActivityCardProps = {
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  badge?: string;
  badgeColor?: "blue" | "green" | "amber" | "red" | "purple";
};

const badgeStyles = {
  blue:
    "bg-[#EAF3FF] dark:bg-[#203247] text-[#2B6CB0] dark:text-[#8EC5FF]",
  green:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  amber:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  red:
    "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  purple:
    "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
};

export default function AdminActivityCard({
  title,
  description,
  timestamp,
  actor,
  badge,
  badgeColor = "blue",
}: AdminActivityCardProps) {
  return (
    <div className="rounded-xl border border-[#E4ECF7] dark:border-[#2D3F55] bg-[#FBFDFF] dark:bg-[#16202E] p-4 transition hover:border-[#5B8FCC]/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
            {description}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#7E8FAE] dark:text-[#8FA0BC]">
            <span>{timestamp}</span>

            {actor ? (
              <>
                <span>•</span>
                <span>{actor}</span>
              </>
            ) : null}
          </div>
        </div>

        {badge ? (
          <span
            className={[
              "rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap",
              badgeStyles[badgeColor],
            ].join(" ")}
          >
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
}