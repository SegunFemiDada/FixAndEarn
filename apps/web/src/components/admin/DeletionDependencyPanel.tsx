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

function humanizeKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "Not available";

  if (typeof value === "boolean") return value ? "Yes" : "No";

  if (typeof value === "number") {
    if (key.toLowerCase().includes("millifec")) {
      return formatFecFromMilli(value);
    }
    return value.toLocaleString("en-NG");
  }

  if (typeof value === "string") {
    if (key.toLowerCase().endsWith("at") || key.toLowerCase().includes("date")) {
      return formatDateTime(value);
    }
    return value;
  }

  return String(value);
}

function RecordValue({
  value,
  fieldKey,
  nested = false,
}: {
  value: unknown;
  fieldKey?: string;
  nested?: boolean;
}) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <span>None</span>;

    return (
      <div className={nested ? "space-y-2" : "space-y-3"}>
        {value.map((item, index) => (
          <div key={`${fieldKey ?? "item"}-${index}`} className={nested ? "pl-3" : "border-l-2 border-[#DCE6F4] pl-3 dark:border-[#2D3F55]"}>
            <RecordValue value={item} fieldKey={`${fieldKey ?? "item"} ${index + 1}`} nested />
          </div>
        ))}
      </div>
    );
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span>None</span>;

    return (
      <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2">
        {entries.map(([key, childValue]) => (
          <div key={key} className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7A8BA5] dark:text-[#8294AF]">
              {humanizeKey(key)}
            </p>
            <div className="mt-1 wrap-break-word text-xs leading-5 text-[#334B6B] dark:text-[#C0CCDD]">
              <RecordValue value={childValue} fieldKey={key} nested />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span>{formatValue(fieldKey ?? "", value)}</span>;
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
  const [expandedBlockers, setExpandedBlockers] = useState<Set<string>>(new Set());

  if (!open) return null;

  const data = query.data;

  const toggleBlocker = (code: string) => {
    setExpandedBlockers((current) => {
      const next = new Set(current);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

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
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dependency check"
            className="rounded-lg border border-[#C5D5EE] px-3 py-2 text-sm font-semibold text-[#516786] hover:bg-[#F4F8FF] dark:border-[#2D3F55] dark:text-[#AAB9D0] dark:hover:bg-[#243247]"
          >
            ×
          </button>
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
                  <div>
                    <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Blocking dependencies</h3>
                    <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      Each dependency has its own record viewer. Opening one does not open the others.
                    </p>
                  </div>

                  {data.blockers.map((blocker) => {
                    const isExpanded = expandedBlockers.has(blocker.code);

                    return (
                      <div key={blocker.code} className="rounded-lg border border-red-200 bg-white dark:border-red-800 dark:bg-[#1E2A3A]">
                        <div className="p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{blocker.title}</p>
                              <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                                {blocker.count.toLocaleString("en-NG")} record{blocker.count === 1 ? "" : "s"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                                Blocking
                              </span>
                              {blocker.amountMilliFec !== null && (
                                <span className="text-xs font-semibold text-[#516786] dark:text-[#AAB9D0]">
                                  {formatFecFromMilli(blocker.amountMilliFec)}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleBlocker(blocker.code)}
                            aria-expanded={isExpanded}
                            className="mt-3 rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3 py-2 text-xs font-semibold text-[#315F96] hover:bg-[#EEF4FC] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FC1F2] dark:hover:bg-[#243247]"
                          >
                            {isExpanded ? "Hide records" : "Show records"}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-red-100 bg-[#FBFCFE] p-4 dark:border-red-900 dark:bg-[#182331]">
                            <div className="space-y-3">
                              {blocker.items.length === 0 ? (
                                <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No records returned.</p>
                              ) : (
                                blocker.items.map((item, index) => (
                                  <div key={`${blocker.code}-${index}`} className="rounded-lg border border-[#DCE6F4] bg-white p-4 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
                                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#E5EBF4] pb-2 dark:border-[#2D3F55]">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5B8FCC] dark:text-[#7AAEE0]">
                                        Record {index + 1}
                                      </p>
                                      <span className="text-[10px] font-medium text-[#7A8BA5] dark:text-[#8294AF]">
                                        {blocker.code.replaceAll("_", " ")}
                                      </span>
                                    </div>
                                    <RecordValue value={item} />
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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

              <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">Dependency check uses the current database state. Recheck to refresh the results after resolving a dependency.</p>
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
