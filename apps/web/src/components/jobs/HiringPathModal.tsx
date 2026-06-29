//path: apps/web/src/components/jobs/HiringPathModal.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function HiringPathModal({ open, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  function handleStandard() {
    localStorage.setItem("fa_hiring_path_selected", "standard");
    onClose();
    router.push("/app/jobs/new");
  }

  function handleUrgent() {
    localStorage.setItem("fa_hiring_path_selected", "urgent");
    onClose();
    router.push("/app/fixers/hire-now");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 px-4">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_8px_32px_rgba(91,143,204,0.16)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] sm:p-7">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
        >
          ✕
        </button>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
            Hiring path
          </p>
          <h2 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            How urgent is this job for you?
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
            Choose how you want to hire. Standard posting is cheaper. Urgent lets
            you hire immediately from available professionals.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Standard */}
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-5">
            <p className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Not urgent
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              Post a job and wait for fixers to apply.
            </p>
            <div className="mt-4 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Fee: 1 FEC (₦1000)
            </div>

           <button
  type="button"
  onClick={handleStandard}
  className="mt-5 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors
    bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md hover:shadow-lg
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300"
>
  Continue
</button>

          </div>

          {/* Urgent */}
          <div className="rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-5">
            <p className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Urgent
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              Browse ready fixers and hire immediately.
            </p>
            <div className="mt-4 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Fee: 2 FEC (₦2000)
            </div>

           <button
  type="button"
  onClick={handleUrgent}
  className="mt-5 inline-flex w-full items-center justify-center rounded-lg border px-4 py-3 text-sm font-semibold transition-colors
    border-amber-400 bg-white text-amber-700 hover:bg-amber-50
    dark:border-amber-600 dark:bg-gray-800 dark:text-amber-300 dark:hover:bg-amber-900/30"
>
  Browse fixers
</button>

          </div>
        </div>
      </div>
    </div>
  );
}