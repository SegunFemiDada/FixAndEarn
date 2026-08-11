// Path: apps/web/src/app/app/chats/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useMyConversations } from "@/lib/chat/queries";
import { getToken, getActiveRole } from "@/lib/auth/session";

function renderAxiosError(err: unknown): string {
  if (!err || typeof err !== "object") return "Unknown error";

  const e = err as {
    message?: unknown;
    response?: { data?: { message?: unknown } };
  };

  const msg = e.response?.data?.message;

  if (Array.isArray(msg)) return msg.map(String).join(", ");
  if (msg != null) return String(msg);
  if (e.message != null) return String(e.message);

  return "Unknown error";
}

function fmtWhen(d?: string | null) {
  if (!d) return "—";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "—";
  return t.toLocaleString();
}

export default function MyChatsPage() {
  const token = getToken();
  const gateOk = !!token;
  const activeRole = getActiveRole();

  const { data, isLoading, isError, error } = useMyConversations();
  const conversations = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const qc = useQueryClient();

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl || !token) return;

    const socket = io(`${apiBaseUrl}/ws/chat`, {
      transports: ["websocket"],
      auth: { token },
    });

    socket.on("message:new", () => {
      qc.invalidateQueries({ queryKey: ["chats", "mine"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [qc, token]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">My Chats</div>
          <Link
            href="/app/dashboard"
            className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
          >
            ← Dashboard
          </Link>
        </div>

        {!gateOk ? (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              You need to be logged in to view your chats.{" "}
              <Link href="/login" className="underline text-[#5B8FCC] dark:text-[#7AAEE0]">
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading chats…</div>
              </div>
            )}

            {isError && (
              <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <p className="font-semibold text-[#D9534F] dark:text-red-300">Failed to load chats.</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-[#D9534F] dark:text-red-300">
                  {renderAxiosError(error)}
                </pre>
              </div>
            )}

            {!isLoading && !isError && conversations.length === 0 && (
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">No chats yet</div>
                <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Chats appear after a conversation exists for a job (agreement accepted or first message sent).
                </div>
              </div>
            )}

            <div className="grid gap-3">
              {conversations.map((c: unknown) => {
                const cc = c as {
  conversationId?: string | null;
  lastMessageAt?: string | null;
  status?: string | null;

  negotiation?: {
    status?: string | null;
  } | null;

  job?: {
    id?: string;
    skillCategory?: string | null;
    title?: string | null;
    status?: string | null;
    client?: {
      id?: string | null;
      fullName?: string | null;
      isActive?: boolean | null;
    } | null;
  } | null;

  fixer?: {
    id?: string | null;
    fullName?: string | null;
    isActive?: boolean | null;
  } | null;

  jobId?: string | null;
  fixerId?: string | null;

  conversation?: {
    jobId?: string | null;
    fixerId?: string | null;
  } | null;
};

                const job = cc.job ?? null;
                const fixer = cc.fixer ?? null;

                const jobId = job?.id ?? cc.jobId ?? cc.conversation?.jobId ?? null;
                const fixerId = fixer?.id ?? cc.fixerId ?? cc.conversation?.fixerId ?? null;
                const participant =
                activeRole === "FIXER"
                  ? job?.client ?? null
                  : fixer ?? null;

              const participantName =
                participant?.fullName ?? "Unknown participant";

                const jobTitle = job?.skillCategory ?? job?.title ?? "Job";
                const jobStatus = job?.status ?? "—";
                const convoStatus = cc.status ?? "—";
                const negotiationStatus = cc.negotiation?.status ?? "—";

                const openHref = jobId && fixerId ? `/app/jobs/${jobId}/chats/${fixerId}` : null;

                return (
                  <div
                    key={cc.conversationId ?? `${jobId ?? "job"}:${fixerId ?? "fixer"}`}
                    className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {jobTitle}
                        </div>
                        <div className="mt-1 truncate text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {activeRole === "FIXER" ? "Client" : "Fixer"}: {participantName}
                      </div>
                        <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                          Job status: {jobStatus} • Chat: {convoStatus}
                        </div>
                        <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                          Negotiation: {negotiationStatus}
                        </div>
                        <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                          Last message: {fmtWhen(cc.lastMessageAt)}
                        </div>
                      </div>

                      {openHref ? (
                        <Link
  href={openHref}
  className="
    shrink-0 inline-flex items-center justify-center
    rounded-lg px-4 py-2 font-semibold
    bg-blue-600 text-white
    hover:bg-blue-700 focus:ring-2 focus:ring-blue-400
    transition-colors shadow-md
    dark:bg-blue-500 dark:text-white
    dark:hover:bg-blue-600 dark:focus:ring-blue-300
  "
>
  Open
</Link>

                      ) : (
                        <div className="shrink-0 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#9BAEC8] dark:text-[#4A6080]">
                          Unavailable
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}