//path: apps/web/src/app/admin/deletion-requests/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import { useState } from "react";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function DeletionRequestsPage() {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});

  const {
    data: requests,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["admin", "deletion-requests"],
    queryFn: () =>
      adminApi
        .get("/admin/users/deletion-requests?status=PENDING")
        .then((res) => res.data),
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) =>
      adminApi.post(`/admin/users/${userId}/approve-deletion`),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "deletion-requests"],
      }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      userId,
      reason,
    }: {
      userId: string;
      reason?: string;
    }) => adminApi.post(`/admin/users/${userId}/reject-deletion`, { reason }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["admin", "deletion-requests"],
      }),
  });

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
            {error?.message || "Unknown error"}
          </div>
        </div>
      </div>
    );
  }

  if (!requests) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Account deletion requests
            </h1>
            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No data</p>
          </div>
        </div>
      </div>
    );
  }

  const items = Array.isArray(requests) ? requests : requests.items ?? [];

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

        {items.length === 0 ? (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 text-center text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            No pending deletion requests.
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((req: any) => (
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
                      <strong>Reason:</strong> {req.deletionRequestReason}
                    </p>
                    <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC] mt-1">
                      Requested: {formatDateTime(req.deletionRequestedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      onClick={() => approveMutation.mutate(req.id)}
                      disabled={approveMutation.isPending}
                      className="inline-flex items-center justify-center rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#2E7D32] dark:text-green-200 transition hover:bg-[#F0FAF0] dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {approveMutation.isPending ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => {
                        const reason = rejectReason[req.id] || "";
                        if (!reason.trim()) {
                          alert("Please enter a rejection reason");
                          return;
                        }
                        rejectMutation.mutate({ userId: req.id, reason });
                      }}
                      disabled={rejectMutation.isPending}
                      className="inline-flex items-center justify-center rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#D9534F] dark:text-red-300 transition hover:bg-[#FFF4F3] dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    placeholder="Rejection reason (required for reject)"
                    value={rejectReason[req.id] || ""}
                    onChange={(e) =>
                      setRejectReason((prev) => ({
                        ...prev,
                        [req.id]: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}