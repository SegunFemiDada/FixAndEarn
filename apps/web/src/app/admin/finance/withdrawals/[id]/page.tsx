// Path: apps/web/src/app/admin/finance/withdrawals/[id]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useAdminApproveWithdrawal,
  useAdminMarkPaidWithdrawal,
  useAdminRejectWithdrawal,
  useAdminWithdrawal,
  useAdminWithdrawalEarningsTrace,
} from "@/lib/admin/finance/queries";
import type { WithdrawalStatus } from "@/lib/admin/finance/types";
import { formatFecFromMilli } from "@/lib/wallet/ui";

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusClass(status: WithdrawalStatus) {
  switch (status) {
    case "PENDING":
      return "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
    case "APPROVED":
      return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 text-[#5B8FCC] dark:text-[#7AAEE0]";
    case "PAID":
      return "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200";
    case "REJECTED":
      return "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300";
    default:
      return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] text-[#6B7C99] dark:text-[#8FA0BC]";
  }
}

function DetailField({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string | null | undefined;
  breakAll?: boolean;
}) {
  return (
    <div>
      <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">{label}</span>
      <span className={["mt-1 block text-sm text-[#1A2B4A] dark:text-[#E8F0FA]", breakAll ? "break-all" : ""].join(" ")}>
        {value?.trim() ? value : "Not available"}
      </span>
    </div>
  );
}

export default function AdminWithdrawalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const withdrawalId = typeof params?.id === "string" ? params.id : "";

  const detailQuery = useAdminWithdrawal(withdrawalId, Boolean(withdrawalId));
  const traceQuery = useAdminWithdrawalEarningsTrace(withdrawalId, Boolean(withdrawalId));
  const approveMutation = useAdminApproveWithdrawal(withdrawalId);
  const rejectMutation = useAdminRejectWithdrawal(withdrawalId);
  const paidMutation = useAdminMarkPaidWithdrawal(withdrawalId);

  const [note, setNote] = React.useState("");
  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [currentAction, setCurrentAction] = React.useState<"APPROVE" | "REJECT" | "PAID" | null>(null);

  const detail = detailQuery.data;
  const status = detail?.status ?? null;

  const canApprove = status === "PENDING";
  const canReject = status === "PENDING";
  const canMarkPaid = status === "APPROVED";
  const busy = approveMutation.isPending || rejectMutation.isPending || paidMutation.isPending;

  async function handleApprove() {
    if (!detail) return;

    setMessage(null);

    const confirmed = window.confirm("Approve this withdrawal request?");
    if (!confirmed) return;

    setCurrentAction("APPROVE");

    approveMutation.mutate(
      { note: note.trim() || undefined },
      {
        onSuccess: async (response) => {
          await Promise.all([detailQuery.refetch(), traceQuery.refetch()]);
          setMessage({ type: "ok", text: `Withdrawal updated successfully. Current status: ${response.status}.` });
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  async function handleReject() {
    if (!detail) return;

    const trimmed = note.trim();
    if (!trimmed) {
      setMessage({ type: "err", text: "Reject action requires a note." });
      return;
    }

    setMessage(null);

    const confirmed = window.confirm("Reject this withdrawal request?");
    if (!confirmed) return;

    setCurrentAction("REJECT");

    rejectMutation.mutate(
      { note: trimmed },
      {
        onSuccess: async (response) => {
          await Promise.all([detailQuery.refetch(), traceQuery.refetch()]);
          setMessage({ type: "ok", text: `Withdrawal updated successfully. Current status: ${response.status}.` });
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  async function handleMarkPaid() {
    if (!detail) return;

    setMessage(null);

    const confirmed = window.confirm("Mark this approved withdrawal as paid?");
    if (!confirmed) return;

    setCurrentAction("PAID");

    paidMutation.mutate(
      { note: note.trim() || undefined },
      {
        onSuccess: async (response) => {
          await Promise.all([detailQuery.refetch(), traceQuery.refetch()]);
          setMessage({ type: "ok", text: `Withdrawal updated successfully. Current status: ${response.status}.` });
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Finance detail</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Withdrawal review</h2>
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Review payout details, inspect earning sources, and perform only valid backend-supported status transitions.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/finance/withdrawals"
              className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
            >
              Back to withdrawals
            </Link>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {detailQuery.isLoading ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading withdrawal details...</p>
        </section>
      ) : detailQuery.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">Failed to load withdrawal</h3>
          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">{extractApiErrorMessage(detailQuery.error)}</p>
        </section>
      ) : !detail ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Withdrawal record not found.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{detail.user.fullName}</h3>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium",
                      getStatusClass(detail.status),
                    ].join(" ")}
                  >
                    {detail.status}
                  </span>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium",
                      detail.user.isActive
                        ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                        : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                    ].join(" ")}
                  >
                    {detail.user.isActive ? "User active" : "User inactive"}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField label="Withdrawal ID" value={detail.id} breakAll />
                  <DetailField label="User ID" value={detail.userId} breakAll />
                  <DetailField label="Email" value={detail.user.email} breakAll />
                  <DetailField label="Requested" value={formatDateTime(detail.createdAt)} />
                  <DetailField label="Updated" value={formatDateTime(detail.updatedAt)} />
                  <DetailField label="Reviewed at" value={formatDateTime(detail.reviewedAt)} />
                  <DetailField label="Paid at" value={formatDateTime(detail.paidAt)} />
                  <DetailField label="Reviewed by" value={detail.reviewedBy} breakAll />
                  <DetailField label="Review note" value={detail.reviewNote} />
                  <DetailField label="Transfer reference" value={detail.paystackTransferReference} breakAll />
                  <DetailField label="Transfer code" value={detail.paystackTransferCode} breakAll />
                  <DetailField label="Payout mode" value={detail.payoutMode} />
                  <DetailField
                    label="Wallet balance"
                    value={
                      detail.user.wallet
                        ? formatFecFromMilli(Number(detail.user.wallet.balanceMilliFec ?? 0))
                        : "Not available"
                    }
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Payout destination</h3>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField label="Bank name" value={detail.user.bankDetails?.bankName ?? null} />
                  <DetailField label="Account name" value={detail.user.bankDetails?.accountName ?? null} />
                  <DetailField label="Account number" value={detail.user.bankDetails?.accountNumber ?? null} />
                  <DetailField label="Amount" value={formatFecFromMilli(Number(detail.amountMilliFec ?? 0))} />
                  <DetailField label="Bank code" value={detail.user.bankDetails?.bankCode ?? null} />
                  <DetailField
                    label="Recipient code"
                    value={detail.user.bankDetails?.paystackRecipientCode ?? null}
                    breakAll
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Actions</h3>
                <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Reject requires a note. Approve and mark paid accept an optional note.
                </p>

                <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                  <label htmlFor="withdrawal-note" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Admin note
                  </label>
                  <textarea
                    id="withdrawal-note"
                    rows={5}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Required for reject. Optional for approve and paid."
                    disabled={busy}
                    className="mt-2 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>

                {message && (
                  <div
                    className={[
                      "mt-4 rounded-2xl border p-3 text-sm",
                      message.type === "ok"
                        ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                        : "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                    ].join(" ")}
                  >
                    {message.text}
                  </div>
                )}

                {!canApprove && !canReject && !canMarkPaid && (
                  <div className="mt-4 rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
                    No further admin action is valid for the current status.
                  </div>
                )}

                <div className="mt-4 grid gap-3">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={!canApprove || busy}
                    className={[
                      "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                      !canApprove || busy
                        ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                        : "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]",
                    ].join(" ")}
                  >
                    {approveMutation.isPending && currentAction === "APPROVE" ? "Approving..." : "Approve"}
                  </button>

                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={!canReject || busy}
                    className={[
                      "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
                      !canReject || busy
                        ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                        : "border border-[#F2C0BC] dark:border-red-700 bg-white dark:bg-[#1E2A3A] text-[#D9534F] dark:text-red-300 hover:bg-[#FFF4F3] dark:hover:bg-red-900/20",
                    ].join(" ")}
                  >
                    {rejectMutation.isPending && currentAction === "REJECT" ? "Rejecting..." : "Reject"}
                  </button>

                  <button
                    type="button"
                    onClick={handleMarkPaid}
                    disabled={!canMarkPaid || busy}
                    className={[
                      "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
                      !canMarkPaid || busy
                        ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                        : "border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]",
                    ].join(" ")}
                  >
                    {paidMutation.isPending && currentAction === "PAID" ? "Marking paid..." : "Mark as paid"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Withdrawal trace</p>
                <h3 className="mt-1 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Automated earnings source audit trail</h3>
                <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  The system automatically traces the fixer earning credits and gives a pass or flag verdict. Manual review remains available for payout destination and final payment control.
                </p>
              </div>
            </div>

            {traceQuery.isLoading ? (
              <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Loading earnings trace...
              </div>
            ) : traceQuery.isError ? (
              <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300">
                {extractApiErrorMessage(traceQuery.error)}
              </div>
            ) : !traceQuery.data ? (
              <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                No earnings trace available.
              </div>
            ) : (
              <>
                <div
                  className={[
                    "mt-4 rounded-2xl border p-4",
                    traceQuery.data.summary.autoAssessment.status === "PASS"
                      ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20"
                      : "border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div
                        className={[
                          "inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                          traceQuery.data.summary.autoAssessment.status === "PASS"
                            ? "bg-[#2E7D32] text-white dark:bg-green-700"
                            : "bg-[#F5A623] text-white dark:bg-amber-600",
                        ].join(" ")}
                      >
                        Auto trace {traceQuery.data.summary.autoAssessment.status}
                      </div>

                      <p className="mt-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                        Checked at {formatDateTime(traceQuery.data.summary.autoAssessment.checkedAt)}.
                      </p>

                      {traceQuery.data.summary.autoAssessment.status === "PASS" ? (
                        <p className="mt-2 text-sm text-[#2E7D32] dark:text-green-200">
                          The earning trail is internally consistent enough for automated trace review.
                        </p>
                      ) : (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-[#B45309] dark:text-amber-300">
                            Manual review is required because:
                          </p>
                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#B45309] dark:text-amber-300">
                            {traceQuery.data.summary.autoAssessment.reasons.map((reason) => (
                              <li key={reason}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Withdrawal amount</div>
                    <div className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {formatFecFromMilli(traceQuery.data.summary.withdrawalAmountMilliFec)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Total traced earnings</div>
                    <div className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {formatFecFromMilli(traceQuery.data.summary.totalEarningCreditsMilliFec)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Covered toward withdrawal</div>
                    <div className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {formatFecFromMilli(traceQuery.data.summary.cumulativeCoveredMilliFec)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Remaining uncovered</div>
                    <div className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {formatFecFromMilli(traceQuery.data.summary.remainingUncoveredMilliFec)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Coverage status</div>
                    <div className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {traceQuery.data.summary.coverageReached ? "Covered" : "Partial"}
                    </div>
                  </div>
                </div>

                {traceQuery.data.entries.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                    No traced earning credits were found for this fixer wallet.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-4">
                    {traceQuery.data.entries.map((entry) => (
                      <article key={entry.id} className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                                {entry.jobId ? `Job ${entry.jobId}` : "Unlinked earning entry"}
                              </h4>

                              <span className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-[#5B8FCC] dark:text-[#7AAEE0]">
                                {entry.payoutSource ?? entry.type}
                              </span>

                              {entry.coversWithdrawalAfterThisEntry && (
                                <span className="rounded-full border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 px-3 py-1 text-xs font-medium text-[#2E7D32] dark:text-green-200">
                                  Withdrawal coverage reached
                                </span>
                              )}
                            </div>

                            <div className="mt-3 grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
                              <div>
                                <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                  Entry amount
                                </span>
                                <span className="mt-1 block font-semibold">
                                  {formatFecFromMilli(entry.amountMilliFec)}
                                </span>
                              </div>

                              <div>
                                <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                  Gross amount
                                </span>
                                <span className="mt-1 block">
                                  {entry.grossAmountMilliFec != null
                                    ? formatFecFromMilli(entry.grossAmountMilliFec)
                                    : "Not available"}
                                </span>
                              </div>

                              <div>
                                <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                  Net payout
                                </span>
                                <span className="mt-1 block">
                                  {entry.netAmountMilliFec != null
                                    ? formatFecFromMilli(entry.netAmountMilliFec)
                                    : "Not available"}
                                </span>
                              </div>

                              <div>
                                <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                  Commission
                                </span>
                                <span className="mt-1 block">
                                  {entry.commissionMilliFec != null
                                    ? formatFecFromMilli(entry.commissionMilliFec)
                                    : "Not available"}
                                </span>
                              </div>

                              <div>
                                <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                  Client ID
                                </span>
                                <span className="mt-1 block break-all">{entry.clientId ?? "Not available"}</span>
                              </div>

                              <div>
                                <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                  Fixer ID
                                </span>
                                <span className="mt-1 block break-all">{entry.fixerId ?? "Not available"}</span>
                              </div>

                              <div>
                                <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                  Created
                                </span>
                                <span className="mt-1 block">{formatDateTime(entry.createdAt)}</span>
                              </div>

                              <div>
                                <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                  Cumulative covered
                                </span>
                                <span className="mt-1 block">
                                  {formatFecFromMilli(entry.cumulativeCoveredMilliFec)}
                                </span>
                              </div>
                            </div>

                            {entry.job && (
                              <div className="mt-4 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4">
                                <div className="grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
                                  <div>
                                    <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                      Job status
                                    </span>
                                    <span className="mt-1 block">{entry.job.status}</span>
                                  </div>

                                  <div>
                                    <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                      Locked price
                                    </span>
                                    <span className="mt-1 block">
                                      {entry.job.lockedPriceMilliFec != null
                                        ? formatFecFromMilli(entry.job.lockedPriceMilliFec)
                                        : "Not available"}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                      Original price
                                    </span>
                                    <span className="mt-1 block">
                                      {entry.job.priceMilliFec != null
                                        ? formatFecFromMilli(entry.job.priceMilliFec)
                                        : "Not available"}
                                    </span>
                                  </div>

                                  <div>
                                    <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                                      Completed approved
                                    </span>
                                    <span className="mt-1 block">
                                      {formatDateTime(entry.job.completedApprovedAt)}
                                    </span>
                                  </div>
                                </div>

                                {entry.job.dispute && (
                                  <div className="mt-4 rounded-xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
                                    <div className="font-medium">Dispute-linked payout</div>
                                    <div className="mt-1">Dispute ID: {entry.job.dispute.id}</div>
                                    <div className="mt-1">
                                      Resolution: {entry.job.dispute.resolutionType ?? "Not available"}
                                    </div>
                                    <div className="mt-1">
                                      Resolved: {formatDateTime(entry.job.dispute.resolvedAt)}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}