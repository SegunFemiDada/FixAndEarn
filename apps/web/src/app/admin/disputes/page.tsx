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
    <div className="mt-6 rounded-2xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E] sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Dispute chat
          </h4>

          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Review the job conversation and send an
            administrative message when necessary.
          </p>
        </div>

        {conversation && (
          <div className="rounded-xl border border-[#C5D5EE] bg-white px-3 py-2 text-xs text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FA0BC]">
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
            "mt-4 rounded-xl border p-3 text-sm",
            feedback.type === "success"
              ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
              : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
          ].join(" ")}
        >
          {feedback.text}
        </div>
      )}

      {chatQuery.isLoading ? (
        <div className="mt-4 rounded-xl border border-[#C5D5EE] bg-white p-4 text-sm text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FA0BC]">
          Loading dispute chat...
        </div>
      ) : chatQuery.isError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
          {extractApiErrorMessage(
            chatQuery.error,
          )}
        </div>
      ) : !conversation ? (
        <div className="mt-4 rounded-xl border border-[#C5D5EE] bg-white p-4 text-sm text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FA0BC]">
          No linked conversation was found for
          this dispute.
        </div>
      ) : (
        <>
          <div className="mt-4 max-h-112 space-y-3 overflow-y-auto rounded-2xl border border-[#C5D5EE] bg-white p-4 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
            {messages.length === 0 ? (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
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
                      "rounded-2xl border p-3",
                      adminMessage
                        ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20"
                        : "border-[#C5D5EE] bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#16202E]",
                    ].join(" ")}
                  >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                        {adminMessage
                          ? "Admin"
                          : `User ${message.senderId}`}
                      </span>

                      <span className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        {formatDateTime(
                          message.createdAt,
                        )}
                      </span>
                    </div>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {message.body}
                    </p>

                    {message.flags.length >
                      0 && (
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
              className="mt-2 w-full rounded-xl border border-[#C5D5EE] bg-white px-4 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080]"
            />

            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {sendMutation.isPending
                  ? "Sending..."
                  : "Send admin message"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DisputeCard({
  dispute,
  expanded,
  onToggle,
  onResolveAmicably,
  resolving,
}: {
  dispute: AdminDisputeItem;
  expanded: boolean;
  onToggle: () => void;
  onResolveAmicably: (
    disputeId: string,
  ) => void;
  resolving: boolean;
}) {
  const evidenceNote =
    getEvidenceNote(dispute.evidence);

  const evidenceImagePath =
    getEvidenceImagePath(
      dispute.evidence,
    );

  return (
    <article className="rounded-2xl border border-[#C5D5EE] bg-white p-4 shadow-[0_4px_20px_rgba(91,143,204,0.08)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                dispute.status,
              )}`}
            >
              {formatStatus(dispute.status)}
            </span>

            <span className="rounded-full border border-[#C5D5EE] bg-[#F4F8FF] px-3 py-1 text-xs font-medium text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]">
              Job dispute
            </span>
          </div>

          <h3 className="mt-3 break-all text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Dispute {dispute.id}
          </h3>

          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Job ID
              </p>

              <p className="mt-1 break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                {dispute.jobId}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Opened By
              </p>

              <p className="mt-1 break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                {dispute.openedByUserId}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Created
              </p>

              <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                {formatDateTime(
                  dispute.createdAt,
                )}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Resolved
              </p>

              <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                {formatDateTime(
                  dispute.resolvedAt,
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
            <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Reason
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
              {dispute.reason}
            </p>
          </div>

          {dispute.job && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Job Status
                </p>

                <p className="mt-1 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatStatus(
                    dispute.job.status,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Client ID
                </p>

                <p className="mt-1 break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {dispute.job.clientId ??
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Fixer ID
                </p>

                <p className="mt-1 break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {dispute.job.fixerId ??
                    "—"}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Locked Price
                </p>

                <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {dispute.job.lockedPriceMilliFec !==
                  null
                    ? formatFecFromMilli(
                        dispute.job
                          .lockedPriceMilliFec,
                      )
                    : "—"}
                </p>
              </div>
            </div>
          )}

          {expanded && (
            <div className="mt-6 border-t border-[#C5D5EE] pt-6 dark:border-[#2D3F55]">
              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
                  <h4 className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Evidence
                  </h4>

                  {evidenceNote && (
                    <div className="mt-4 rounded-xl border border-[#C5D5EE] bg-white p-4 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
                      <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                        Note
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {evidenceNote}
                      </p>
                    </div>
                  )}

                  {evidenceImagePath && (
                    <div className="mt-4 rounded-xl border border-[#C5D5EE] bg-white p-4 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
                      <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                        Evidence image path
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {evidenceImagePath}
                      </p>
                    </div>
                  )}

                  <pre className="mt-4 max-h-96 overflow-auto rounded-xl border border-[#C5D5EE] bg-white p-4 text-xs leading-5 text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA]">
                    {formatEvidenceText(
                      dispute.evidence,
                    )}
                  </pre>
                </section>

                <section>
                  <AdminDisputeChat
                    disputeId={dispute.id}
                  />
                </section>
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2 xl:w-56">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center justify-center rounded-lg border border-[#C5D5EE] bg-white px-4 py-3 text-sm font-semibold text-[#1A2B4A] transition-colors hover:bg-[#F4F8FF] focus:ring-2 focus:ring-[#5B8FCC]/30 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA] dark:hover:bg-[#16202E]"
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
                onResolveAmicably(
                  dispute.id,
                )
              }
              disabled={resolving}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {resolving
                ? "Resolving..."
                : "Resolve Amicably"}
            </button>
          )}
        </div>
      </div>
    </article>
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
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
          Disputes
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          Dispute Management
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
          Investigate disputed jobs, review evidence,
          inspect job conversations, and resolve disputes
          without moving customer funds through the platform.
        </p>

        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          FixAndEarn does not custody customer payment funds.
          Dispute resolution therefore does not provide refund,
          payout, release, or split-funds actions. An amicable
          resolution returns the job to the normal completion
          flow.
        </div>
      </section>

      {feedback && (
        <div
          className={[
            "rounded-2xl border p-4 text-sm",
            feedback.type === "success"
              ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
              : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
          ].join(" ")}
        >
          {feedback.text}
        </div>
      )}

      <section className="rounded-2xl border border-[#C5D5EE] bg-white p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] sm:p-6">
        <form
          onSubmit={handleSearch}
          className="grid gap-4 border-b border-[#C5D5EE] pb-5 dark:border-[#2D3F55] lg:grid-cols-[200px_1fr_auto]"
        >
          <div>
            <label
              htmlFor="dispute-status"
              className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
            >
              Status
            </label>

            <select
              id="dispute-status"
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target
                    .value as
                    | ""
                    | DisputeStatus,
                );
                setExpandedId(null);
              }}
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.label
                    }
                    value={
                      option.value
                    }
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
              className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
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
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            />
          </div>

          <button
            type="submit"
            className="self-end rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        {listQuery.isLoading ? (
          <div className="py-10 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading disputes...
          </div>
        ) : listQuery.isError ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            {extractApiErrorMessage(
              listQuery.error,
            )}
          </div>
        ) : disputes.length === 0 ? (
          <div className="py-10 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No disputes found for the selected filters.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {disputes.map(
              (dispute) => (
                <DisputeCard
                  key={dispute.id}
                  dispute={dispute}
                  expanded={
                    expandedId ===
                    dispute.id
                  }
                  onToggle={() =>
                    setExpandedId(
                      (
                        current,
                      ) =>
                        current ===
                        dispute.id
                          ? null
                          : dispute.id,
                    )
                  }
                  onResolveAmicably={
                    handleResolveAmicably
                  }
                  resolving={
                    resolvingId ===
                    dispute.id
                  }
                />
              ),
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-[#C5D5EE] pt-4 dark:border-[#2D3F55]">
          <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
            {disputes.length} dispute
            {disputes.length === 1
              ? ""
              : "s"}
          </p>
        </div>
      </section>
    </div>
  );
}