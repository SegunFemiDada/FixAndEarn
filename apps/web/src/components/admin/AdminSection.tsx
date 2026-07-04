//path: apps/web/src/components/admin/AdminSection.tsx

import * as React from "react";

type AdminSectionProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export default function AdminSection({
  title,
  description,
  actions,
  children,
  className = "",
}: AdminSectionProps) {
  return (
    <section
      className={[
        "overflow-hidden rounded-2xl",
        "border border-[#C5D5EE] dark:border-[#2D3F55]",
        "bg-white dark:bg-[#1E2A3A]",
        "shadow-[0_4px_24px_rgba(91,143,204,0.12)]",
        "dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]",
        className,
      ].join(" ")}
    >
      <div className="border-b border-[#E4ECF7] dark:border-[#2D3F55] px-6 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {title}
            </h2>

            {description ? (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                {description}
              </p>
            ) : null}
          </div>

          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              {actions}
            </div>
          ) : null}
        </div>
      </div>

      <div className="p-6">
        {children}
      </div>
    </section>
  );
}