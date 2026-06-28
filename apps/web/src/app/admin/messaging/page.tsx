// Path: apps/web/src/app/admin/messaging/page.tsx
"use client";

import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useAdminMessagingAddUserStrike,
  useAdminMessagingConversation,
  useAdminMessagingConversations,
  useAdminMessagingIntervention,
  useAdminMessagingRestrictConversation,
  useAdminMessagingSuspendUser,
  useAdminMessagingUnsuspendUser,
  useAdminMessagingWarnConversation,
} from "@/lib/admin/messaging/queries";
import type {
  AdminMessagingConversationListItem,
  AdminMessagingConversationStatus,
  AdminMessagingMessage,
} from "@/lib/admin/messaging/types";
import { formatFecFromMilli } from "@/lib/wallet/ui";

const STATUS_OPTIONS: Array<{ label: string; value: "" | AdminMessagingConversationStatus }> = [
  { label: "All", value: "" },
  { label: "Open", value: "OPEN" },
  { label: "Closed", value: "CLOSED" },
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

function isAdminMessage(message: AdminMessagingMessage) {
  return message.body.trim().startsWith("[ADMIN]");
}

function getStatusClass(status: string) {
  if (status === "OPEN") return "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
  if (status === "CLOSED") return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] text-[#6B7C99] dark:text-[#8FA0BC]";
  return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] text-[#6B7C99] dark:text-[#8FA0BC]";
}

function ParticipantActions({
  label,
  user,
  suspendHook,
  unsuspendHook,
  strikeHook,
  onSetMessage,
}: {
  label: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    isActive: boolean;
    strikeCount: number;
  } | null;
  suspendHook: ReturnType<typeof useAdminMessagingSuspendUser>;
  unsuspendHook: ReturnType<typeof useAdminMessagingUnsuspendUser>;
  strikeHook: ReturnType<typeof useAdminMessagingAddUserStrike>;
  onSetMessage: (msg: { type: "ok" | "err"; text: string } | null) => void;
}) {
  if (!user) {
    return (
      <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        {label} not available.
      </div>
    );
  }

  const userName = user.fullName;
  const isUserActive = user.isActive;
  const userStrikeCount = user.strikeCount;

  function handleStrike() {
    const confirmed = window.confirm(`Add one moderation strike to ${userName}?`);
    if (!confirmed) return;

    onSetMessage(null);

    strikeHook.mutate(
      { reason: `${label} moderation strike from admin messaging oversight.` },
      {
        onSuccess: (response) => {
          onSetMessage({
            type: "ok",
            text: `${label} strike added successfully. Current strike count: ${response.strikeCount}.`,
          });
        },
        onError: (error) => {
          onSetMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  function handleSuspend() {
    const confirmed = window.confirm(`Suspend ${userName}?`);
    if (!confirmed) return;

    onSetMessage(null);

    suspendHook.mutate(
      { reason: `${label} suspended from admin messaging oversight.` },
      {
        onSuccess: () => {
          onSetMessage({
            type: "ok",
            text: `${label} suspended successfully.`,
          });
        },
        onError: (error) => {
          onSetMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  function handleUnsuspend() {
    const confirmed = window.confirm(`Restore ${userName}?`);
    if (!confirmed) return;

    onSetMessage(null);

    unsuspendHook.mutate(
      { reason: `${label} restored from admin messaging oversight.` },
      {
        onSuccess: () => {
          onSetMessage({
            type: "ok",
            text: `${label} restored successfully.`,
          });
        },
        onError: (error) => {
          onSetMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  const busy =
    suspendHook.isPending || unsuspendHook.isPending || strikeHook.isPending;

  return (
    <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{label}</h4>
        <span
          className={[
            "rounded-full px-3 py-1 text-xs font-medium",
            isUserActive
              ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
              : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
          ].join(" ")}
        >
          {isUserActive ? "Active" : "Suspended"}
        </span>
        <span className="rounded-full border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 px-3 py-1 text-xs font-medium text-[#B45309] dark:text-amber-300">
          {userStrikeCount} strikes
        </span>
      </div>

      <div className="mt-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
        <div className="font-medium">{user.fullName}</div>
        <div className="text-[#6B7C99] dark:text-[#8FA0BC]">{user.email}</div>
        <div className="mt-1 break-all text-xs text-[#6B7C99] dark:text-[#8FA0BC]">{user.id}</div>
      </div>

      <div className="mt-4 grid gap-2">
        <button
  type="button"
  onClick={handleStrike}
  disabled={busy}
  className="
    inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold
    bg-amber-500 text-white
    hover:bg-amber-600 focus:ring-2 focus:ring-amber-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-amber-600 dark:text-white
    dark:hover:bg-amber-700 dark:focus:ring-amber-500
  "
>
  {strikeHook.isPending ? "Adding strike..." : "Add strike"}
</button>

{isUserActive ? (
  <button
    type="button"
    onClick={handleSuspend}
    disabled={busy}
    className="
      inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold
      bg-red-600 text-white
      hover:bg-red-700 focus:ring-2 focus:ring-red-400
      transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed
      dark:bg-red-500 dark:text-white
      dark:hover:bg-red-600 dark:focus:ring-red-300
    "
  >
    {suspendHook.isPending ? "Suspending..." : "Suspend user"}
  </button>
) : (
  <button
    type="button"
    onClick={handleUnsuspend}
    disabled={busy}
    className="
      inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold
      bg-green-600 text-white
      hover:bg-green-700 focus:ring-2 focus:ring-green-400
      transition-colors
      disabled:opacity-50 disabled:cursor-not-allowed
      dark:bg-green-500 dark:text-white
      dark:hover:bg-green-600 dark:focus:ring-green-300
    "
  >
    {unsuspendHook.isPending ? "Restoring..." : "Restore user"}
  </button>
)}

      </div>
    </div>
  );
}

function ConversationDetailPanel({
  conversation,
}: {
  conversation: AdminMessagingConversationListItem;
}) {
  const [draft, setDraft] = React.useState("");
  const [localMessage, setLocalMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  const detailQuery = useAdminMessagingConversation(
    {
      conversationId: conversation.id,
      take: 100,
    },
    true
  );

  const sendMutation = useAdminMessagingIntervention(conversation.id);
  const warnMutation = useAdminMessagingWarnConversation(conversation.id);
  const restrictMutation = useAdminMessagingRestrictConversation(conversation.id);

  const clientSuspendMutation = useAdminMessagingSuspendUser(
    detailQuery.data?.participants.client?.id ?? ""
  );
  const clientUnsuspendMutation = useAdminMessagingUnsuspendUser(
    detailQuery.data?.participants.client?.id ?? ""
  );
  const clientStrikeMutation = useAdminMessagingAddUserStrike(
    detailQuery.data?.participants.client?.id ?? ""
  );

  const fixerSuspendMutation = useAdminMessagingSuspendUser(
    detailQuery.data?.participants.fixer?.id ?? ""
  );
  const fixerUnsuspendMutation = useAdminMessagingUnsuspendUser(
    detailQuery.data?.participants.fixer?.id ?? ""
  );
  const fixerStrikeMutation = useAdminMessagingAddUserStrike(
    detailQuery.data?.participants.fixer?.id ?? ""
  );

  function handleSend() {
    const body = draft.trim();
    if (!body) return;

    setLocalMessage(null);

    sendMutation.mutate(
      { body },
      {
        onSuccess: () => {
          setDraft("");
          setLocalMessage({ type: "ok", text: "Admin intervention message sent." });
        },
        onError: (error) => {
          setLocalMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  function handleWarn(target: "CLIENT" | "FIXER" | "BOTH") {
    const confirmed = window.confirm(
      target === "BOTH"
        ? "Warn both client and fixer?"
        : `Warn ${target.toLowerCase()}?`
    );
    if (!confirmed) return;

    setLocalMessage(null);

    warnMutation.mutate(
      { target, reason: "Policy warning issued from admin messaging oversight." },
      {
        onSuccess: (response) => {
          const summary = response.warnedUsers
            .map((item) => `${item.role}: ${item.strikeCount} strikes`)
            .join(" | ");

          setLocalMessage({
            type: "ok",
            text: `Warning sent successfully. ${summary}`,
          });
        },
        onError: (error) => {
          setLocalMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  function handleRestrictConversation() {
    const confirmed = window.confirm("Restrict this conversation and close it?");
    if (!confirmed) return;

    setLocalMessage(null);

    restrictMutation.mutate(
      { reason: "Conversation restricted from admin messaging oversight." },
      {
        onSuccess: () => {
          setLocalMessage({
            type: "ok",
            text: "Conversation restricted successfully.",
          });
        },
        onError: (error) => {
          setLocalMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        Loading conversation...
      </div>
    );
  }

  if (detailQuery.isError) {
    return (
      <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        {extractApiErrorMessage(detailQuery.error)}
      </div>
    );
  }

  const detail = detailQuery.data;
  if (!detail) return null;

  return (
    <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
          <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Conversation details</h4>
          <div className="mt-3 space-y-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
            <div><span className="font-medium">Conversation ID:</span> {detail.conversation.id}</div>
            <div><span className="font-medium">Job ID:</span> {detail.conversation.jobId}</div>
            <div><span className="font-medium">Status:</span> {detail.conversation.status}</div>
            <div><span className="font-medium">Created:</span> {formatDateTime(detail.conversation.createdAt)}</div>
            <div><span className="font-medium">Updated:</span> {formatDateTime(detail.conversation.updatedAt)}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
          <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Negotiation</h4>
          {!detail.negotiation ? (
            <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No negotiation record found.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
              <div><span className="font-medium">Status:</span> {detail.negotiation.status}</div>
              <div>
                <span className="font-medium">Proposed price:</span>{" "}
                {detail.negotiation.proposedPriceMilliFec != null
                  ? formatFecFromMilli(detail.negotiation.proposedPriceMilliFec)
                  : "Not available"}
              </div>
              <div>
                <span className="font-medium">Locked price:</span>{" "}
                {detail.negotiation.lockedPriceMilliFec != null
                  ? formatFecFromMilli(detail.negotiation.lockedPriceMilliFec)
                  : "Not available"}
              </div>
              <div><span className="font-medium">Locked by:</span> {detail.negotiation.lockedByUserId ?? "Not available"}</div>
              <div><span className="font-medium">Agreed at:</span> {formatDateTime(detail.negotiation.agreedAt)}</div>
              <div><span className="font-medium">Rejected at:</span> {formatDateTime(detail.negotiation.rejectedAt)}</div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
          <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Dispute linkage</h4>
          {!detail.dispute ? (
            <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">This conversation is not linked to a dispute.</p>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
              <div><span className="font-medium">Dispute ID:</span> {detail.dispute.id}</div>
              <div><span className="font-medium">Status:</span> {detail.dispute.status}</div>
              <div><span className="font-medium">Resolution:</span> {detail.dispute.resolutionType ?? "Not resolved"}</div>
              <div><span className="font-medium">Opened:</span> {formatDateTime(detail.dispute.createdAt)}</div>
              <div><span className="font-medium">Resolved:</span> {formatDateTime(detail.dispute.resolvedAt)}</div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ParticipantActions
          label="Client"
          user={detail.participants.client}
          suspendHook={clientSuspendMutation}
          unsuspendHook={clientUnsuspendMutation}
          strikeHook={clientStrikeMutation}
          onSetMessage={setLocalMessage}
        />
        <ParticipantActions
          label="Fixer"
          user={detail.participants.fixer}
          suspendHook={fixerSuspendMutation}
          unsuspendHook={fixerUnsuspendMutation}
          strikeHook={fixerStrikeMutation}
          onSetMessage={setLocalMessage}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
        <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Accepted chat agreements</h4>
        {detail.agreements.length === 0 ? (
          <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No agreement records found.</p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {detail.agreements.map((agreement) => (
              <div key={agreement.id} className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                <div><span className="font-medium">User ID:</span> {agreement.userId}</div>
                <div><span className="font-medium">Accepted:</span> {formatDateTime(agreement.acceptedAt)}</div>
                <div><span className="font-medium">IP:</span> {agreement.ip ?? "Not available"}</div>
                <div><span className="font-medium">User-Agent:</span> {agreement.userAgent ?? "Not available"}</div>
              </div>
            ))}
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

      <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
        <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Moderation actions</h4>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <button
  type="button"
  onClick={() => handleWarn("CLIENT")}
  disabled={warnMutation.isPending || restrictMutation.isPending}
  className="
    inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold
    bg-amber-500 text-white
    hover:bg-amber-600 focus:ring-2 focus:ring-amber-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-amber-600 dark:text-white
    dark:hover:bg-amber-700 dark:focus:ring-amber-500
  "
>
  Warn client
</button>

<button
  type="button"
  onClick={() => handleWarn("FIXER")}
  disabled={warnMutation.isPending || restrictMutation.isPending}
  className="
    inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold
    bg-amber-500 text-white
    hover:bg-amber-600 focus:ring-2 focus:ring-amber-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-amber-600 dark:text-white
    dark:hover:bg-amber-700 dark:focus:ring-amber-500
  "
>
  Warn fixer
</button>

<button
  type="button"
  onClick={() => handleWarn("BOTH")}
  disabled={warnMutation.isPending || restrictMutation.isPending}
  className="
    inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold
    bg-amber-500 text-white
    hover:bg-amber-600 focus:ring-2 focus:ring-amber-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-amber-600 dark:text-white
    dark:hover:bg-amber-700 dark:focus:ring-amber-500
  "
>
  Warn both
</button>

<button
  type="button"
  onClick={handleRestrictConversation}
  disabled={warnMutation.isPending || restrictMutation.isPending}
  className="
    inline-flex items-center justify-center rounded-lg px-4 py-3 font-semibold
    bg-red-600 text-white
    hover:bg-red-700 focus:ring-2 focus:ring-red-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-red-500 dark:text-white
    dark:hover:bg-red-600 dark:focus:ring-red-300
  "
>
  {restrictMutation.isPending ? "Restricting..." : "Restrict conversation"}
</button>

        </div>
      </div>

      <div className="mt-4 max-h-105 space-y-3 overflow-y-auto rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
        {detail.messages.length === 0 ? (
          <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No messages found.</div>
        ) : (
          detail.messages.map((message) => {
            const admin = isAdminMessage(message);

            return (
              <div
                key={message.id}
                className={[
                  "rounded-2xl border p-3",
                  admin
                    ? "border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20"
                    : "border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    {admin ? "Admin liaison" : `User ${message.senderId}`}
                  </div>
                  <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">{formatDateTime(message.createdAt)}</div>
                </div>

                <div className="mt-2 whitespace-pre-wrap text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">{message.body}</div>

                {message.flags.length > 0 && (
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
        <label htmlFor={`admin-messaging-${conversation.id}`} className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
          Send admin intervention message
        </label>
        <textarea
          id={`admin-messaging-${conversation.id}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type your message into the live conversation..."
          rows={4}
          className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
          disabled={sendMutation.isPending}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
            Message is injected into the live conversation with an [ADMIN] prefix.
          </p>

          <button
            type="button"
            disabled={sendMutation.isPending || !draft.trim()}
            onClick={handleSend}
            className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendMutation.isPending ? "Sending..." : "Send intervention"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminMessagingPage() {
  const [searchJobId, setSearchJobId] = React.useState("");
  const [searchUserId, setSearchUserId] = React.useState("");
  const [jobId, setJobId] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [status, setStatus] = React.useState<"" | AdminMessagingConversationStatus>("");
  const [flaggedOnly, setFlaggedOnly] = React.useState(true);
  const [disputeLinkedOnly, setDisputeLinkedOnly] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [skip, setSkip] = React.useState(0);
  const take = 20;

  const query = useAdminMessagingConversations(
    {
      jobId: jobId || undefined,
      userId: userId || undefined,
      status: status || undefined,
      flaggedOnly,
      disputeLinkedOnly,
      skip,
      take,
    },
    true
  );

  const conversations = query.data?.conversations ?? [];
  const hasPrevious = skip > 0;
  const hasNext = conversations.length === take;

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSkip(0);
    setExpandedId(null);
    setJobId(searchJobId.trim());
    setUserId(searchUserId.trim());
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Messaging oversight</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Conversation monitoring</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Review flagged conversations, search by job ID or user ID, inspect dispute-linked chats, and take real moderation actions.
        </p>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-6">
        <form onSubmit={handleSearch} className="grid gap-4 border-b border-[#C5D5EE] dark:border-[#2D3F55] pb-4 lg:grid-cols-2 xl:grid-cols-5">
          <div>
            <label htmlFor="messaging-job-id" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Search by Job ID
            </label>
            <input
              id="messaging-job-id"
              type="text"
              value={searchJobId}
              onChange={(event) => setSearchJobId(event.target.value)}
              placeholder="Enter job ID"
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            />
          </div>

          <div>
            <label htmlFor="messaging-user-id" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Search by User ID
            </label>
            <input
              id="messaging-user-id"
              type="text"
              value={searchUserId}
              onChange={(event) => setSearchUserId(event.target.value)}
              placeholder="Enter user ID"
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            />
          </div>

          <div>
            <label htmlFor="messaging-status" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              Status
            </label>
            <select
              id="messaging-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as "" | AdminMessagingConversationStatus);
                setSkip(0);
                setExpandedId(null);
              }}
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-3 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
              <input
                type="checkbox"
                checked={flaggedOnly}
                onChange={(event) => {
                  setFlaggedOnly(event.target.checked);
                  setSkip(0);
                  setExpandedId(null);
                }}
                className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
              />
              <span>Flagged only</span>
            </label>
          </div>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-3 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
              <input
                type="checkbox"
                checked={disputeLinkedOnly}
                onChange={(event) => {
                  setDisputeLinkedOnly(event.target.checked);
                  setSkip(0);
                  setExpandedId(null);
                }}
                className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
              />
              <span>Dispute-linked only</span>
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
            >
              Search
            </button>
          </div>
        </form>

        {query.isLoading ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading conversations...</div>
        ) : query.isError ? (
          <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(query.error)}
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No conversations found for the current filters.</div>
        ) : (
          <div className="mt-4 grid gap-4">
            {conversations.map((conversation) => {
              const isExpanded = expandedId === conversation.id;

              return (
                <article key={conversation.id} className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Conversation {conversation.id}</h3>

                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-medium",
                            getStatusClass(conversation.status),
                          ].join(" ")}
                        >
                          {conversation.status}
                        </span>

                        <span className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-3 py-1 text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {conversation.messageCount} messages
                        </span>

                        <span
                          className={[
                            "rounded-full px-3 py-1 text-xs font-medium",
                            conversation.flaggedMessageCount > 0
                              ? "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300"
                              : "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200",
                          ].join(" ")}
                        >
                          {conversation.flaggedMessageCount} flagged
                        </span>

                        {conversation.dispute && (
                          <span className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 px-3 py-1 text-xs font-medium text-[#5B8FCC] dark:text-[#7AAEE0]">
                            Dispute linked
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Job ID
                          </span>
                          <span className="mt-1 block break-all">{conversation.jobId}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Client ID
                          </span>
                          <span className="mt-1 block break-all">{conversation.job?.clientId ?? "Not available"}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Fixer ID
                          </span>
                          <span className="mt-1 block break-all">{conversation.job?.fixerId ?? "Not available"}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Locked price
                          </span>
                          <span className="mt-1 block">
                            {conversation.job?.lockedPriceMilliFec != null
                              ? formatFecFromMilli(conversation.job.lockedPriceMilliFec)
                              : "Not available"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                            Last message
                          </div>
                          <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                            {formatDateTime(conversation.lastMessage?.createdAt)}
                          </div>
                        </div>
                        <div className="mt-2 text-sm whitespace-pre-wrap text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {conversation.lastMessage?.body ?? "No messages yet."}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0">
                      <button
  type="button"
  onClick={() => setExpandedId(isExpanded ? null : conversation.id)}
  className="
    inline-flex items-center justify-center
    rounded-lg px-4 py-2 font-semibold
    bg-gray-200 text-gray-700
    hover:bg-gray-300 focus:ring-2 focus:ring-gray-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-gray-700 dark:text-gray-200
    dark:hover:bg-gray-600 dark:focus:ring-gray-500
  "
>
  {isExpanded ? "Hide details" : "Open conversation"}
</button>

                    </div>
                  </div>

                  {isExpanded && <ConversationDetailPanel conversation={conversation} />}
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSkip((current) => Math.max(0, current - take))}
            disabled={!hasPrevious || query.isLoading}
            className={[
              "rounded-xl border px-4 py-3 text-sm font-medium transition",
              hasPrevious && !query.isLoading
                ? "border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
                : "cursor-not-allowed border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080]",
            ].join(" ")}
          >
            Previous
          </button>

          <button
            type="button"
            onClick={() => setSkip((current) => current + take)}
            disabled={!hasNext || query.isLoading}
            className={[
              "rounded-xl border px-4 py-3 text-sm font-medium transition",
              hasNext && !query.isLoading
                ? "border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
                : "cursor-not-allowed border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080]",
            ].join(" ")}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}