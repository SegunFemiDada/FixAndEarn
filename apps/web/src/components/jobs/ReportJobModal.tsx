//path: apps/web/src/components/jobs/ReportJobModal.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

const REASONS = [
  "SPAM",
  "FRAUD",
  "HARASSMENT",
  "OFF_PLATFORM_PAYMENT",
  "OTHER",
];

export default function ReportJobModal({
  jobId,
  open,
  onClose,
}: {
  jobId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/reports", {
        targetType: "JOB",
        targetId: jobId,
        reason,
        description: description.trim() || undefined,
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setReason("");
        setDescription("");
      }, 2000);
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 dark:bg-black/70">
      <div className="max-w-md w-full rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_8px_32px_rgba(91,143,204,0.16)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <h2 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Report this job</h2>
        <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Please tell us why this job violates our guidelines.
        </p>

        {submitted ? (
          <div className="mt-4 rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
            Thank you. Our team will review the report.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              >
                <option value="">Select a reason</option>
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Additional details (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="Provide more context..."
              />
            </div>

            <div className="flex gap-2">
              <button
  onClick={() => mutation.mutate()}
  disabled={!reason || mutation.isPending}
  className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors
    ${!reason || mutation.isPending
      ? "cursor-not-allowed bg-red-200 text-red-400 dark:bg-red-900 dark:text-red-500 opacity-50"
      : "bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-400 shadow-md hover:shadow-lg dark:bg-red-700 dark:hover:bg-red-800 dark:focus:ring-red-500"}
  `}
>
  {mutation.isPending ? "Submitting..." : "Submit report"}
</button>

<button
  onClick={onClose}
  className="flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
>
  Cancel
</button>

            </div>

            {mutation.isError && (
              <p className="text-sm text-[#D9534F] dark:text-red-300">Failed to submit report. Please try again.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}