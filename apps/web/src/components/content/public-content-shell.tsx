//path: apps/web/src/components/content/public-content-shell.tsx
import * as React from "react";

type PublicContentShellProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export default function PublicContentShell({
  eyebrow,
  title,
  description,
  children,
}: PublicContentShellProps) {
  return (
    <div className="space-y-6">
      {/* Header section */}
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-6 py-8 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA] sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#6B7C99] dark:text-[#8FA0BC] sm:text-base">
            {description}
          </p>
        ) : null}
      </section>

      {/* Content section */}
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-8">
        {children}
      </section>
    </div>
  );
}