// Path: apps/web/src/app/app/fixers/hire-now/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDiscoverFixers } from "@/lib/users/queries";
import { useUrgentDirectHire } from "@/lib/jobs/queries";
import { getToken } from "@/lib/auth/session";
import { decodeJwtUserId } from "@/lib/auth/jwt";

function buildImageSrc(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (!base) return path;

  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

function availabilityLabel(value?: string | null) {
  if (value === "BUSY") return "Busy";
  if (value === "AVAILABLE") return "Available";
  return "Unavailable";
}

function availabilityTone(value?: string | null) {
  if (value === "AVAILABLE") return "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200";
  if (value === "BUSY") return "border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
  return "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300";
}

function ratingValue(value?: number | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0.0";
  return value.toFixed(1);
}

function extractErrorMessage(error: unknown): string {
  const e = error as {
    message?: string;
    response?: { data?: { message?: string | string[] } };
  };

  const apiMessage = e?.response?.data?.message;

  if (Array.isArray(apiMessage)) return apiMessage.join(", ");
  if (typeof apiMessage === "string" && apiMessage.trim()) return apiMessage;
  if (typeof e?.message === "string" && e.message.trim()) return e.message;

  return "Failed to start urgent hire.";
}

function getEffectiveAvailability(fixer: {
  effectiveAvailability?: string | null;
  availability?: { effective?: string | null } | null;
  fixerPreferredAvailability?: string | null;
}) {
  return (
    fixer.availability?.effective ??
    fixer.effectiveAvailability ??
    fixer.fixerPreferredAvailability ??
    "UNAVAILABLE"
  );
}

type FixerItem = {
  id: string;
  fullName: string;
  averageRating?: number | null;
  totalRatings?: number | null;
  fixerPreferredAvailability?: string | null;
  effectiveAvailability?: string | null;
  availabilityEffective?: string | null;
  fixerEffectiveAvailability?: string | null;
  availability?: {
    effective?: string | null;
  } | null;
  verification?: {
    selfieImagePath?: string | null;
    skills?: string | null;
    state?: string | null;
    city?: string | null;
    lga?: string | null;
    bio?: string | null;
  } | null;
};

export default function HireNowPage() {
  const router = useRouter();

  const [skill, setSkill] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [minRating, setMinRating] = useState("");
  const [activeFixerId, setActiveFixerId] = useState<string | null>(null);
  const [pageMessage, setPageMessage] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setCurrentUserId(decodeJwtUserId(token));
    }
  }, []);

  const urgentHire = useUrgentDirectHire();

  const params = useMemo(() => {
    const parsedMinRating =
      minRating.trim() !== "" && Number.isFinite(Number(minRating))
        ? Number(minRating)
        : undefined;

    return {
      skill: skill.trim() || undefined,
      state: state.trim() || undefined,
      city: city.trim() || undefined,
      minRating: parsedMinRating,
      take: 20,
      skip: 0,
    };
  }, [skill, state, city, minRating]);

  const { data, isLoading, isError, error } = useDiscoverFixers(params, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = (data ?? []) as FixerItem[];

  const filteredItems = useMemo(() => {
    if (!currentUserId) return items;
    return items.filter((fixer) => fixer.id !== currentUserId);
  }, [items, currentUserId]);

  const listErrorMessage = extractErrorMessage(error);

  async function handleHireNow(fixer: FixerItem) {
    if (urgentHire.isPending) return;

    const effectiveAvailability = getEffectiveAvailability(fixer);
    if (effectiveAvailability !== "AVAILABLE") {
      setPageMessage({
        type: "err",
        text: `${fixer.fullName} is currently ${availabilityLabel(
          effectiveAvailability
        ).toLowerCase()} and cannot be hired right now.`,
      });
      return;
    }

    setPageMessage(null);
    setActiveFixerId(fixer.id);

    urgentHire.mutate(
      {
        fixerId: fixer.id,
        skillCategory: fixer.verification?.skills?.trim() || "General",
        state: fixer.verification?.state?.trim() || "Unknown",
        city: fixer.verification?.city?.trim() || "Unknown",
        lga: fixer.verification?.lga?.trim() || undefined,
      },
      {
        onSuccess: (res) => {
          const jobId =
            typeof res?.jobId === "string" && res.jobId.trim()
              ? res.jobId
              : null;

          const conversationId =
            typeof res?.conversationId === "string" && res.conversationId.trim()
              ? res.conversationId
              : null;

          setPageMessage({
            type: "ok",
            text: `Urgent hire started with ${fixer.fullName}. Redirecting...`,
          });

          if (!jobId) {
            setActiveFixerId(null);
            setPageMessage({
              type: "err",
              text: "Urgent hire was created but no job ID was returned.",
            });
            return;
          }

          const query = new URLSearchParams();
          query.set("fixerId", fixer.id);
          query.set("urgent", "1");
          if (conversationId) {
            query.set("conversationId", conversationId);
            query.set("openChat", "1");
          }

          router.push(`/app/jobs/${jobId}?${query.toString()}`);
        },
        onError: (err) => {
          setActiveFixerId(null);
          setPageMessage({
            type: "err",
            text: extractErrorMessage(err),
          });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Info section */}
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
            Urgent hiring
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Hire a fixer now
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
            Browse approved professional fixers by skill, location, and rating.
            The 2 FEC urgent hire fee is charged only when you choose a fixer and
            start the direct hiring flow.
          </p>
        </section>

        {/* Filters */}
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              placeholder="Skill, e.g. plumber"
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            />
            <input
              placeholder="State, e.g. Lagos"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            />
            <input
              placeholder="City, e.g. Ikeja"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            />
            <input
              placeholder="Min rating (0-5)"
              inputMode="decimal"
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            />
          </div>
        </section>

        {/* Page message */}
        {pageMessage && (
          <section
            className={[
              "rounded-2xl border p-4 text-sm shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]",
              pageMessage.type === "ok"
                ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                : "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
            ].join(" ")}
          >
            {pageMessage.text}
          </section>
        )}

        {/* Loading / error / empty / results */}
        {isLoading ? (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Loading fixers...
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            {listErrorMessage}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            No approved fixers found for the current filters.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredItems.map((fixer) => {
              const imageSrc = buildImageSrc(
                fixer.verification?.selfieImagePath ?? null
              );
              const isBusy = urgentHire.isPending && activeFixerId === fixer.id;

              const effectiveAvailability = getEffectiveAvailability(fixer);
              const isHireable = effectiveAvailability === "AVAILABLE";

              return (
                <article
                  key={fixer.id}
                  className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                >
                  <div className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E]">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={fixer.fullName}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {fixer.fullName}
                        </h2>
                        <span className="rounded-full border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 px-2.5 py-1 text-xs font-medium text-[#2E7D32] dark:text-green-200">
                          Verified
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                        {fixer.verification?.city ?? "City"},{" "}
                        {fixer.verification?.state ?? "State"}
                      </p>

                      <div className="mt-3 grid gap-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2">
                        <div>
                          <span className="font-medium">Skills:</span>{" "}
                          {fixer.verification?.skills || "Not available"}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Rating:</span>{" "}
                          <span className="flex items-center">
                            {ratingValue(fixer.averageRating)}
                          </span>
                          <span className="text-[#F5A623]">★</span>{" "}
                          <span className="ml-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                            ({fixer.totalRatings} reviews)
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Availability:</span>{" "}
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${availabilityTone(
                              effectiveAvailability
                            )}`}
                          >
                            {availabilityLabel(effectiveAvailability)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">LGA:</span>{" "}
                          {fixer.verification?.lga || "Not available"}
                        </div>
                      </div>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                        {fixer.verification?.bio || "No bio available."}
                      </p>

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link
  href={`/app/fixers/${fixer.id}`}
  className="inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
>
  View profile
</Link>

<button
  type="button"
  onClick={() => handleHireNow(fixer)}
  disabled={urgentHire.isPending || !isHireable}
  className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors duration-200
    ${urgentHire.isPending || !isHireable
      ? "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 opacity-60"
      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300"}
  `}
>
  {isBusy
    ? "Starting..."
    : !isHireable
      ? `Currently ${availabilityLabel(getEffectiveAvailability(fixer))}`
      : "Hire now"}
</button>

                        <span className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                          Charge on start: 2 FEC
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}