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

const PANEL_CLASS =
  "rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] shadow-[0_4px_24px_rgba(91,143,204,0.10)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]";

const SUBPANEL_CLASS =
  "rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F8FAFD] dark:bg-[#16202E]";

const FIELD_LABEL_CLASS =
  "block text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]";

const FIELD_VALUE_CLASS =
  "mt-1 block text-sm text-[#1A2B4A] dark:text-[#E8F0FA]";

const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]";

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

function getJobStatusClass(status: string) {
  switch (status) {
    case "OPEN":
      return "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
    case "IN_PROGRESS":
      return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 text-[#5B8FCC] dark:text-[#7AAEE0]";
    case "COMPLETED":
      return "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200";
    case "DISPUTED":
      return "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300";
    case "CANCELLED":
      return "border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    default:
      return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] text-[#6B7C99] dark:text-[#8FA0BC]";
  }
}

function getCoverageClass(covered: boolean) {
  return covered
    ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
    : "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
}

function getPayoutModeClass(mode: string | null | undefined) {
  switch (mode) {
    case "BANK_TRANSFER":
      return "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200";
    case "MONNIFY":
      return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 text-[#5B8FCC] dark:text-[#7AAEE0]";
    case "MANUAL":
      return "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
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
    <div className="min-w-0">
      <span className={FIELD_LABEL_CLASS}>{label}</span>
      <span
        className={[
          FIELD_VALUE_CLASS,
          breakAll ? "break-all" : "",
        ].join(" ")}
      >
        {value?.trim() ? value : "Not available"}
      </span>
    </div>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${PANEL_CLASS} p-5 ${className}`}>
      <div className="mb-5">
        {eyebrow ? (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5B8FCC] dark:text-[#7AAEE0]">
            {eyebrow}
          </p>
        ) : null}

        <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {title}
        </h3>

        {description ? (
          <p className="mt-1 max-w-4xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function StatusBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function AdminWithdrawalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const withdrawalId =
    typeof params?.id === "string" ? params.id : "";

  const detailQuery = useAdminWithdrawal(
    withdrawalId,
    Boolean(withdrawalId),
  );

  const traceQuery = useAdminWithdrawalEarningsTrace(
    withdrawalId,
    Boolean(withdrawalId),
  );

  const approveMutation =
    useAdminApproveWithdrawal(withdrawalId);

  const rejectMutation =
    useAdminRejectWithdrawal(withdrawalId);

  const paidMutation =
    useAdminMarkPaidWithdrawal(withdrawalId);

  const [note, setNote] = React.useState("");

  const [message, setMessage] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [currentAction, setCurrentAction] =
    React.useState<
      "APPROVE" | "REJECT" | "PAID" | null
    >(null);

  const [selectedAction, setSelectedAction] =
    React.useState<
      "APPROVE" | "REJECT" | "PAID" | null
    >(null);

  const [showConfirmModal, setShowConfirmModal] =
    React.useState(false);

  const detail = detailQuery.data;
  const status = detail?.status ?? null;

  const allowedActions = {
    approve: status === "PENDING",
    reject: status === "PENDING",
    markPaid: status === "APPROVED",
  };

  const busy =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    paidMutation.isPending;

  function openAction(
    action: "APPROVE" | "REJECT" | "PAID",
  ) {
    setSelectedAction(action);
    setMessage(null);
    setShowConfirmModal(true);
  }

  async function confirmAction() {
    if (!selectedAction) return;

    setCurrentAction(selectedAction);
    setMessage(null);

    try {
      switch (selectedAction) {
        case "APPROVE":
          await approveMutation.mutateAsync({
            note: note.trim() || undefined,
          });

          setMessage({
            type: "ok",
            text: "Withdrawal approved successfully.",
          });
          break;

        case "REJECT":
          if (!note.trim()) {
            setMessage({
              type: "err",
              text: "A rejection note is required.",
            });
            return;
          }

          await rejectMutation.mutateAsync({
            note: note.trim(),
          });

          setMessage({
            type: "ok",
            text: "Withdrawal rejected successfully.",
          });
          break;

        case "PAID":
          await paidMutation.mutateAsync({
            note: note.trim() || undefined,
          });

          setMessage({
            type: "ok",
            text: "Withdrawal marked as paid successfully.",
          });
          break;
      }

      setShowConfirmModal(false);
      setSelectedAction(null);
      setNote("");

      await detailQuery.refetch();
    } catch (error) {
      setMessage({
        type: "err",
        text: extractApiErrorMessage(error),
      });
    } finally {
      setCurrentAction(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className={`${PANEL_CLASS} p-6`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                Finance
              </p>

              {detail ? (
                <StatusBadge
                  className={getStatusClass(detail.status)}
                >
                  {detail.status}
                </StatusBadge>
              ) : null}
            </div>

            <h2 className="mt-2 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Withdrawal review
            </h2>

            <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Review the withdrawal, verify its payout destination,
              inspect the earnings trace, and perform only valid
              backend-supported status transitions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/finance/withdrawals"
              className={SECONDARY_BUTTON_CLASS}
            >
              Back to withdrawals
            </Link>

            <button
              type="button"
              onClick={() => {
                void detailQuery.refetch();
                void traceQuery.refetch();
              }}
              disabled={
                detailQuery.isFetching ||
                traceQuery.isFetching
              }
              className={SECONDARY_BUTTON_CLASS}
            >
              {detailQuery.isFetching || traceQuery.isFetching
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </div>
      </section>

      {/* Loading / error states */}
      {detailQuery.isLoading ? (
        <section className={`${PANEL_CLASS} p-6`}>
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading withdrawal details...
          </p>
        </section>
      ) : detailQuery.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] bg-[#FFF4F3] p-6 dark:border-red-700 dark:bg-red-900/20">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">
            Failed to load withdrawal
          </h3>

          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(detailQuery.error)}
          </p>
        </section>
      ) : !detail ? (
        <section className={`${PANEL_CLASS} p-6`}>
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Withdrawal record not found.
          </p>
        </section>
      ) : (
        <>
          {/* Investigation summary */}
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
            <div className="space-y-6">
              <Section
                eyebrow="Withdrawal"
                title={detail.user.fullName}
                description="Core withdrawal record, user context, status history, and transfer information."
              >
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField
                    label="Withdrawal ID"
                    value={detail.id}
                    breakAll
                  />

                  <DetailField
                    label="User ID"
                    value={detail.userId}
                    breakAll
                  />

                  <DetailField
                    label="Email"
                    value={detail.user.email}
                    breakAll
                  />

                  <DetailField
                    label="Requested"
                    value={formatDateTime(detail.createdAt)}
                  />

                  <DetailField
                    label="Updated"
                    value={formatDateTime(detail.updatedAt)}
                  />

                  <DetailField
                    label="Reviewed at"
                    value={formatDateTime(detail.reviewedAt)}
                  />

                  <DetailField
                    label="Paid at"
                    value={formatDateTime(detail.paidAt)}
                  />

                  <DetailField
                    label="Reviewed by"
                    value={detail.reviewedBy}
                    breakAll
                  />

                  <DetailField
                    label="Review note"
                    value={detail.reviewNote}
                  />

                  <DetailField
                    label="Transfer reference"
                    value={detail.transferReference}
                    breakAll
                  />

                  <DetailField
                    label="Transfer code"
                    value={detail.transferCode}
                    breakAll
                  />

                  <DetailField
                    label="Transfer ID"
                    value={detail.transferId}
                    breakAll
                  />

                  <div>
                    <span className={FIELD_LABEL_CLASS}>
                      Payout mode
                    </span>

                    <StatusBadge
                      className={[
                        "mt-2",
                        getPayoutModeClass(detail.payoutMode),
                      ].join(" ")}
                    >
                      {detail.payoutMode ?? "Unknown"}
                    </StatusBadge>
                  </div>

                  <DetailField
                    label="Wallet balance"
                    value={
                      detail.user.wallet
                        ? formatFecFromMilli(
                            Number(
                              detail.user.wallet
                                .balanceMilliFec ?? 0,
                            ),
                          )
                        : "Not available"
                    }
                  />

                  <div>
                    <span className={FIELD_LABEL_CLASS}>
                      Account status
                    </span>

                    <StatusBadge
                      className={
                        detail.user.isActive
                          ? "mt-2 border border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                          : "mt-2 border border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                      }
                    >
                      {detail.user.isActive
                        ? "Active"
                        : "Inactive"}
                    </StatusBadge>
                  </div>
                </div>
              </Section>

              <Section
                eyebrow="Payout"
                title="Payout destination"
                description="Bank and withdrawal amount information associated with this request."
              >
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField
                    label="Amount"
                    value={formatFecFromMilli(
                      Number(detail.amountMilliFec ?? 0),
                    )}
                  />

                  <DetailField
                    label="Bank name"
                    value={
                      detail.user.bankDetails?.bankName ??
                      null
                    }
                  />

                  <DetailField
                    label="Account name"
                    value={
                      detail.user.bankDetails?.accountName ??
                      null
                    }
                  />

                  <DetailField
                    label="Account number"
                    value={
                      detail.user.bankDetails?.accountNumber ??
                      null
                    }
                    breakAll
                  />

                  <DetailField
                    label="Bank code"
                    value={
                      detail.user.bankDetails?.bankCode ??
                      null
                    }
                  />
                </div>
              </Section>
            </div>

            {/* Action panel */}
            <div className="xl:sticky xl:top-6 xl:self-start">
              <Section
                eyebrow="Admin control"
                title="Actions"
                description="Only the status transitions currently supported by the backend are available."
              >
                <div className={`${SUBPANEL_CLASS} p-4`}>
                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div>
                      <span className={FIELD_LABEL_CLASS}>
                        Current status
                      </span>

                      <div className="mt-2">
                        <StatusBadge
                          className={getStatusClass(
                            detail.status,
                          )}
                        >
                          {detail.status}
                        </StatusBadge>
                      </div>
                    </div>

                    <div>
                      <span className={FIELD_LABEL_CLASS}>
                        Valid transitions
                      </span>

                      <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {allowedActions.approve ||
                        allowedActions.reject
                          ? "Pending review"
                          : allowedActions.markPaid
                            ? "Approved to paid"
                            : "No further transition"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="withdrawal-note"
                    className="block text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]"
                  >
                    Admin note
                  </label>

                  <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Required when rejecting. Optional when
                    approving or marking as paid.
                  </p>

                  <textarea
                    id="withdrawal-note"
                    rows={5}
                    value={note}
                    onChange={(event) =>
                      setNote(event.target.value)
                    }
                    placeholder="Enter an administrative note..."
                    disabled={busy}
                    className="mt-3 w-full resize-y rounded-xl border border-[#C5D5EE] bg-white px-3 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080]"
                  />
                </div>

                {message ? (
                  <div
                    className={[
                      "mt-4 rounded-xl border p-3 text-sm",
                      message.type === "ok"
                        ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                        : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
                    ].join(" ")}
                  >
                    {message.text}
                  </div>
                ) : null}

                {!allowedActions.approve &&
                !allowedActions.reject &&
                !allowedActions.markPaid ? (
                  <div className="mt-4 rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-3 text-sm text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]">
                    No further admin action is valid for the
                    current status.
                  </div>
                ) : null}

                <div className="mt-4 grid gap-2">
                  <button
                    type="button"
                    onClick={() => openAction("APPROVE")}
                    disabled={
                      !allowedActions.approve || busy
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {approveMutation.isPending &&
                    currentAction === "APPROVE"
                      ? "Approving..."
                      : "Approve withdrawal"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openAction("REJECT")}
                    disabled={
                      !allowedActions.reject || busy
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {rejectMutation.isPending &&
                    currentAction === "REJECT"
                      ? "Rejecting..."
                      : "Reject withdrawal"}
                  </button>

                  <button
                    type="button"
                    onClick={() => openAction("PAID")}
                    disabled={
                      !allowedActions.markPaid || busy
                    }
                    className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {paidMutation.isPending &&
                    currentAction === "PAID"
                      ? "Marking paid..."
                      : "Mark as paid"}
                  </button>
                </div>
              </Section>
            </div>
          </section>

          {/* Earnings trace */}
          <Section
            eyebrow="Withdrawal trace"
            title="Automated earnings source audit trail"
            description="The system automatically traces fixer earning credits and provides a pass or flag assessment. Manual review remains available for payout destination and final payment control."
          >
            {traceQuery.isLoading ? (
              <div className={`${SUBPANEL_CLASS} p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]`}>
                Loading earnings trace...
              </div>
            ) : traceQuery.isError ? (
              <div className="rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] p-4 text-sm text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
                {extractApiErrorMessage(
                  traceQuery.error,
                )}
              </div>
            ) : !traceQuery.data ? (
              <div className={`${SUBPANEL_CLASS} p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]`}>
                No earnings trace available.
              </div>
            ) : (
              <>
                {/* Automated assessment */}
                <div
                  className={[
                    "rounded-xl border p-5",
                    traceQuery.data.summary.autoAssessment
                      .status === "PASS"
                      ? "border-[#B8D9B8] bg-[#F0FAF0] dark:border-green-700 dark:bg-green-900/20"
                      : "border-[#F5A623] bg-[#FEF8E7] dark:border-amber-700 dark:bg-amber-900/20",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <StatusBadge
                        className={
                          traceQuery.data.summary
                            .autoAssessment.status ===
                          "PASS"
                            ? "border border-green-700 bg-green-700 text-white"
                            : "border border-amber-600 bg-amber-600 text-white"
                        }
                      >
                        Auto trace{" "}
                        {
                          traceQuery.data.summary
                            .autoAssessment.status
                        }
                      </StatusBadge>

                      <p className="mt-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                        Checked at{" "}
                        {formatDateTime(
                          traceQuery.data.summary
                            .autoAssessment.checkedAt,
                        )}
                        .
                      </p>

                      {traceQuery.data.summary.autoAssessment
                        .status === "PASS" ? (
                        <p className="mt-2 text-sm text-[#2E7D32] dark:text-green-200">
                          The earning trail is internally
                          consistent enough for automated trace
                          review.
                        </p>
                      ) : (
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-[#B45309] dark:text-amber-300">
                            Manual review is required because:
                          </p>

                          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#B45309] dark:text-amber-300">
                            {traceQuery.data.summary
                              .autoAssessment.reasons.map(
                                (reason) => (
                                  <li key={reason}>
                                    {reason}
                                  </li>
                                ),
                              )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit summary */}
                <div className={`${SUBPANEL_CLASS} mt-4 p-5`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className={FIELD_LABEL_CLASS}>
                        Audit summary
                      </p>

                      <h4 className="mt-1 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        Withdrawal coverage
                      </h4>
                    </div>

                    <StatusBadge
                      className={getCoverageClass(
                        traceQuery.data.summary
                          .coverageReached,
                      )}
                    >
                      {traceQuery.data.summary.coverageReached
                        ? "Fully Covered"
                        : traceQuery.data.entries.length ===
                            0
                          ? "No Allocation"
                          : "Partially Covered"}
                    </StatusBadge>
                  </div>

                  <div className="mt-5 grid gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
                    <DetailField
                      label="Withdrawal amount"
                      value={formatFecFromMilli(
                        traceQuery.data.summary
                          .withdrawalAmountMilliFec,
                      )}
                    />

                    <DetailField
                      label="Allocations used"
                      value={`${traceQuery.data.entries.length}`}
                    />

                    <DetailField
                      label="Audit checked"
                      value={formatDateTime(
                        traceQuery.data.summary
                          .autoAssessment.checkedAt,
                      )}
                    />

                    <DetailField
                      label="Review"
                      value={
                        traceQuery.data.summary
                          .autoAssessment.status ===
                        "PASS"
                          ? "Automatic"
                          : "Manual Required"
                      }
                    />
                  </div>
                </div>

                {/* Financial integrity */}
                <div className={`${SUBPANEL_CLASS} mt-4 p-5`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className={FIELD_LABEL_CLASS}>
                        Financial integrity
                      </p>

                      <h4 className="mt-1 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        Earnings reconciliation
                      </h4>
                    </div>

                    <StatusBadge
                      className={
                        traceQuery.data.integrity
                          .walletMatches
                          ? "border border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                          : "border border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                      }
                    >
                      {traceQuery.data.integrity
                        .walletMatches
                        ? "MATCH"
                        : "MISMATCH"}
                    </StatusBadge>
                  </div>

                  <div className="mt-5 grid gap-x-6 gap-y-5 md:grid-cols-2 xl:grid-cols-4">
                    <DetailField
                      label="Expected available earnings"
                      value={formatFecFromMilli(
                        traceQuery.data.integrity
                          .expectedWithdrawableBalanceMilliFec,
                      )}
                    />

                    <DetailField
                      label="Current available earnings"
                      value={formatFecFromMilli(
                        traceQuery.data.integrity
                          .actualWithdrawableBalanceMilliFec,
                      )}
                    />

                    <DetailField
                      label="Difference"
                      value={formatFecFromMilli(
                        traceQuery.data.integrity
                          .differenceMilliFec,
                      )}
                    />

                    <DetailField
                      label="Result"
                      value={
                        traceQuery.data.integrity
                          .walletMatches
                          ? "PASS"
                          : "FAILED"
                      }
                    />
                  </div>
                </div>

                {/* Earning entries */}
                {traceQuery.data.entries.length === 0 ? (
                  <div className={`${SUBPANEL_CLASS} mt-4 p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]`}>
                    No traced earning credits were found for
                    this fixer wallet.
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {traceQuery.data.entries.map((entry) => (
                      <article
                        key={entry.allocationId}
                        className={`${SUBPANEL_CLASS} overflow-hidden`}
                      >
                        <div className="border-b border-[#C5D5EE] px-5 py-4 dark:border-[#2D3F55]">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0">
                              <h4 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                                Earning allocation
                              </h4>

                              <p className="mt-1 break-all text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                                Allocation ID:{" "}
                                {entry.allocationId}
                              </p>
                            </div>

                            <StatusBadge
                              className={
                                entry.earningStatus ===
                                "AVAILABLE"
                                  ? "border border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                                  : "border border-[#C5D5EE] bg-[#EAF0FB] text-[#5B8FCC] dark:border-[#2D3F55] dark:bg-blue-900/20 dark:text-[#7AAEE0]"
                              }
                            >
                              {entry.earningStatus}
                            </StatusBadge>
                          </div>
                        </div>

                        <div className="p-5">
                          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
                            <DetailField
                              label="Allocated from earning"
                              value={formatFecFromMilli(
                                entry.amountMilliFec,
                              )}
                            />

                            <DetailField
                              label="Remaining available"
                              value={formatFecFromMilli(
                                entry.remainingAvailableMilliFec,
                              )}
                            />

                            <DetailField
                              label="Earned at"
                              value={formatDateTime(
                                entry.earnedAt,
                              )}
                            />

                            <DetailField
                              label="Cumulative covered"
                              value={formatFecFromMilli(
                                entry.cumulativeCoveredMilliFec,
                              )}
                            />

                            <DetailField
                              label="Earning ID"
                              value={entry.earningId}
                              breakAll
                            />

                            <DetailField
                              label="Job ID"
                              value={entry.job.id}
                              breakAll
                            />

                            <DetailField
                              label="Client"
                              value={
                                entry.job.client
                                  ? `${entry.job.client.fullName} (${entry.job.client.email})`
                                  : "Unknown"
                              }
                            />

                            <DetailField
                              label="Fixer"
                              value={
                                entry.job.fixer
                                  ? `${entry.job.fixer.fullName} (${entry.job.fixer.email})`
                                  : "Unknown"
                              }
                            />
                          </div>

                          {/* Job information */}
                          <div className="mt-5 rounded-xl border border-[#C5D5EE] bg-white p-5 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h5 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                                Job information
                              </h5>

                              <StatusBadge
                                className={getJobStatusClass(
                                  entry.job.status,
                                )}
                              >
                                {entry.job.status}
                              </StatusBadge>
                            </div>

                            <div className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
                              <DetailField
                                label="Locked price"
                                value={
                                  entry.job
                                    .lockedPriceMilliFec !=
                                  null
                                    ? formatFecFromMilli(
                                        entry.job
                                          .lockedPriceMilliFec,
                                      )
                                    : "Not available"
                                }
                              />

                              <DetailField
                                label="Original price"
                                value={
                                  entry.job.priceMilliFec !=
                                  null
                                    ? formatFecFromMilli(
                                        entry.job
                                          .priceMilliFec,
                                      )
                                    : "Not available"
                                }
                              />

                              <DetailField
                                label="Payment amount"
                                value={
                                  entry.job.latestPayment
                                    ? formatFecFromMilli(
                                        entry.job
                                          .latestPayment
                                          .amountMilliFec,
                                      )
                                    : "No payment record"
                                }
                              />

                              <DetailField
                                label="Payment status"
                                value={
                                  entry.job.latestPayment
                                    ?.status ?? "Unknown"
                                }
                              />

                              <DetailField
                                label="Payment reference"
                                value={
                                  entry.job.latestPayment
                                    ?.providerReference ??
                                  "Not available"
                                }
                                breakAll
                              />

                              <DetailField
                                label="Client status"
                                value={
                                  entry.job.client
                                    ? entry.job.client
                                        .isActive
                                      ? "Active"
                                      : "Inactive"
                                    : "Unknown"
                                }
                              />

                              <DetailField
                                label="Fixer status"
                                value={
                                  entry.job.fixer
                                    ? entry.job.fixer
                                        .isActive
                                      ? "Active"
                                      : "Inactive"
                                    : "Unknown"
                                }
                              />

                              <DetailField
                                label="Completed"
                                value={formatDateTime(
                                  entry.job
                                    .completedApprovedAt,
                                )}
                              />
                            </div>

                            {entry.job.dispute ? (
                              <div className="mt-5 rounded-xl border border-[#F5A623] bg-[#FEF8E7] p-4 dark:border-amber-700 dark:bg-amber-900/20">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-[#B45309] dark:text-amber-300">
                                    Dispute resolution
                                  </p>

                                  <StatusBadge className="border border-amber-700 bg-amber-600 text-white">
                                    Resolved
                                  </StatusBadge>
                                </div>

                                <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                                  <DetailField
                                    label="Dispute ID"
                                    value={
                                      entry.job.dispute.id
                                    }
                                    breakAll
                                  />

                                  <DetailField
                                    label="Resolved at"
                                    value={formatDateTime(
                                      entry.job.dispute
                                        .resolvedAt,
                                    )}
                                  />
                                </div>
                              </div>
                            ) : null}

                            {entry.coversWithdrawalAfterThisEntry ? (
                              <div className="mt-5 rounded-xl border border-[#B8D9B8] bg-[#F0FAF0] p-3 text-sm font-medium text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200">
                                Withdrawal amount becomes fully
                                covered after this earning allocation.
                              </div>
                            ) : null}
                          </div>

                          {/* Payment verification */}
                          {entry.job.latestPayment ? (
                            <div className="mt-5 rounded-xl border border-green-300 bg-green-50 p-4 dark:border-green-700 dark:bg-green-900/20">
                              <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                                Payment verification
                              </p>

                              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                                Client payment exists and can be
                                traced to this earning.
                              </p>
                            </div>
                          ) : (
                            <div className="mt-5 rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
                              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                Missing payment record
                              </p>

                              <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                                This earning has no payment
                                attached. Manual investigation is
                                strongly recommended before any
                                payout.
                              </p>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </Section>
        </>
      )}

      {/* Confirmation modal */}
      {showConfirmModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-2xl dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                Confirmation
              </p>

              <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Confirm action
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                Are you sure you want to{" "}
                {selectedAction === "APPROVE"
                  ? "approve this withdrawal?"
                  : selectedAction === "REJECT"
                    ? "reject this withdrawal?"
                    : "mark this withdrawal as paid?"}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedAction(null);
                }}
                disabled={busy}
                className={SECONDARY_BUTTON_CLASS}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmAction}
                disabled={busy}
                className={[
                  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50",
                  selectedAction === "REJECT"
                    ? "bg-red-600 hover:bg-red-700"
                    : selectedAction === "PAID"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700",
                ].join(" ")}
              >
                {busy
                  ? "Processing..."
                  : selectedAction === "APPROVE"
                    ? "Approve"
                    : selectedAction === "REJECT"
                      ? "Reject"
                      : "Mark as paid"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}