// Path: apps/web/src/app/app/jobs/[jobid]/applications/page.tsx
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useJobApplications } from "@/lib/jobs/applications-queries";
import { getActiveRole, getStoredRoles, getToken, type Role } from "@/lib/auth/session";
import { decodeJwtUserId } from "@/lib/auth/jwt";
import { useJobDetail } from "@/lib/jobs/queries";

function roleForUi(roles: Role[], active: Role | null): Role | null {
  if (active && roles.includes(active)) return active;
  if (roles.length === 1) return roles[0];
  return null;
}

function renderAxiosError(err: unknown): string {
  if (!err || typeof err !== "object") return "Unknown error";
  const e = err as { message?: unknown; response?: { data?: any } };
  const msg = (e.response?.data as any)?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (msg) return String(msg);
  if (e.response?.data) return JSON.stringify(e.response.data, null, 2);
  if (e.message) return String(e.message);
  return "Unknown error";
}

export default function JobApplicantsPage() {
  const params = useParams<{ jobid: string }>();
  const jobId = params?.jobid;

  const [mounted, setMounted] = useState(false);
  const [uiRole, setUiRole] = useState<Role | null>(null);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);

    const roles = getStoredRoles();
    const activeRole = getActiveRole();
    setUiRole(roleForUi(roles, activeRole));

    setMyUserId(decodeJwtUserId(getToken()));
  }, []);

  const { data: jobDetail } = useJobDetail(jobId ?? "", {
    enabled: !!jobId,
  });

  const isCompleted = jobDetail?.status === "COMPLETED";

  const canFetch = mounted && !!jobId && uiRole === "CLIENT";
  const [applicationsPage, setApplicationsPage] = useState(1);

  const APPLICATIONS_PER_PAGE = 10;

  const applicationsSkip =
  (applicationsPage - 1) * APPLICATIONS_PER_PAGE;

  const { data, isLoading, isError, error, isFetching } =
  useJobApplications(jobId ?? "", {
    skip: applicationsSkip,
    take: APPLICATIONS_PER_PAGE,
    enabled: canFetch,
  });;

  const apps = useMemo(
    () => (Array.isArray(data?.applications) ? data.applications : []),
    [data]
  );
  const applicationsTotal = data?.total ?? 0;

const applicationsTotalPages = Math.max(
  1,
  Math.ceil(
    applicationsTotal / APPLICATIONS_PER_PAGE
  )
);
useEffect(() => {
  setApplicationsPage(1);
}, [jobId]);

  if (!jobId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          Invalid job id in URL.
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  // FIXER view
  if (uiRole === "FIXER") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/app/jobs/${jobId}`}
            className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
          >
            ← Back to job
          </Link>
          <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Role: FIXER</div>
        </div>

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Applicants</div>
          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            You can&apos;t view other applicants. You can only open your own conversation for this job.
          </div>

          <div className="mt-3">
            {isCompleted ? (
              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                This job is completed. Chat is closed.
              </div>
            ) : myUserId ? (
              <Link
  href={`/app/jobs/${jobId}/chats/${myUserId}`}
  className={`inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors
    bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300`}
>
  Open my chat
</Link>

            ) : (
              <div className="rounded-xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
                Could not read your user id from JWT. Re-login.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Tip</div>
          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            You can also use{" "}
            <Link
  href="/app/chats"
  className={`underline text-blue-600 hover:text-blue-800
    dark:text-blue-400 dark:hover:text-blue-300`}
>
  My Chats
</Link>
{" "}
            to see chats across all jobs.
          </div>
        </div>
      </div>
    );
  }

  if (uiRole !== "CLIENT") {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="flex items-center justify-between gap-3">
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
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Applicants</div>
          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Switch to CLIENT or FIXER to continue.
          </div>
        </div>
      </div>
    );
  }

  // CLIENT view
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/app/jobs/${jobId}`}
          className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
        >
          ← Back to job
        </Link>
        <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Role: CLIENT</div>
      </div>

      <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Applicants</div>
        <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          View fixers who applied to this job. Contact is chat-only.
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          Loading applicants…
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold">Failed to load applicants</div>
          <pre className="mt-2 whitespace-pre-wrap">{renderAxiosError(error)}</pre>
        </div>
      )}

      {!isLoading && !isError && apps.length === 0 && (
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">No applicants yet</div>
          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            When a fixer applies, they will appear here.
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {apps.map((a: any) => {
          const fixerId = a?.fixerId;
          const fixer = a?.fixer;

          return (
            <div
              key={`${jobId}:${fixerId}`}
              className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="truncate font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {fixer?.fullName ?? `Fixer ${fixerId}`}
                  </div>
                </div>

                {isCompleted ? (
                  <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                    Chat closed
                  </div>
                ) : fixerId ? (
                  <div className="flex gap-2">
                    <Link
  href={`/app/jobs/${jobId}/chats/${fixerId}`}
  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold
    bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg focus:ring-2 focus:ring-green-400
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-300"
>
  Open chat
</Link>

<Link
  href={`/app/fixers/${fixerId}`}
  className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold
    bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-400
    transition-colors disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300"
>
  View profile
</Link>


                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {applicationsTotal > 0 && applicationsTotalPages > 1 && (
  <div className="flex items-center justify-between gap-3 border-t border-[#C5D5EE] pt-4 dark:border-[#2D3F55]">
    <button
      type="button"
      onClick={() =>
        setApplicationsPage((page) =>
          Math.max(1, page - 1)
        )
      }
      disabled={applicationsPage === 1 || isFetching}
      className="rounded-xl border border-[#C5D5EE] bg-white px-4 py-2 text-sm font-medium text-[#1A2B4A] transition hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA] dark:hover:bg-[#16202E]"
    >
      Previous
    </button>

    <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
      Page {applicationsPage} of {applicationsTotalPages}
    </div>

    <button
      type="button"
      onClick={() =>
        setApplicationsPage((page) =>
          Math.min(
            applicationsTotalPages,
            page + 1
          )
        )
      }
      disabled={
        applicationsPage === applicationsTotalPages ||
        isFetching
      }
      className="rounded-xl border border-[#C5D5EE] bg-white px-4 py-2 text-sm font-medium text-[#1A2B4A] transition hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA] dark:hover:bg-[#16202E]"
    >
      Next
    </button>
  </div>
)}
    </div>
  );
}