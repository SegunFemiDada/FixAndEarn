"use client";

import { useState } from "react";
import {
  useAdminApproveDeletion,
  useAdminDeletionRequests,
  useAdminRejectDeletion,
} from "@/lib/admin/users/queries";
import type { AdminDeletionRequest } from "@/lib/admin/users/types";
import DeletionDependencyPanel from "@/components/admin/DeletionDependencyPanel";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
      Pending
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-[#C5D5EE] bg-white px-6 py-12 text-center shadow-[0_4px_24px_rgba(91,143,204,0.08)] dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
      <p className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">No pending deletion requests</p>
      <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">There are currently no account deletion requests waiting for review.</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-[#C5D5EE] bg-white p-6 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-32 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
        <div className="h-10 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
        <div className="h-10 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] p-4 text-sm text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
      {message || "Unknown error"}
    </div>
  );
}

function DeletionRequestRow({
  request,
  rejectReason,
  rejectReasonError,
  isApproving,
  isRejecting,
  onRejectReasonChange,
  onApprove,
  onReject,
  onCheckDependencies,
}: {
  request: AdminDeletionRequest;
  rejectReason: string;
  rejectReasonError?: string;
  isApproving: boolean;
  isRejecting: boolean;
  onRejectReasonChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onCheckDependencies: () => void;
}) {
  return (
    <tr className="border-t border-[#DCE6F4] align-top dark:border-[#2D3F55]">
      <td className="px-4 py-4">
        <p className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{request.fullName}</p>
        <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{request.email}</p>
      </td>
      <td className="px-4 py-4"><StatusBadge /></td>
      <td className="px-4 py-4">
        <p className="max-w-105 text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">{request.deletionRequestReason || "No reason provided"}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{formatDateTime(request.deletionRequestedAt)}</td>
      <td className="min-w-95 px-4 py-4">
        <div className="space-y-2">
          <button type="button" onClick={onCheckDependencies} className="w-full rounded-lg border border-[#5B8FCC] bg-[#F4F8FF] px-3 py-2.5 text-sm font-semibold text-[#315F96] hover:bg-[#EAF2FF] dark:border-[#3E6E9E] dark:bg-[#16283C] dark:text-[#8FC1F2] dark:hover:bg-[#1B3149]">Check dependencies</button>
          <input type="text" placeholder="Rejection reason (required)" value={rejectReason} onChange={(event) => onRejectReasonChange(event.target.value)} className="w-full rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] px-3 py-2.5 text-sm text-[#1A2B4A] outline-none placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080]" />
          {rejectReasonError && <p className="text-xs font-medium text-red-600 dark:text-red-300">{rejectReasonError}</p>}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onApprove} disabled={isApproving} className="inline-flex items-center justify-center rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600">{isApproving ? "Approving..." : "Approve"}</button>
            <button type="button" onClick={onReject} disabled={isRejecting} className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600">{isRejecting ? "Rejecting..." : "Reject"}</button>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function DeletionRequestsPage() {
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [rejectReasonError, setRejectReasonError] = useState<Record<string, string>>({});
  const [dependencyUserId, setDependencyUserId] = useState<string | null>(null);

  const { data: requests = [], isLoading, isError, error } = useAdminDeletionRequests("PENDING");
  const approveMutation = useAdminApproveDeletion();
  const rejectMutation = useAdminRejectDeletion();

  if (isLoading) {
    return <div className="space-y-6"><div><h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Account deletion requests</h1><p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Review and process pending account deletion requests.</p></div><LoadingState /></div>;
  }

  if (isError) {
    return <div className="space-y-6"><div><h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Account deletion requests</h1><p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Review and process pending account deletion requests.</p></div><ErrorState message={error.message} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Account deletion requests</h1>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Review and process pending account deletion requests.</p>
        </div>
        <div className="shrink-0 rounded-lg border border-[#C5D5EE] bg-white px-3 py-2 dark:border-[#2D3F55] dark:bg-[#1E2A3A]"><p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Pending</p><p className="mt-0.5 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{requests.length}</p></div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/15">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Review dependencies before approving</p>
        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">A deletion approval is blocked by unresolved financial or operational dependencies. Use Check dependencies to inspect the current database state.</p>
      </div>

      {requests.length === 0 ? <EmptyState /> : (
        <div className="overflow-hidden rounded-xl border border-[#C5D5EE] bg-white shadow-[0_4px_24px_rgba(91,143,204,0.08)] dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-300 border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-[#F4F8FF] dark:bg-[#16202E]"><tr>
                {['User','Status','Reason','Requested','Review'].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">{heading}</th>)}
              </tr></thead>
              <tbody>
                {requests.map((request) => <DeletionRequestRow key={request.id} request={request} rejectReason={rejectReason[request.id] ?? ""} rejectReasonError={rejectReasonError[request.id]} isApproving={approveMutation.isPending} isRejecting={rejectMutation.isPending} onRejectReasonChange={(value) => { setRejectReason((previous) => ({ ...previous, [request.id]: value })); if (value.trim()) setRejectReasonError((previous) => { const next = { ...previous }; delete next[request.id]; return next; }); }} onApprove={() => approveMutation.mutate(request.id)} onReject={() => { const reason = rejectReason[request.id] ?? ""; if (!reason.trim()) { setRejectReasonError((previous) => ({ ...previous, [request.id]: "Please enter a rejection reason." })); return; } setRejectReasonError((previous) => { const next = { ...previous }; delete next[request.id]; return next; }); rejectMutation.mutate({ id: request.id, reason }); }} onCheckDependencies={() => setDependencyUserId(request.id)} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dependencyUserId && <DeletionDependencyPanel userId={dependencyUserId} open={true} onClose={() => setDependencyUserId(null)} />}
    </div>
  );
}
