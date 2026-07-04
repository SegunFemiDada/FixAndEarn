// Path: apps/web/src/components/admin/admin-page-hero.tsx
import * as React from "react";

type AdminPageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
};

export default function AdminPageHero({
  eyebrow,
  title,
  description,
  actions,
}: AdminPageHeroProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="bg-linear-to-r from-[#F4F8FF] to-white dark:from-[#16202E] dark:to-[#1E2A3A] px-6 py-6 sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA] sm:text-3xl">
              {title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC] sm:text-[15px]">
              {description}
            </p>
          </div>

          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}