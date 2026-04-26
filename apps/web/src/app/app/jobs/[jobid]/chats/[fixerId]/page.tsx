// Path: apps/web/src/app/app/jobs/[jobid]/chats/[fixerId]/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  acceptAgreement,
  lockPrice,
  proposePrice,
  respondLockedPrice,
  sendMessage,
} from "@/lib/chat/api";
import { useConversationDetail } from "@/lib/chat/queries";
import { pickAgreementStatusFromConversation } from "@/lib/chat/gates";
import { connectChatSocket } from "@/lib/chat/socket";
import type { Socket } from "socket.io-client";
import { openChatStream } from "@/lib/chat/realtime";
import { getToken } from "@/lib/auth/session";
import { decodeJwtUserId } from "@/lib/auth/jwt";
import ReportMessageModal from "@/components/chats/ReportMessageModal";

function renderAxiosError(err: unknown): string {
  const e: any = err;
  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (msg) return String(msg);
  if (e?.response?.data) return JSON.stringify(e.response.data, null, 2);
  return e?.message ?? "Unknown error";
}

function getBackendMessage(err: unknown): string | null {
  const e: any = err;
  const msg = e?.response?.data?.message;
  if (!msg) return null;
  if (Array.isArray(msg)) return msg.join(", ");
  return String(msg);
}

function fmtFecFromMilli(milli?: number | null): string {
  if (typeof milli !== "number") return "—";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

function parseMilliFromFecInput(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 1000);
}

