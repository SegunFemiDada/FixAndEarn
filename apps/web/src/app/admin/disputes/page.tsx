"use client";

import * as React from "react";

import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useAdminDisputeChat,
  useAdminDisputesList,
  useAdminResolveDisputeAmicably,
  useAdminSendDisputeChatMessage,
} from "@/lib/admin/disputes/queries";

import type {
  AdminDisputeChatMessage,
  AdminDisputeItem,
  DisputeStatus,
} from "@/lib/admin/disputes/types";

import { formatFecFromMilli } from "@/lib/wallet/ui";

const STATUS_OPTIONS: Array<{
  label: string;
  value: "" | DisputeStatus;
}> = [
  { label: "All", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "Resolved", value: "RESOLVED" },
];

function formatDateTime(
  value: string | null | undefined,
) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusClass(status: string) {
  if (status === "OPEN") {
    return "border border-[#F5A623] bg-[#FEF8E7] text-[#B45309] dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300";
  }

  if (status === "RESOLVED") {
    return "border border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";
  }

  return "border border-[#C5D5EE] bg-[#F4F8FF] text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]";
}

function formatEvidenceText(evidence: unknown) {
  if (evidence === null || evidence === undefined) {
    return "No evidence provided.";
  }

  if (typeof evidence === "string") {
    return evidence;
  }

  try {
    return JSON.stringify(
      evidence,
      null,
      2,
    );
  } catch {
    return "Evidence is available but could not be displayed.";
  }
}

function getEvidenceNote(evidence: unknown) {
  if (
    !evidence ||
    typeof evidence !== "object" ||
    Array.isArray(evidence)
  ) {
    return null;
  }

  const note = (evidence as {
    note?: unknown;
  }).note;

  return typeof note === "string" &&
    note.trim().length > 0
    ? note
    : null;
}

function getEvidenceImagePath(evidence: unknown) {
  if (
    !evidence ||
    typeof evidence !== "object" ||
    Array.isArray(evidence)
  ) {
    return null;
  }

  const imagePath = (evidence as {
    imagePath?: unknown;
  }).imagePath;

  return typeof imagePath === "string" &&
    imagePath.trim().length > 0
    ? imagePath
    : null;
}

function isAdminMessage(
  message: AdminDisputeChatMessage,
) {
  return message.body
    .trim()
    .startsWith("[ADMIN]");
}

