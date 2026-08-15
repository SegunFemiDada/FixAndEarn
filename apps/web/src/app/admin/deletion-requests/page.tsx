// Path: apps/web/src/app/admin/deletion-requests/page.tsx
"use client";

import { useState } from "react";
import {
  useAdminApproveDeletion,
  useAdminDeletionRequests,
  useAdminRejectDeletion,
} from "@/lib/admin/users/queries";
import type { AdminDeletionRequest } from "@/lib/admin/users/types";

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DeletionRequestsPage() {
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rejectReasonError, setRejectReasonError] = useState<Record<string, string>>({});

  const {
    data: requests = [],
    isLoading,
    isError,
    error,
  } = useAdminDeletionRequests("PENDING");

  const approveMutation = useAdminApproveDeletion();
  const rejectMutation = useAdminRejectDeletion();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Account deletion requests
            </h1>
            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Loading requests...
            </p>
          </div>

          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-24 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
              <div className="h-20 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
              <div className="h-20 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Account deletion requests
            </h1>

            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Failed to load requests.
            </p>
          </div>

          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            {error.message || "Unknown error"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-6 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Account deletion requests
          </h1>

          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Review and process user deletion requests.
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 text-center text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            No pending deletion requests.
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((req: AdminDeletionRequest) => (
              <div
                key={req.id}
                className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {req.fullName}
                    </h3>

                    <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                      {req.email}
                    </p>

                    <p className="mt-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                      <strong>Reason:</strong>{" "}
                      {req.deletionRequestReason || "No reason provided"}
                    </p>

                    <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      Requested: {formatDateTime(req.deletionRequestedAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => approveMutation.mutate(req.id)}
                      disabled={approveMutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-green-700 focus:ring-2 focus:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-300"
                    >
                      {approveMutation.isPending
                        ? "Approving..."
                        : "Approve"}
                    </button>

                    <button
                      onClick={() => {
                        const reason = rejectReason[req.id] ?? "";

                        if (!reason.trim()) {
                          setRejectReasonError((prev) => ({
                            ...prev,
                            [req.id]: "Please enter a rejection reason.",
                          }));
                          return;
                        }

                        setRejectReasonError((prev) => {
                          const next = { ...prev };
                          delete next[req.id];
                          return next;
                        });

                        rejectMutation.mutate({
                          id: req.id,
                          reason,
                        });
                      }}
                      disabled={rejectMutation.isPending}
                      className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-300"
                    >
                      {rejectMutation.isPending
                        ? "Rejecting..."
                        : "Reject"}
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Rejection reason (required for reject)"
                    value={rejectReason[req.id] ?? ""}
                    onChange={(e) => {
                    const value = e.target.value;

                    setRejectReason((prev) => ({
                      ...prev,
                      [req.id]: value,
                    }));

                    if (value.trim()) {
                      setRejectReasonError((prev) => {
                        const next = { ...prev };
                        delete next[req.id];
                        return next;
                      });
                    }
                  }}
                    className="w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080] dark:focus:border-[#5B8FCC]"
                  />
                  {rejectReasonError[req.id] && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                    {rejectReasonError[req.id]}
                  </p>
                )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}