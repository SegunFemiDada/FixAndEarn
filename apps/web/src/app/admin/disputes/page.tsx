// Path: apps/web/src/app/admin/disputes/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useAdminDisputeChat,
  useAdminDisputesList,
  useAdminResolveDispute,
  useAdminResolveDisputeAmicably,
  useAdminSendDisputeChatMessage,
} from "@/lib/admin/disputes/queries";
import type {
  AdminDisputeChatMessage,
  AdminDisputeItem,
  DisputeResolutionType,
  DisputeStatus,
} from "@/lib/admin/disputes/types";
import { formatFecFromMilli } from "@/lib/wallet/ui";

const STATUS_OPTIONS: Array<{ label: string; value: "" | DisputeStatus }> = [
  { label: "All", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "Resolved", value: "RESOLVED" },
];

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildImageSrc(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (!base) return path;

  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

function getDisputeImagePath(evidence: unknown): string | null {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) return null;
  const maybe = (evidence as { imagePath?: unknown }).imagePath;
  return typeof maybe === "string" && maybe.trim() ? maybe : null;
}

function getDisputeNote(evidence: unknown): string | null {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) return null;
  const maybe = (evidence as { note?: unknown }).note;
  return typeof maybe === "string" && maybe.trim() ? maybe : null;
}

function formatEvidenceText(evidence: unknown) {
  if (!evidence) return "No evidence provided";
  if (typeof evidence === "string") return evidence;

  try {
    return JSON.stringify(evidence, null, 2);
  } catch {
    return "Evidence present but could not be rendered";
  }
}

function getStatusClass(status: string) {
  if (status === "OPEN") return "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
  if (status === "RESOLVED") return "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200";
  return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] text-[#6B7C99] dark:text-[#8FA0BC]";
}

function isAdminMessage(message: AdminDisputeChatMessage) {
  return message.body.trim().startsWith("[ADMIN]");
}