export default function JobChatDetailPage() {
  const params = useParams<{ jobid?: string; fixerId?: string }>();
  const jobId = params?.jobid;
  const fixerId = params?.fixerId;

  const { data, isLoading, isError, error, refetch, isFetching } =
    useConversationDetail(jobId ?? "", fixerId ?? "");

  const backendMsg = useMemo(() => getBackendMessage(error), [error]);

  const isConversationMissing =
    backendMsg === "CONVERSATION_NOT_FOUND" ||
    (typeof backendMsg === "string" && backendMsg.includes("CONVERSATION_NOT_FOUND"));

  const needsAgreement = backendMsg === "CHAT_AGREEMENT_REQUIRED";

  const agreementStatus = useMemo(() => pickAgreementStatusFromConversation(data), [data]);

  const job = (data as any)?.job ?? (data as any)?.conversation?.job ?? null;
  const client = (data as any)?.client ?? (data as any)?.conversation?.client ?? null;
  const fixer = (data as any)?.fixer ?? (data as any)?.conversation?.fixer ?? null;
  const isCompleted = job?.status === "COMPLETED";
  const canChat = !!data && !isError && !isCompleted;
  const agreementLabel = canChat ? "ACCEPTED" : String(agreementStatus ?? "UNKNOWN");

  const negotiation =
    (data as any)?.negotiation ?? (data as any)?.conversation?.negotiation ?? null;

  const messages = Array.isArray((data as any)?.messages) ? (data as any).messages : [];
  const serverMessages = Array.isArray((data as any)?.messages) ? (data as any).messages : [];

  const [liveMessages, setLiveMessages] = useState<any[]>([]);

  const [myUserId, setMyUserId] = useState<string | null>(null);
  useEffect(() => {
    const token = getToken();
    if (token) {
      setMyUserId(decodeJwtUserId(token));
    }
  }, []);

  useEffect(() => {
    setLiveMessages(serverMessages);
  }, [jobId, fixerId, (data as any)?.conversation?.id, serverMessages.length]);

  const refetchTimerRef = useRef<any>(null);
  const throttledRefetch = useMemo(() => {
    return () => {
      if (refetchTimerRef.current) return;
      refetchTimerRef.current = setTimeout(async () => {
        refetchTimerRef.current = null;
        await refetch();
      }, 400);
    };
  }, [refetch]);

  useEffect(() => {
    return () => {
      if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
      refetchTimerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!jobId || !fixerId || isCompleted) return;
    if (isLoading) return;

    let socket: Socket | null = null;
    let didUnmount = false;

    try {
      socket = connectChatSocket();

      socket.on("connect", () => {
        socket?.emit("join", { jobId, fixerId });
      });

      socket.on("joined", () => {});

      socket.on("message:new", (payload: any) => {
        if (didUnmount) return;
        if (!payload) return;
        if (payload.jobId !== jobId || payload.fixerId !== fixerId) return;

        const m = payload.message;
        if (!m?.id) return;

        setLiveMessages((prev) => {
          if (prev.some((x) => x.id === m.id)) return prev;
          return [...prev, { ...m, flags: Array.isArray(m.flags) ? m.flags : [] }];
        });

        throttledRefetch();
      });

      socket.onAny((eventName: string, payload: any) => {
        if (didUnmount) return;

        const name = String(eventName || "").toLowerCase();
        if (!name || name === "ping" || name === "joined") return;

        const pJobId = payload?.jobId;
        const pFixerId = payload?.fixerId;
        if (pJobId && pJobId !== jobId) return;
        if (pFixerId && pFixerId !== fixerId) return;

        const relevant =
          name.includes("negotiation") ||
          name.includes("price") ||
          name.includes("agreement") ||
          name.includes("job") ||
          name.includes("escrow") ||
          name.includes("completion");

        if (relevant) throttledRefetch();
      });

      socket.on("disconnect", () => {});
    } catch {}

    return () => {
      didUnmount = true;
      try {
        socket?.emit("leave", { jobId, fixerId });
      } catch {}
      try {
        socket?.disconnect();
      } catch {}
    };
  }, [jobId, fixerId, isLoading, throttledRefetch]);

  const [msg, setMsg] = useState("");
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [proposeFec, setProposeFec] = useState("");
  const [lockFec, setLockFec] = useState("");
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);

  useEffect(() => {
    setActionErr(null);
  }, [jobId, fixerId]);

  useEffect(() => {
    if (!job) return;
    const base =
      typeof job.lockedPriceMilliFec === "number"
        ? job.lockedPriceMilliFec
        : typeof job.priceMilliFec === "number"
          ? job.priceMilliFec
          : null;

    if (base && !proposeFec) setProposeFec(String((base / 1000).toFixed(2)));
    if (base && !lockFec) setLockFec(String((base / 1000).toFixed(2)));
  }, [job?.id]);

  useEffect(() => {
    if (!jobId || !fixerId || isCompleted) return;
    if (!canChat) return;

    const close = openChatStream({
      jobId,
      fixerId,
      onEvent: (type) => {
        if (type === "ping") return;
        throttledRefetch();
      },
      onError: () => {},
    });

    return () => {
      close();
    };
  }, [jobId, fixerId, canChat, throttledRefetch]);

  if (!jobId || !fixerId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Invalid URL params.
          </div>
        </div>
      </div>
    );
  }

  const showAgreementBootstrap = isError && (isConversationMissing || needsAgreement);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/app/jobs/${jobId}/chats`}
            className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
          >
            ← Back to chats
          </Link>
          <div className="truncate text-xs text-[#6B7C99] dark:text-[#8FA0BC]">Fixer: {fixerId}</div>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Loading conversation…
          </div>
        )}

        {showAgreementBootstrap ? (
          <div className="space-y-2 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <p className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {isConversationMissing ? "No conversation yet" : "Agreement required"}
            </p>

            <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              {isConversationMissing
                ? "A conversation is created when someone accepts the agreement or sends the first message."
                : "You must accept the agreement before you can chat."}
            </p>

            <button
              disabled={busy}
              onClick={async () => {
                try {
                  setBusy(true);
                  setActionErr(null);
                  await acceptAgreement(jobId, fixerId, { accepted: true });
                  await refetch();
                } catch (e) {
                  setActionErr(renderAxiosError(e));
                } finally {
                  setBusy(false);
                }
              }}
              className="inline-flex items-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2.5 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50"
            >
              {busy ? "Submitting…" : "Accept agreement to chat"}
            </button>

            {actionErr && (
              <div className="rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                <p className="font-semibold">Action failed.</p>
                <pre className="mt-2 whitespace-pre-wrap">{actionErr}</pre>
              </div>
            )}
          </div>
        ) : null}

        {isError && !showAgreementBootstrap && (
          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <p className="font-semibold">Chat Closed.</p>
            <pre className="mt-2 whitespace-pre-wrap">
              {error ? renderAxiosError(error) : "Unknown error"}
            </pre>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Job summary */}
            <div className="space-y-2 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {job?.skillCategory ?? "Job"}
                  </div>
                  <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                    {(job?.city ?? "City")}, {(job?.state ?? "State")}
                    {job?.area ? ` • ${job.area}` : ""}
                    {job?.lga ? ` • ${job.lga}` : ""}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {fmtFecFromMilli(job?.lockedPriceMilliFec ?? job?.priceMilliFec)}
                  </div>
                  <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Status: {String(job?.status ?? "—")}
                  </div>
                </div>
              </div>

              {job?.status === "IN_PROGRESS" && (
                <div className="rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
                  Job is <b>IN_PROGRESS</b>. Completion flow is now available on the job page.
                </div>
              )}
            </div>

            {isCompleted && (
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                This job is completed. Chat is now read-only. No further messages or negotiation allowed.
              </div>
            )}

            {/* Agreement */}
            <div className="space-y-2 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Agreement</div>
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Status: {agreementLabel}</div>

              {canChat ? (
                <div className="text-sm text-[#2E7D32] dark:text-green-200">
                  Agreement accepted. You can chat and negotiate.
                </div>
              ) : (
                <button
                  disabled={busy}
                  onClick={async () => {
                    try {
                      setBusy(true);
                      setActionErr(null);
                      await acceptAgreement(jobId, fixerId, { accepted: true });
                      await refetch();
                    } catch (e) {
                      setActionErr(renderAxiosError(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="mt-2 inline-flex items-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2.5 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50"
                >
                  {busy ? "Submitting…" : "Accept agreement to chat"}
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Messages</div>
                <button
                  onClick={() => refetch()}
                  disabled={isFetching || busy}
                  className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline disabled:opacity-50"
                >
                  {isFetching ? "Refreshing…" : "Refresh"}
                </button>
              </div>

              {liveMessages.length === 0 ? (
                <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No messages yet.</div>
              ) : (
                <div className="space-y-3">
                  {liveMessages.map((m: any) => {
                    const isFromMe = m.senderId === myUserId;
                    const isAdminMessage = m.body.trim().startsWith("[ADMIN]");

                    return (
                      <div key={m.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl p-3 ${isFromMe ? "bg-[#5B8FCC] text-white dark:bg-[#5B8FCC]" : "bg-[#F4F8FF] text-[#1A2B4A] dark:bg-[#16202E] dark:text-[#E8F0FA]"}`}>
                          <div className="whitespace-pre-wrap text-sm">{m.body}</div>
                          <div className="mt-1 flex items-center justify-end gap-2 text-xs opacity-70">
                            <span>{m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}</span>
                            {!isAdminMessage && !isFromMe && (
                              <button
                                onClick={() => setReportMessageId(m.id)}
                                className="hover:text-[#D9534F]"
                                aria-label="Report message"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.71l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {Array.isArray(m.flags) && m.flags.length > 0 && (
                            <div className="mt-2 text-xs text-[#F5A623] dark:text-amber-300">
                              Flags: {m.flags.map((f: any) => f.type).join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  placeholder={canChat ? "Type a message…" : "Accept agreement first"}
                  disabled={!canChat || busy}
                  className="flex-1 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2.5 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 disabled:opacity-50"
                />
                <button
                  disabled={!canChat || busy || msg.trim().length === 0}
                  onClick={async () => {
                    if (isCompleted) return;
                    try {
                      setBusy(true);
                      setActionErr(null);
                      await sendMessage(jobId, fixerId, { body: msg.trim() });
                      setMsg("");
                      await refetch();
                    } catch (e) {
                      setActionErr(renderAxiosError(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2.5 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Negotiation */}
            {!isCompleted && (
              <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Status: {String(negotiation?.status ?? "—")}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] p-3">
                    <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Proposed</div>
                    <div className="text-[#6B7C99] dark:text-[#8FA0BC]">
                      {fmtFecFromMilli(negotiation?.proposedPriceMilliFec ?? null)}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] p-3">
                    <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Locked</div>
                    <div className="text-[#6B7C99] dark:text-[#8FA0BC]">
                      {fmtFecFromMilli(negotiation?.lockedPriceMilliFec ?? null)}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Propose price (FEC)
                  </label>
                  <input
                    value={proposeFec}
                    onChange={(e) => setProposeFec(e.target.value)}
                    placeholder="e.g. 50.00"
                    disabled={!canChat || busy}
                    className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2.5 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 disabled:opacity-50"
                  />
                  <button
                    disabled={!canChat || busy}
                    onClick={async () => {
                      if (negotiation?.lockedPriceMilliFec) {
                        setActionErr("Cannot propose a new price because the price has already been locked.");
                        return;
                      }
                      const raw = proposeFec.trim();
                      if (!raw) {
                        setActionErr("Please enter a price before proposing.");
                        return;
                      }
                      const milli = parseMilliFromFecInput(raw);
                      if (milli === null) {
                        setActionErr("Invalid price. Please enter a positive number.");
                        return;
                      }
                      try {
                        setBusy(true);
                        setActionErr(null);
                        await proposePrice(jobId, fixerId, { proposedPriceMilliFec: milli });
                        await refetch();
                      } catch (e) {
                        setActionErr(renderAxiosError(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2.5 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA] disabled:opacity-50"
                  >
                    Propose
                  </button>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Lock price (FEC)
                  </label>
                  <input
                    value={lockFec}
                    onChange={(e) => setLockFec(e.target.value)}
                    placeholder="e.g. 50.00"
                    disabled={!canChat || busy}
                    className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2.5 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 disabled:opacity-50"
                  />
                  <button
                    disabled={!canChat || busy}
                    onClick={async () => {
                      if (negotiation?.lockedPriceMilliFec) {
                        setActionErr("Price already locked. Cannot lock again.");
                        return;
                      }
                      const raw = lockFec.trim();
                      if (!raw) {
                        setActionErr("Please enter a price before locking.");
                        return;
                      }
                      const milli = parseMilliFromFecInput(raw);
                      if (milli === null) {
                        setActionErr("Invalid price. Please enter a positive number.");
                        return;
                      }
                      try {
                        setBusy(true);
                        setActionErr(null);
                        await lockPrice(jobId, fixerId, { lockedPriceMilliFec: milli });
                        await refetch();
                      } catch (e) {
                        setActionErr(renderAxiosError(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2.5 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA] disabled:opacity-50"
                  >
                    Lock
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={!canChat || busy}
                    onClick={async () => {
                      if (!negotiation?.lockedPriceMilliFec) {
                        setActionErr("No locked price available to accept.");
                        return;
                      }
                      try {
                        setBusy(true);
                        setActionErr(null);
                        await respondLockedPrice(jobId, fixerId, { accept: true });
                        await refetch();
                      } catch (e) {
                        setActionErr(renderAxiosError(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-white dark:bg-[#1E2A3A] px-4 py-2.5 text-sm font-medium text-[#2E7D32] dark:text-green-200 transition hover:bg-[#F0FAF0] dark:hover:bg-green-900/20 disabled:opacity-50"
                  >
                    Accept locked price
                  </button>

                  <button
                    disabled={!canChat || busy}
                    onClick={async () => {
                      if (!negotiation?.lockedPriceMilliFec) {
                        setActionErr("No locked price available to reject.");
                        return;
                      }
                      try {
                        setBusy(true);
                        setActionErr(null);
                        await respondLockedPrice(jobId, fixerId, { accept: false });
                        await refetch();
                      } catch (e) {
                        setActionErr(renderAxiosError(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-white dark:bg-[#1E2A3A] px-4 py-2.5 text-sm font-medium text-[#D9534F] dark:text-red-300 transition hover:bg-[#FFF4F3] dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    Reject locked price
                  </button>
                </div>

                {negotiation?.status === "AGREED" && (
                  <div className="rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
                    Negotiation agreed. Job should be <b>IN_PROGRESS</b> now.
                  </div>
                )}

                {negotiation?.status === "REJECTED" && (
                  <div className="rounded-xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
                    Negotiation rejected. This conversation may be closed.
                  </div>
                )}
              </div>
            )}

            {isCompleted && (
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Negotiation is closed. This job has been completed.
              </div>
            )}

            {actionErr && (
              <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <p className="font-semibold">Action failed.</p>
                <pre className="mt-2 whitespace-pre-wrap">{actionErr}</pre>
              </div>
            )}
          </>
        )}
        <ReportMessageModal
          messageId={reportMessageId || ""}
          jobId={jobId!}
          fixerId={fixerId!}
          open={!!reportMessageId}
          onClose={() => setReportMessageId(null)}
        />
      </div>
    </div>
  );
}