function AdminDisputeChat({
  disputeId,
}: {
  disputeId: string;
}) {
  const [draft, setDraft] = React.useState("");
  const [feedback, setFeedback] =
    React.useState<{
      type: "success" | "error";
      text: string;
    } | null>(null);

  const chatQuery = useAdminDisputeChat(
    {
      disputeId,
      take: 50,
    },
    true,
  );

  const sendMutation =
    useAdminSendDisputeChatMessage(
      disputeId,
    );

  const conversation =
    chatQuery.data?.conversation ?? null;

  const messages =
    chatQuery.data?.messages ?? [];

  function handleSend() {
    const body = draft.trim();

    if (!body) {
      return;
    }

    setFeedback(null);

    sendMutation.mutate(
      { body },
      {
        onSuccess: () => {
          setDraft("");

          setFeedback({
            type: "success",
            text: "Admin message sent.",
          });
        },
        onError: (error) => {
          setFeedback({
            type: "error",
            text: extractApiErrorMessage(
              error,
            ),
          });
        },
      },
    );
  }

  return (
    <section className="rounded-xl border border-[#C5D5EE] bg-white p-4 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Dispute chat
          </h4>

          <p className="mt-1 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
            Review the job conversation and send
            an administrative message when necessary.
          </p>
        </div>

        {conversation && (
          <div className="shrink-0 rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] px-3 py-2 text-[11px] text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]">
            <p>
              <span className="font-medium">
                Conversation:
              </span>{" "}
              {conversation.id}
            </p>

            <p className="mt-1">
              <span className="font-medium">
                Status:
              </span>{" "}
              {conversation.status}
            </p>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={[
            "mt-4 rounded-lg border p-3 text-sm",
            feedback.type === "success"
              ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
              : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
          ].join(" ")}
        >
          {feedback.text}
        </div>
      )}

      {chatQuery.isLoading ? (
        <div className="mt-4 rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] p-4 text-sm text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]">
          Loading dispute chat...
        </div>
      ) : chatQuery.isError ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
          {extractApiErrorMessage(
            chatQuery.error,
          )}
        </div>
      ) : !conversation ? (
        <div className="mt-4 rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] p-4 text-sm text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]">
          No linked conversation was found for
          this dispute.
        </div>
      ) : (
        <>
          <div className="mt-4 max-h-96 space-y-3 overflow-y-auto rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] p-3 dark:border-[#2D3F55] dark:bg-[#16202E]">
            {messages.length === 0 ? (
              <p className="p-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                No messages are available.
              </p>
            ) : (
              messages.map((message) => {
                const adminMessage =
                  isAdminMessage(message);

                return (
                  <div
                    key={message.id}
                    className={[
                      "rounded-xl border p-3",
                      adminMessage
                        ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                        : "border-[#C5D5EE] bg-white dark:border-[#2D3F55] dark:bg-[#1E2A3A]",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                        {adminMessage
                          ? "Admin"
                          : `User ${message.senderId}`}
                      </span>

                      <span className="text-[11px] text-[#6B7C99] dark:text-[#8FA0BC]">
                        {formatDateTime(
                          message.createdAt,
                        )}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {message.body}
                    </p>

                    {message.flags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.flags.map(
                          (flag) => (
                            <span
                              key={flag.id}
                              className="rounded-full border border-[#F5A623] bg-[#FEF8E7] px-2 py-1 text-[11px] font-medium text-[#B45309] dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                            >
                              {flag.type}
                              {flag.matched
                                ? `: ${flag.matched}`
                                : ""}
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4">
            <label
              htmlFor={`admin-dispute-message-${disputeId}`}
              className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
            >
              Admin message
            </label>

            <textarea
              id={`admin-dispute-message-${disputeId}`}
              value={draft}
              onChange={(event) =>
                setDraft(event.target.value)
              }
              rows={4}
              placeholder="Write a message to the client and fixer..."
              disabled={sendMutation.isPending}
              className="mt-2 w-full rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080]"
            />

            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                Administrative messages are marked
                internally with the admin identifier.
              </p>

              <button
                type="button"
                onClick={handleSend}
                disabled={
                  sendMutation.isPending ||
                  draft.trim().length === 0
                }
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {sendMutation.isPending
                  ? "Sending..."
                  : "Send admin message"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function InvestigationPanel({
  dispute,
}: {
  dispute: AdminDisputeItem;
}) {
  const evidenceNote =
    getEvidenceNote(dispute.evidence);

  const evidenceImagePath =
    getEvidenceImagePath(
      dispute.evidence,
    );

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1.15fr]">
      <section className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Evidence
          </h3>

          <span className="text-[11px] uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
            Investigation
          </span>
        </div>

        {evidenceNote && (
          <div className="mt-4 rounded-lg border border-[#C5D5EE] bg-white p-3 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Note
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
              {evidenceNote}
            </p>
          </div>
        )}

        {evidenceImagePath && (
          <div className="mt-4 rounded-lg border border-[#C5D5EE] bg-white p-3 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Evidence image path
            </p>

            <p className="mt-2 break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
              {evidenceImagePath}
            </p>
          </div>
        )}

        <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-[#C5D5EE] bg-white p-3 text-xs leading-5 text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA]">
          {formatEvidenceText(
            dispute.evidence,
          )}
        </pre>
      </section>

      <AdminDisputeChat
        disputeId={dispute.id}
      />
    </div>
  );
}

function DisputeInvestigationRow({
  dispute,
  onResolveAmicably,
  resolving,
}: {
  dispute: AdminDisputeItem;
  onResolveAmicably: (
    disputeId: string,
  ) => void;
  resolving: boolean;
}) {
  return (
    <div className="border-t border-[#C5D5EE] bg-[#F8FAFE] px-5 py-5 dark:border-[#2D3F55] dark:bg-[#131C29]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5B8FCC] dark:text-[#7AAEE0]">
            Investigation
          </p>

          <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Dispute {dispute.id}
          </h3>
        </div>

        {dispute.status === "OPEN" && (
          <button
            type="button"
            onClick={() =>
              onResolveAmicably(dispute.id)
            }
            disabled={resolving}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {resolving
              ? "Resolving..."
              : "Resolve Amicably"}
          </button>
        )}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-[#C5D5EE] bg-white p-3 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-[11px] uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
            Job ID
          </p>

          <p className="mt-1 break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
            {dispute.jobId}
          </p>
        </div>

        <div className="rounded-lg border border-[#C5D5EE] bg-white p-3 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-[11px] uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
            Opened By
          </p>

          <p className="mt-1 break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
            {dispute.openedByUserId}
          </p>
        </div>

        <div className="rounded-lg border border-[#C5D5EE] bg-white p-3 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-[11px] uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
            Created
          </p>

          <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
            {formatDateTime(
              dispute.createdAt,
            )}
          </p>
        </div>

        <div className="rounded-lg border border-[#C5D5EE] bg-white p-3 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-[11px] uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
            Resolved
          </p>

          <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
            {formatDateTime(
              dispute.resolvedAt,
            )}
          </p>
        </div>
      </div>

      <div className="mb-5 rounded-lg border border-[#C5D5EE] bg-white p-4 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
          Reason
        </p>

        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
          {dispute.reason}
        </p>
      </div>

      {dispute.job && (
        <div className="mb-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Related job
            </h3>

            <span className="text-[11px] uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Job context
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-[#C5D5EE] bg-white p-3 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
              <p className="text-[11px] uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Job Status
              </p>

              <p className="mt-1 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                {formatStatus(
                  dispute.job.status,
                )}
              </p>
            </div>

            <div className="rounded-lg border border-[#C5D5EE] bg-white p-3 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
              <p className="text-[11px] uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Client ID
              </p>

              <p className="mt-1 break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                {dispute.job.clientId ??
                  "—"}
              </p>
            </div>

            <div className="rounded-lg border border-[#C5D5EE] bg-white p-3 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
              <p className="text-[11px] uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Fixer ID
              </p>

              <p className="mt-1 break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                {dispute.job.fixerId ??
                  "—"}
              </p>
            </div>

            <div className="rounded-lg border border-[#C5D5EE] bg-white p-3 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
              <p className="text-[11px] uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Locked Price
              </p>

              <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {dispute.job
                  .lockedPriceMilliFec !==
                null
                  ? formatFecFromMilli(
                      dispute.job
                        .lockedPriceMilliFec,
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      <InvestigationPanel
        dispute={dispute}
      />
    </div>
  );
}

export default function AdminDisputesPage() {
  const [status, setStatus] =
    React.useState<
      "" | DisputeStatus
    >("OPEN");

  const [jobIdInput, setJobIdInput] =
    React.useState("");

  const [jobId, setJobId] =
    React.useState("");

  const [expandedId, setExpandedId] =
    React.useState<string | null>(null);

  const [feedback, setFeedback] =
    React.useState<{
      type: "success" | "error";
      text: string;
    } | null>(null);

  const [resolvingId, setResolvingId] =
    React.useState<string | null>(null);

  const listQuery =
    useAdminDisputesList(
      {
        status:
          status || undefined,
        jobId:
          jobId || undefined,
      },
      true,
    );

  const resolveAmicablyMutation =
    useAdminResolveDisputeAmicably();

  const disputes =
    listQuery.data?.disputes ?? [];

  function handleSearch(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setExpandedId(null);
    setJobId(
      jobIdInput.trim(),
    );
  }

  function handleResolveAmicably(
    disputeId: string,
  ) {
    setFeedback(null);

    const confirmed =
      window.confirm(
        "Resolve this dispute amicably? The dispute will close and the job will return to IN_PROGRESS so the fixer can request completion again. No refund or payout is performed by this action.",
      );

    if (!confirmed) {
      return;
    }

    setResolvingId(disputeId);

    resolveAmicablyMutation.mutate(
      { disputeId },
      {
        onSuccess: () => {
          setResolvingId(null);
          setExpandedId(null);

          setFeedback({
            type: "success",
            text:
              "Dispute resolved amicably. The job is back in progress.",
          });
        },

        onError: (error) => {
          setResolvingId(null);

          setFeedback({
            type: "error",
            text: extractApiErrorMessage(
              error,
            ),
          });
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Disputes
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Dispute Management
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              Investigate disputed jobs, review
              evidence, inspect job conversations,
              and resolve disputes without moving
              customer funds through the platform.
            </p>
          </div>

          <div className="shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            <p className="font-semibold">
              Investigation only
            </p>

            <p className="mt-1 max-w-sm">
              No refund, payout, release, or
              split-funds action is available here.
            </p>
          </div>
        </div>
      </section>

      {feedback && (
        <div
          className={[
            "rounded-xl border p-4 text-sm",
            feedback.type === "success"
              ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
              : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
          ].join(" ")}
        >
          {feedback.text}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#C5D5EE] bg-white shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <form
          onSubmit={handleSearch}
          className="grid gap-4 border-b border-[#C5D5EE] p-5 dark:border-[#2D3F55] lg:grid-cols-[180px_minmax(0,1fr)_auto]"
        >
          <div>
            <label
              htmlFor="dispute-status"
              className="block text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]"
            >
              Status
            </label>

            <select
              id="dispute-status"
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value as
                    | ""
                    | DisputeStatus,
                );
                setExpandedId(null);
              }}
              className="mt-2 w-full rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] px-3 py-2.5 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={option.label}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="dispute-job-id"
              className="block text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]"
            >
              Job ID
            </label>

            <input
              id="dispute-job-id"
              value={jobIdInput}
              onChange={(event) =>
                setJobIdInput(
                  event.target.value,
                )
              }
              placeholder="Search by job ID"
              className="mt-2 w-full rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] px-3 py-2.5 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            />
          </div>

          <button
            type="submit"
            className="self-end rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        {listQuery.isLoading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-3">
              <div className="h-10 rounded-lg bg-[#EAF0FB] dark:bg-[#16202E]" />
              <div className="h-10 rounded-lg bg-[#EAF0FB] dark:bg-[#16202E]" />
              <div className="h-10 rounded-lg bg-[#EAF0FB] dark:bg-[#16202E]" />
              <div className="h-10 rounded-lg bg-[#EAF0FB] dark:bg-[#16202E]" />
            </div>
          </div>
        ) : listQuery.isError ? (
          <div className="p-5">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
              {extractApiErrorMessage(
                listQuery.error,
              )}
            </div>
          </div>
        ) : disputes.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              No disputes found
            </p>

            <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
              No disputes match the selected
              filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-295 text-left">
              <thead className="sticky top-0 z-10 border-b border-[#C5D5EE] bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#16202E]">
                <tr>
                  <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Dispute
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Job
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Opened By
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Reason
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Job Status
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Locked Price
                  </th>

                  <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Created
                  </th>

                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E4EBF6] dark:divide-[#2D3F55]">
                {disputes.map((dispute) => {
                  const expanded =
                    expandedId ===
                    dispute.id;

                  return (
                    <React.Fragment
                      key={dispute.id}
                    >
                      <tr
                        className={
                          expanded
                            ? "bg-[#F8FAFE] dark:bg-[#131C29]"
                            : "hover:bg-[#FAFCFF] dark:hover:bg-[#192433]"
                        }
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="flex min-w-48 flex-col gap-2">
                            <span
                              className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClass(
                                dispute.status,
                              )}`}
                            >
                              {formatStatus(
                                dispute.status,
                              )}
                            </span>

                            <span className="break-all font-mono text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {dispute.id}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className="break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {dispute.jobId}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className="break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {dispute.openedByUserId}
                          </span>
                        </td>

                        <td className="max-w-72 px-4 py-4 align-top">
                          <p
                            className="line-clamp-2 text-sm leading-5 text-[#1A2B4A] dark:text-[#E8F0FA]"
                            title={
                              dispute.reason
                            }
                          >
                            {dispute.reason}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          {dispute.job ? (
                            <span className="rounded-full border border-[#C5D5EE] bg-[#F4F8FF] px-2.5 py-1 text-[11px] font-medium text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]">
                              {formatStatus(
                                dispute.job
                                  .status,
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                              Not available
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {dispute.job
                              ?.lockedPriceMilliFec !==
                            null &&
                            dispute.job
                              ?.lockedPriceMilliFec !==
                              undefined
                              ? formatFecFromMilli(
                                  dispute.job
                                    .lockedPriceMilliFec,
                                )
                              : "—"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 align-top">
                          <span className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                            {formatDateTime(
                              dispute.createdAt,
                            )}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top text-right">
                          <div className="flex min-w-40 flex-col items-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(
                                  expanded
                                    ? null
                                    : dispute.id,
                                )
                              }
                              className="inline-flex items-center justify-center rounded-lg border border-[#C5D5EE] bg-white px-3 py-2 text-xs font-semibold text-[#1A2B4A] transition-colors hover:bg-[#F4F8FF] focus:ring-2 focus:ring-[#5B8FCC]/30 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA] dark:hover:bg-[#16202E]"
                            >
                              {expanded
                                ? "Hide Investigation"
                                : "Open Investigation"}
                            </button>

                            {dispute.status ===
                              "OPEN" && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleResolveAmicably(
                                    dispute.id,
                                  )
                                }
                                disabled={
                                  resolvingId ===
                                  dispute.id
                                }
                                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                              >
                                {resolvingId ===
                                dispute.id
                                  ? "Resolving..."
                                  : "Resolve Amicably"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {expanded && (
                        <tr>
                          <td
                            colSpan={8}
                            className="p-0"
                          >
                            <DisputeInvestigationRow
                              dispute={
                                dispute
                              }
                              onResolveAmicably={
                                handleResolveAmicably
                              }
                              resolving={
                                resolvingId ===
                                dispute.id
                              }
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#C5D5EE] px-5 py-3 dark:border-[#2D3F55]">
          <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
            {disputes.length} dispute
            {disputes.length === 1
              ? ""
              : "s"}
          </p>

          <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
            Showing current result set
          </p>
        </div>
      </section>
    </div>
  );
}