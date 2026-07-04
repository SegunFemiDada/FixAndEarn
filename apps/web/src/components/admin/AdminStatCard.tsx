//path: apps/web/src/components/admin/AdminStatCard.tsx

import * as React from "react";

type AdminStatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  accent?: "blue" | "green" | "amber" | "red" | "purple";
  icon?: React.ReactNode;
};

const accentStyles = {
  blue: {
    border: "border-[#5B8FCC]/30 dark:border-[#5B8FCC]/40",
    badge: "bg-[#EAF3FF] dark:bg-[#203247] text-[#2B6CB0] dark:text-[#8EC5FF]",
  },
  green: {
    border: "border-emerald-300/40 dark:border-emerald-500/30",
    badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  },
  amber: {
    border: "border-amber-300/40 dark:border-amber-500/30",
    badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  },
  red: {
    border: "border-red-300/40 dark:border-red-500/30",
    badge: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  },
  purple: {
    border: "border-violet-300/40 dark:border-violet-500/30",
    badge: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300",
  },
};

export default function AdminStatCard({
  title,
  value,
  subtitle,
  accent = "blue",
  icon,
}: AdminStatCardProps) {
  const style = accentStyles[accent];

  return (
    <div
      className={[
        "rounded-2xl",
        "border",
        style.border,
        "bg-white dark:bg-[#1E2A3A]",
        "shadow-[0_4px_24px_rgba(91,143,204,0.12)]",
        "dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
        "p-5",
        "transition",
        "hover:-translate-y-0.5",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC]">
            {title}
          </p>

          <h3 className="mt-3 text-3xl font-bold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA]">
            {value}
          </h3>

          {subtitle ? (
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              {subtitle}
            </p>
          ) : null}
        </div>

        {icon ? (
          <div
            className={[
              "flex h-11 w-11 items-center justify-center rounded-xl",
              style.badge,
            ].join(" ")}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}