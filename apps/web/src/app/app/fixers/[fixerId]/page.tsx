// Path: apps/web/src/app/app/fixers/[fixerId]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

type FixerProfileResponse = {
  id: string;
  fullName: string;
  isVerified?: boolean;
  avatarUrl?: string | null;
  availability: {
    preferred: string;
    effective: string;
    updatedAt?: string | null;
  };
  rating: {
    average: number;
    count: number;
  };
  socials?: {
    instagram?: { handle: string; url: string } | null;
    tiktok?: { handle: string; url: string } | null;
  } | null;
  stats?: {
    completedJobs: number;
  } | null;
  profile?: {
    bio?: string | null;
    skills?: string | null;
  } | null;
};

type FixerReviewsResponse = {
  fixerId: string;
  averageRating: number;
  totalRatings: number;
  reviews: Array<{
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    client?: {
      displayName?: string | null;
    } | null;
  }>;
};

async function getFixerProfile(fixerId: string): Promise<FixerProfileResponse> {
  const res = await apiClient.get(`/profiles/fixers/${fixerId}`);
  return res.data;
}

async function getFixerReviews(fixerId: string): Promise<FixerReviewsResponse> {
  const res = await apiClient.get(`/profiles/fixers/${fixerId}/reviews`);
  return res.data;
}

function formatIsoDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toISOString().replace("T", " ").replace("Z", " UTC").slice(0, 23);
}

function availabilityTone(status?: string) {
  switch (status) {
    case "AVAILABLE":
      return "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200";
    case "BUSY":
      return "border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
    case "UNAVAILABLE":
      return "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300";
    default:
      return "border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] text-[#6B7C99] dark:text-[#8FA0BC]";
  }
}

function firstSkill(value?: string | null): string | null {
  if (!value || typeof value !== "string") return null;
  const first = value
    .split(",")
    .map((s) => s.trim())
    .find(Boolean);
  return first || null;
}

function parseSkills(value?: string | null): string[] {
  if (!value || typeof value !== "string") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function initials(name?: string) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
}

function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className="text-[#F5A623]">★</span>
      ))}
      {halfStar && <span className="text-[#F5A623]">½</span>}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className="text-[#C5D5EE] dark:text-[#4A6080]">★</span>
      ))}
    </div>
  );
}

export default function FixerProfilePage() {
  const params = useParams<{ fixerId?: string }>();
  const fixerId = params?.fixerId;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["profiles", "fixer", fixerId],
    enabled: !!fixerId,
    queryFn: () => getFixerProfile(fixerId!),
    staleTime: 10_000,
    retry: 1,
  });

  const reviewsQuery = useQuery({
    queryKey: ["profiles", "fixer", fixerId, "reviews"],
    enabled: !!fixerId,
    queryFn: () => getFixerReviews(fixerId!),
    staleTime: 10_000,
    retry: 1,
  });

  if (!fixerId) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Invalid fixer id.
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
            Loading fixer profile…
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const e: any = error;
    const msg = e?.response?.data?.message ?? e?.message ?? "Failed to load fixer profile.";

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

          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="font-semibold">Failed to load fixer profile</div>
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

  const avg = Number(data?.rating?.average ?? 0);
  const count = Number(data?.rating?.count ?? 0);
  const completedJobs = Number(data?.stats?.completedJobs ?? 0);

  const effective = data?.availability?.effective ?? "—";
  const preferred = data?.availability?.preferred ?? "—";
  const updatedAt = data?.availability?.updatedAt ?? null;

  const instagram = data?.socials?.instagram ?? null;
  const tiktok = data?.socials?.tiktok ?? null;
  const primarySkill = firstSkill(data?.profile?.skills);
  const skills = parseSkills(data?.profile?.skills);

  const reviews = Array.isArray(reviewsQuery.data?.reviews) ? reviewsQuery.data!.reviews : [];

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

        {/* Main profile card */}
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-start gap-4">
            {data?.avatarUrl ? (
              <Image
                src={data.avatarUrl}
                alt={data?.fullName ?? "Fixer"}
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

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {data?.fullName ?? "Fixer"}
                  {primarySkill ? ` (${primarySkill})` : ""}
                </div>

                {data?.isVerified && (
                  <span className="inline-flex items-center rounded-full border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 px-2.5 py-1 text-xs font-medium text-[#2E7D32] dark:text-green-200">
                    Verified
                  </span>
                )}
              </div>

              {data?.profile?.bio && (
                <div className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  {data.profile.bio}
                </div>
              )}

              <div className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Public fixer profile
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Rating
              </div>
              <div className="mt-2 flex items-center gap-2">
                {renderStars(avg)}
                <span className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {avg.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                {count} review{count === 1 ? "" : "s"}
              </div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Completed jobs
              </div>
              <div className="mt-2 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {completedJobs}
              </div>
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Finished successfully</div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Availability
              </div>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${availabilityTone(
                    effective
                  )}`}
                >
                  {effective}
                </span>
              </div>
              <div className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Preferred: {preferred}
              </div>
              {updatedAt && (
                <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  Updated: {formatIsoDate(updatedAt)}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Skills */}
        {skills.length > 0 && (
          <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Skills</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-3 py-1.5 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Recent reviews</div>

          {reviewsQuery.isLoading ? (
            <div className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading reviews…</div>
          ) : reviewsQuery.isError ? (
            <div className="mt-3 text-sm text-[#D9534F] dark:text-red-300">Failed to load reviews.</div>
          ) : reviews.length === 0 ? (
            <div className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No reviews yet.</div>
          ) : (
            <div className="mt-4 space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {renderStars(r.rating)}
                      <span className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {r.rating}/5
                      </span>
                    </div>
                    <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      {formatIsoDate(r.createdAt)}
                    </div>
                  </div>

                  {r.comment ? (
                    <div className="mt-2 text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {r.comment}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                      No written review.
                    </div>
                  )}

                  {r.client?.displayName && (
                    <div className="mt-2 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      {r.client.displayName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Socials */}
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Socials</div>

          <div className="mt-4 flex flex-col gap-2">
            {instagram ? (
              <a
                href={instagram.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] underline transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E]"
              >
                Instagram: @{instagram.handle}
              </a>
            ) : (
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Instagram not provided.</div>
            )}

            {tiktok ? (
              <a
                href={tiktok.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] underline transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E]"
              >
                TikTok: @{tiktok.handle}
              </a>
            ) : (
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">TikTok not provided.</div>
            )}
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Contact</div>
          <div className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
            Contact is chat-only. Open a job and start from the applicants list or your existing
            conversation.
          </div>
        </section>
      </div>
    </div>
  );
}