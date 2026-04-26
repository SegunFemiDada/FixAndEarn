// Path: apps/web/src/app/app/jobs/[jobid]/chats/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getActiveRole, getStoredRoles, type Role } from "@/lib/auth/session";
import { useJobConversations } from "@/lib/chat/queries";

function roleForUi(roles: Role[], active: Role | null): Role | null {
  if (active && roles.includes(active)) return active;
  if (roles.length === 1) return roles[0];
  return null;
}

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

export default function JobChatsPage() {
  const params = useParams<{ jobid: string }>();
  const jobId = params?.jobid ?? "";

  const roles = getStoredRoles();
  const activeRole = getActiveRole();
  const uiRole = roleForUi(roles, activeRole);

  const canFetch = !!jobId && uiRole !== "FIXER";
  const { data, isLoading, isError, error } = useJobConversations(jobId, {
    enabled: canFetch,
  });

  const conversations = Array.isArray(data) ? data : [];

  if (!jobId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Invalid job id in URL.
          </div>
        </div>
      </div>
    );
  }

  // FIXER: do not call /jobs/:jobId/chats (backend blocks it for non-owners)
  if (uiRole === "FIXER") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/app/jobs/${jobId}`}
              className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
            >
              ← Back to job
            </Link>
            <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Role: FIXER</div>
          </div>

          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Job Chats</div>
            <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Fixers can&apos;t list all conversations for a job. Use My Chats to open your own conversation.
            </div>
            <div className="mt-3">
              <Link
                href="/app/chats"
                className="inline-flex items-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2.5 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
              >
                Go to My Chats
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const onlyOwner =
    isError && renderAxiosError(error).toUpperCase().includes("ONLY_JOB_OWNER");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href={`/app/jobs/${jobId}`}
            className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
          >
            ← Back to job
          </Link>
          <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {uiRole ? `Role: ${uiRole}` : "No active role"}
          </div>
        </div>

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Job Chats</div>
          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {onlyOwner
              ? "Only the job owner can view this list."
              : "Conversations created for this job will show up here."}
          </div>
        </div>

        {isLoading && (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Loading chats…
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <p className="font-semibold">Failed to load chats.</p>
            <pre className="mt-2 whitespace-pre-wrap">{renderAxiosError(error)}</pre>
          </div>
        )}

        {!isLoading && !isError && conversations.length === 0 && (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">No chats yet</div>
            <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              This job has no conversations yet. A conversation appears after a fixer starts the chat flow.
            </div>
          </div>
        )}

        <div className="grid gap-3">
          {conversations.map((c: any) => {
            const fixerId = c.fixerId ?? c?.conversation?.fixerId ?? c?.fixerId;
            const status = c.status ?? c?.conversation?.status ?? "UNKNOWN";
            const negotiation = c.negotiation ?? c?.conversation?.negotiation ?? null;

            return (
              <div
                key={`${jobId}:${fixerId ?? "unknown"}`}
                className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      Fixer: {fixerId ?? "—"}
                    </div>
                    <div className="mt-0.5 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                      Status: {String(status)}
                    </div>
                    {negotiation?.status && (
                      <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                        Negotiation: {String(negotiation.status)}
                      </div>
                    )}
                  </div>

                  {fixerId && (
                    <Link
                      className="shrink-0 inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2.5 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
                      href={`/app/jobs/${jobId}/chats/${fixerId}`}
                    >
                      Open
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}