//path: apps/web/src/components/jobs/JobRatingForm.tsx
"use client";

import { useState } from "react";
import { useRateFixer } from "@/lib/jobs/queries";

function Star({
  filled,
  onClick,
}: {
  filled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xl leading-none transition hover:scale-105 ${
        filled ? "text-[#F5A623]" : "text-[#C5D5EE] dark:text-[#4A6080]"
      }`}
    >
      {filled ? "★" : "☆"}
    </button>
  );
}

export default function JobRatingForm({
  jobId,
  onDone,
}: {
  jobId: string;
  onDone?: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const m = useRateFixer(jobId);

  return (
    <div className="space-y-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div>
        <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Rate this fixer</div>
        <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Share a rating and optional review for the completed job.
        </p>
      </div>

      {/* ⭐ STAR RATING */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            filled={n <= rating}
            onClick={() => setRating(n)}
          />
        ))}
        <span className="ml-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          {rating}/5
        </span>
      </div>

      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Optional review"
        className="min-h-[110px] w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
      />

      <button
        type="button"
        disabled={m.isPending}
        className={[
          "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
          m.isPending
            ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
            : "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]",
        ].join(" ")}
      >
        {m.isPending ? "Submitting…" : "Submit rating"}
      </button>

      {m.isError ? (
        <div className="rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300">
          {(m.error as unknown as { response?: { data?: { message?: string } } })?.response?.data
            ?.message ?? "Rating failed"}
        </div>
      ) : null}
    </div>
  );
}