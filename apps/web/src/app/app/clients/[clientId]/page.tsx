// Path: apps/web/src/app/app/clients/[clientId]/page.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

type ClientProfileResponse = {
  id: string;
  fullName: string;
  isVerified: boolean;
  avatarUrl?: string | null;
  memberSince?: string | null;
  location?: {
    state?: string | null;
    city?: string | null;
  } | null;
  stats?: {
    jobsPosted: number;
    completedJobs: number;
  } | null;
};

async function getClientProfile(clientId: string): Promise<ClientProfileResponse> {
  const res = await apiClient.get(`/profiles/clients/${clientId}`);
  return res.data;
}

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

function formatMemberSince(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatLocation(location?: ClientProfileResponse["location"]) {
  const parts = [location?.city, location?.state].filter(
    (part): part is string => typeof part === "string" && part.trim().length > 0
  );

  return parts.length > 0 ? parts.join(", ") : "Not provided";
}

export default function ClientProfilePage() {
  const params = useParams<{ clientId?: string }>();
  const clientId = params?.clientId;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["profiles", "client", clientId],
    enabled: !!clientId,
    queryFn: () => getClientProfile(clientId!),
    staleTime: 10_000,
    retry: 1,
  });

  if (!clientId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Invalid client id.
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Loading client profile…
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const e = error as {
      response?: { data?: { message?: unknown } };
      message?: unknown;
    };
    const msg = e?.response?.data?.message ?? e?.message ?? "Failed to load client profile.";

    return (
      <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4">
          </div>

          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="font-semibold">Failed to load client profile</div>
            <pre className="mt-2 whitespace-pre-wrap">{String(msg)}</pre>
            <button
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#D9534F] dark:text-red-300 transition hover:bg-[#FFF4F3] dark:hover:bg-red-900/20"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <Link
            href="/app/jobs"
            className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
          >
            ← Back
          </Link>
        </div>

        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-4">
            {data?.avatarUrl ? (
              <Image
                src={data.avatarUrl}
                alt={data?.fullName ?? "Client"}
                width={72}
                height={72}
                unoptimized
                className="h-18 w-18 rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] object-cover"
              />
            ) : (
              <div className="flex h-18 w-18 items-center justify-center rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {initials(data?.fullName)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="truncate text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {data?.fullName ?? "Client"}
                </div>
                {data?.isVerified && (
                  <span className="inline-flex items-center rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 px-2.5 py-1 text-xs font-medium text-[#5B8FCC] dark:text-[#7AAEE0]">
                    Verified
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Public client profile
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Member since
              </div>
              <div className="mt-2 text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {formatMemberSince(data?.memberSince)}
              </div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Jobs posted
              </div>
              <div className="mt-2 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {data?.stats?.jobsPosted ?? 0}
              </div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Completed jobs
              </div>
              <div className="mt-2 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {data?.stats?.completedJobs ?? 0}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Location</div>
          <p className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
            {formatLocation(data?.location)}
          </p>
        </section>

        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          Contact is chat-only through the platform.
        </section>
      </div>
    </div>
  );
}