function ResolutionActionButton({
  label,
  resolutionType,
  dispute,
  disabled,
  onResolve,
}: {
  label: string;
  resolutionType: DisputeResolutionType;
  dispute: AdminDisputeItem;
  disabled: boolean;
  onResolve: (disputeId: string, resolutionType: DisputeResolutionType) => void;
}) {
  const styles =
    resolutionType === "RELEASE_TO_FIXER"
      ? "border border-[#B8D9B8] dark:border-green-700 bg-white dark:bg-[#1E2A3A] text-[#2E7D32] dark:text-green-200 hover:bg-[#F0FAF0] dark:hover:bg-green-900/20"
      : "border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E]";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onResolve(dispute.id, resolutionType)}
      className={[
        "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
        disabled
          ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
          : styles,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function DisputeChatPanel({ disputeId }: { disputeId: string }) {
  const [draft, setDraft] = React.useState("");
  const [localMessage, setLocalMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  const chatQuery = useAdminDisputeChat({ disputeId, take: 50 }, true);
  const sendMutation = useAdminSendDisputeChatMessage(disputeId);

  const messages = chatQuery.data?.messages ?? [];
  const conversation = chatQuery.data?.conversation ?? null;

  function handleSend() {
    const body = draft.trim();
    if (!body) return;

    setLocalMessage(null);

    sendMutation.mutate(
      { body },
      {
        onSuccess: () => {
          setDraft("");
          setLocalMessage({ type: "ok", text: "Admin message sent." });
        },
        onError: (error) => {
          setLocalMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Dispute chat</h4>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Send an admin intervention message into the job chat tied to this dispute.
          </p>
        </div>

        {conversation && (
          <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-3 py-2 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
            <div>Conversation: {conversation.id}</div>
            <div>Status: {conversation.status}</div>
          </div>
        )}
      </div>

      {localMessage && (
        <div
          className={[
            "mt-4 rounded-2xl border p-3 text-sm",
            localMessage.type === "ok"
              ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
              : "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
          ].join(" ")}
        >
          {localMessage.text}
        </div>
      )}

      {chatQuery.isLoading ? (
        <div className="mt-4 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Loading chat...
        </div>
      ) : chatQuery.isError ? (
        <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300">
          {extractApiErrorMessage(chatQuery.error)}
        </div>
      ) : !conversation ? (
        <div className="mt-4 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          No linked chat conversation was found for this dispute.
        </div>
      ) : (
        <>
          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4">
            {messages.length === 0 ? (
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No messages yet.</div>
            ) : (
              messages.map((message) => {
                const admin = isAdminMessage(message);

                return (
                  <div
                    key={message.id}
                    className={[
                      "rounded-2xl border p-3",
                      admin
                        ? "border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20"
                        : "border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E]",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                        {admin ? "Admin liaison" : `User ${message.senderId}`}
                      </div>
                      <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        {formatDateTime(message.createdAt)}
                      </div>
                    </div>

                    <div className="mt-2 whitespace-pre-wrap text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {message.body}
                    </div>

                    {Array.isArray(message.flags) && message.flags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.flags.map((flag) => (
                          <span
                            key={flag.id}
                            className="rounded-full border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 px-2 py-1 text-[11px] font-medium text-[#B45309] dark:text-amber-300"
                          >
                            {flag.type}
                            {flag.matched ? `: ${flag.matched}` : ""}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 space-y-3">
            <label htmlFor={`admin-dispute-chat-${disputeId}`} className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Send admin message
            </label>
            <textarea
              id={`admin-dispute-chat-${disputeId}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your message to the client and fixer..."
              rows={4}
              className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              disabled={sendMutation.isPending}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                Message is sent into the live job chat using the internal admin liaison account.
              </p>

              <button
                type="button"
                disabled={sendMutation.isPending || !draft.trim()}
                onClick={handleSend}
                className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendMutation.isPending ? "Sending..." : "Send admin message"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminDisputesPage() {
  const [status, setStatus] = React.useState<"" | DisputeStatus>("OPEN");
  const [jobIdInput, setJobIdInput] = React.useState("");
  const [jobId, setJobId] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [resolving, setResolving] = React.useState<{
    disputeId: string;
    resolutionType: DisputeResolutionType;
  } | null>(null);
  const [amicablyResolvingDisputeId, setAmicablyResolvingDisputeId] = React.useState<string | null>(null);

  const listQuery = useAdminDisputesList(
    {
      status: status || undefined,
      jobId: jobId || undefined,
    },
    true
  );

  const resolveMutation = useAdminResolveDispute();
  const amicableResolveMutation = useAdminResolveDisputeAmicably();
  const disputes = listQuery.data?.disputes ?? [];

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setExpandedId(null);
    setJobId(jobIdInput.trim());
  }

  function handleResolve(disputeId: string, resolutionType: DisputeResolutionType) {
    setMessage(null);

    const confirmed = window.confirm(
      resolutionType === "RELEASE_TO_FIXER"
        ? "Resolve this dispute by releasing funds to the fixer?"
        : "Resolve this dispute by refunding funds to the client?"
    );

    if (!confirmed) return;

    setResolving({ disputeId, resolutionType });

    resolveMutation.mutate(
      {
        disputeId,
        payload: { resolutionType },
      },
      {
        onSuccess: (response) => {
          setMessage({
            type: "ok",
            text: `Dispute resolved successfully. Current status: ${response.status}.`,
          });
          setResolving(null);
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
          setResolving(null);
        },
      }
    );
  }

  function handleResolveAmicably(disputeId: string) {
    setMessage(null);

    const confirmed = window.confirm(
      "Resolve this dispute amicably and reopen the completion flow so the fixer can request completion again?"
    );

    if (!confirmed) return;

    setAmicablyResolvingDisputeId(disputeId);

    amicableResolveMutation.mutate(
      { disputeId },
      {
        onSuccess: () => {
          setMessage({
            type: "ok",
            text: "Dispute resolved amicably. The fixer can now request completion again.",
          });
          setAmicablyResolvingDisputeId(null);
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
          setAmicablyResolvingDisputeId(null);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Disputes</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Dispute management</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Review disputes, inspect uploaded evidence, search by job ID, chat directly into the live dispute conversation, and resolve cases using the live admin endpoints.
        </p>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-6">
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 border-b border-[#C5D5EE] dark:border-[#2D3F55] pb-4 lg:grid lg:grid-cols-[1fr_220px_140px] lg:items-end"
        >
          <div>
            <label htmlFor="dispute-job-id" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Search by Job ID
            </label>
            <input
              id="dispute-job-id"
              type="text"
              value={jobIdInput}
              onChange={(event) => setJobIdInput(event.target.value)}
              placeholder="Enter job ID"
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            />
          </div>

          <div>
            <label htmlFor="dispute-status" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Filter by status
            </label>
            <select
              id="dispute-status"
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as "" | DisputeStatus);
                setExpandedId(null);
              }}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
          >
            Search
          </button>
        </form>

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

        {listQuery.isLoading ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading disputes...</div>
        ) : listQuery.isError ? (
          <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(listQuery.error)}
          </div>
        ) : disputes.length === 0 ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No disputes found for the current filter.</div>
        ) : (
          <div className="mt-4 grid gap-4">
            {disputes.map((dispute) => {
              const isExpanded = expandedId === dispute.id;
              const isOpen = dispute.status === "OPEN";
              const isBusy = resolveMutation.isPending && resolving?.disputeId === dispute.id;
              const isAmicableBusy =
                amicableResolveMutation.isPending && amicablyResolvingDisputeId === dispute.id;

              const evidenceImagePath = getDisputeImagePath(dispute.evidence);
              const evidenceImageUrl = buildImageSrc(evidenceImagePath);
              const evidenceNote = getDisputeNote(dispute.evidence);

              return (
                <article key={dispute.id} className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Dispute {dispute.id}</h3>
                          <span
                            className={[
                              "rounded-full px-3 py-1 text-xs font-medium",
                              getStatusClass(dispute.status),
                            ].join(" ")}
                          >
                            {dispute.status}
                          </span>
                          {dispute.resolutionType && (
                            <span className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-[#5B8FCC] dark:text-[#7AAEE0]">
                              {dispute.resolutionType}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                              Job ID
                            </span>
                            <span className="mt-1 block break-all">{dispute.jobId}</span>
                          </div>

                          <div>
                            <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                              Opened by user
                            </span>
                            <span className="mt-1 block break-all">{dispute.openedByUserId}</span>
                          </div>

                          <div>
                            <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                              Created
                            </span>
                            <span className="mt-1 block">{formatDateTime(dispute.createdAt)}</span>
                          </div>

                          <div>
                            <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                              Locked price
                            </span>
                            <span className="mt-1 block">
                              {dispute.job?.lockedPriceMilliFec != null
                                ? formatFecFromMilli(dispute.job.lockedPriceMilliFec)
                                : "Not available"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Reason
                          </span>
                          <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">{dispute.reason}</p>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : dispute.id)}
                          className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
                        >
                          {isExpanded ? "Hide details" : "Show details"}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div>
                            <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                              Job status
                            </span>
                            <span className="mt-1 block text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {dispute.job?.status ?? "Not available"}
                            </span>
                          </div>

                          <div>
                            <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                              Client ID
                            </span>
                            <span className="mt-1 block break-all text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {dispute.job?.clientId ?? "Not available"}
                            </span>
                          </div>

                          <div>
                            <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                              Fixer ID
                            </span>
                            <span className="mt-1 block break-all text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {dispute.job?.fixerId ?? "Not available"}
                            </span>
                          </div>

                          <div>
                            <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                              Resolved at
                            </span>
                            <span className="mt-1 block text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {formatDateTime(dispute.resolvedAt)}
                            </span>
                          </div>

                          <div>
                            <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                              Resolved by admin ID
                            </span>
                            <span className="mt-1 block break-all text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {dispute.resolvedByAdminId ?? "Not available"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Evidence
                          </span>

                          {evidenceImageUrl && (
                            <div className="relative h-64 w-full max-w-md overflow-hidden rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E]">
                              <Image
                                src={evidenceImageUrl}
                                alt="Dispute evidence"
                                fill
                                unoptimized
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            </div>
                          )}

                          {evidenceNote && (
                            <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {evidenceNote}
                            </div>
                          )}

                          {!evidenceImageUrl && !evidenceNote && (
                            <pre className="overflow-x-auto rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-xs whitespace-pre-wrap text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {formatEvidenceText(dispute.evidence)}
                            </pre>
                          )}
                        </div>

                        <div className="mt-4">
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Resolution actions
                          </span>

                          {!isOpen ? (
                            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                              This dispute is already resolved. No further action is available.
                            </p>
                          ) : (
                            <div className="mt-3 grid gap-3 sm:grid-cols-3">
                              <ResolutionActionButton
                                label={
                                  isBusy && resolving?.resolutionType === "RELEASE_TO_FIXER"
                                    ? "Resolving..."
                                    : "Release to fixer"
                                }
                                resolutionType="RELEASE_TO_FIXER"
                                dispute={dispute}
                                disabled={isBusy || isAmicableBusy}
                                onResolve={handleResolve}
                              />

                              <ResolutionActionButton
                                label={
                                  isBusy && resolving?.resolutionType === "REFUND_TO_CLIENT"
                                    ? "Resolving..."
                                    : "Refund to client"
                                }
                                resolutionType="REFUND_TO_CLIENT"
                                dispute={dispute}
                                disabled={isBusy || isAmicableBusy}
                                onResolve={handleResolve}
                              />

                              <button
                                type="button"
                                disabled={isBusy || isAmicableBusy}
                                onClick={() => handleResolveAmicably(dispute.id)}
                                className={[
                                  "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
                                  isBusy || isAmicableBusy
                                    ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                                    : "border border-[#F5A623] dark:border-amber-700 bg-white dark:bg-[#1E2A3A] text-[#B45309] dark:text-amber-300 hover:bg-[#FEF8E7] dark:hover:bg-amber-900/20",
                                ].join(" ")}
                              >
                                {isAmicableBusy ? "Resolving..." : "Resolve amicably"}
                              </button>
                            </div>
                          )}
                        </div>

                        <DisputeChatPanel disputeId={dispute.id} />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}