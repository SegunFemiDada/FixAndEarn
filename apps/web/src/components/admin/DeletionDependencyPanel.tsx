"use client";

import { useState } from "react";
import { useAdminDeletionDependencies } from "@/lib/admin/users/deletion-dependency.queries";
import { formatFecFromMilli } from "@/lib/wallet/ui";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SummaryItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[#DCE6F4] bg-[#F8FAFD] px-3 py-3 dark:border-[#2D3F55] dark:bg-[#16202E]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{value}</p>
    </div>
  );
}

export default function DeletionDependencyPanel({
  userId,
  open,
  onClose,
}: {
  userId: string;
  open: boolean;
  onClose: () => void;
}) {
  const query = useAdminDeletionDependencies(userId, open);
  const [showDetails, setShowDetails] = useState(false);

  if (!open) return null;

  const data = query.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 dark:bg-black/70">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[#C5D5EE] bg-white shadow-2xl dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <div className="flex items-center justify-between border-b border-[#D9E3F1] px-5 py-4 dark:border-[#2D3F55]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">Deletion review</p>
            <h2 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Dependency check</h2>
            {data?.user && (
              <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                {data.user.fullName} · {data.user.email}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#C5D5EE] px-3 py-2 text-sm font-semibold text-[#516786] hover:bg-[#F4F8FF] dark:border-[#2D3F55] dark:text-[#AAB9D0] dark:hover:bg-[#243247]">×</button>
        </div>

        <div className="overflow-y-auto p-5">
          {query.isLoading && <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Checking current dependencies...</p>}

          {query.isError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
              Failed to check deletion dependencies. {query.error.message}
            </div>
          )}

          {data && (
            <div className="space-y-5">
              <div className={`rounded-xl border px-4 py-4 ${data.canApprove ? "border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-900/20"}`}>
                <p className={`text-sm font-semibold ${data.canApprove ? "text-green-700 dark:text-green-200" : "text-red-700 dark:text-red-200"}`}>
                  {data.canApprove ? "Clear to approve" : "Blocked by unresolved dependencies"}
                </p>
                <p className={`mt-1 text-sm ${data.canApprove ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                  {data.canApprove ? "No financial or operational blockers were found in the current check." : "Resolve the listed blockers before approving this deletion."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryItem label="Wallet balances" value={data.summary.nonZeroWalletCount} />
                <SummaryItem label="Active jobs" value={data.summary.activeJobsPostedCount + data.summary.activeJobsAssignedCount} />
                <SummaryItem label="Open disputes" value={data.summary.openDisputesCount} />
                <SummaryItem label="Pending withdrawals" value={data.summary.pendingWithdrawalsCount} />
                <SummaryItem label="Pending deposits" value={data.summary.pendingDepositsCount} />
                <SummaryItem label="Pending payments" value={data.summary.pendingJobPaymentsCount} />
                <SummaryItem label="Available earnings" value={formatFecFromMilli(data.summary.availableEarningsMilliFec)} />
                <SummaryItem label="Pending applications" value={data.summary.pendingApplicationsCount} />
              </div>

              {data.blockers.length > 0 && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Blocking dependencies</h3>
                  {data.blockers.map((blocker) => (
                    <div key={blocker.code} className="rounded-lg border border-red-200 bg-white p-4 dark:border-red-800 dark:bg-[#1E2A3A]">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{blocker.title}</p>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">{blocker.count}</span>
                          {blocker.amountMilliFec !== null && <span className="text-xs font-semibold text-[#516786] dark:text-[#AAB9D0]">{formatFecFromMilli(blocker.amountMilliFec)}</span>}
                        </div>
                      </div>
                      <button type="button" onClick={() => setShowDetails((value) => !value)} className="mt-2 text-xs font-semibold text-[#315F96] hover:underline dark:text-[#8FC1F2]">
                        {showDetails ? "Hide records" : "Show records"}
                      </button>
                      {showDetails && (
                        <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-[#F8FAFD] p-3 text-xs leading-5 text-[#516786] dark:bg-[#16202E] dark:text-[#AAB9D0]">{JSON.stringify(blocker.items, null, 2)}</pre>
                      )}
                    </div>
                  ))}
                </section>
              )}

              <section>
                <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Non-blocking retained records and warnings</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryItem label="Open conversations" value={data.summary.openConversationsCount} />
                  <SummaryItem label="Ledger entries" value={data.summary.ledgerEntryCount} />
                  <SummaryItem label="Bank details" value={data.warnings.bankDetailsPresent ? "Present" : "None"} />
                  <SummaryItem label="Verification" value={data.warnings.verificationStatus ?? "None"} />
                </div>
                <p className="mt-3 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Existing ledger, verification, bank, and conversation records are reported for review. This check does not delete or modify those records.
                </p>
              </section>

              <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">Dependency check performed from current database state at {formatDateTime(new Date().toISOString())}.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#D9E3F1] px-5 py-4 dark:border-[#2D3F55]">
          <button type="button" onClick={() => query.refetch()} disabled={query.isFetching} className="rounded-lg border border-[#C5D5EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#315F96] hover:bg-[#F4F8FF] disabled:opacity-50 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2] dark:hover:bg-[#243247]">{query.isFetching ? "Checking..." : "Recheck"}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">Close</button>
        </div>
      </div>
    </div>
  );
}
