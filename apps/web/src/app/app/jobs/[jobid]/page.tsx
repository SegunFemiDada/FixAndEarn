// Path: apps/web/src/app/app/jobs/[jobid]/page.tsx
"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  useApplyToJob,
  useApproveCompletion,
  useJobById,
  useJobDispute,
  useMyApplications,
  useOpenJobDispute,
  useRejectCompletion,
  useRequestCompletion,
} from "@/lib/jobs/queries";
import {
  continuePostingPayment,
  deleteDraftJob,
} from "@/lib/job-payments/api";
import { useJobApplications } from "@/lib/jobs/applications-queries";
import { useMyVerification } from "@/lib/verification/queries";
import {
  getActiveRole,
  getStoredRoles,
  getToken,
  type Role,
} from "@/lib/auth/session";
import { decodeJwtUserId } from "@/lib/auth/jwt";
import ReportJobModal from "@/components/jobs/ReportJobModal";

function fmtFec(milli?: number | null): string {
  if (typeof milli !== "number") return "—";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

function buildImageSrc(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (!base) return path;

  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
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

function roleForUi(roles: Role[], active: Role | null): Role | null {
  if (active) return active;
  if (roles.length === 1) return roles[0];
  return null;
}

function isValidRating(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5;
}

function renderStars(rating?: number | null) {
  const safe = typeof rating === "number" && Number.isFinite(rating) ? Math.max(0, Math.min(5, Math.round(rating))) : 0;
  return (
    <span aria-label={`${safe} out of 5 stars`} className="text-[#F5A623]">
      {"★".repeat(safe)}
      <span className="text-[#C5D5EE] dark:text-[#4A6080]">{"★".repeat(5 - safe)}</span>
    </span>
  );
}

function RatingPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        return (
          <button
  key={n}
  type="button"
  onClick={() => onChange(n)}
  className="text-2xl leading-none transition hover:scale-105"
  aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
  title={`${n} star${n > 1 ? "s" : ""}`}
>
  <span className={active ? "text-amber-400" : "text-gray-300 dark:text-gray-500"}>★</span>
</button>

        );
      })}
      <span className="ml-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{value}/5</span>
    </div>
  );
}

type CompletionRequestShape = {
  id: string;
  jobId: string;
  fixerId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt?: string | null;
  reviewedByClientId?: string | null;
  reviewedAt?: string | null;
  reviewNote?: string | null;
};

type JobImage = {
  id: string;
  imagePath?: string | null;
  imageUrl?: string | null;
};

type JobReviewShape = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt?: string | null;
  clientId?: string | null;
  fixerId?: string | null;
};

type JobShape = {
  id: string;
  clientId?: string | null;
  fixerId?: string | null;
  postingType?: "STANDARD" | "URGENT" | string | null;
  skillCategory?: string | null;
  city?: string | null;
  state?: string | null;
  area?: string | null;
  lga?: string | null;
  priceMilliFec?: number | null;
  lockedPriceMilliFec?: number | null;
  status?: string | null;
  images?: JobImage[];
  completedRequestedAt?: string | null;
  completedApprovedAt?: string | null;
  completionRequest?: CompletionRequestShape | null;
  review?: JobReviewShape | null;
};

export default function JobDetailsPage() {
  const params = useParams<{ jobid: string }>();
  const searchParams = useSearchParams();
  const jobId = params?.jobid;
  const router = useRouter();

  const urgent = searchParams.get("urgent") === "1";
  const openChat = searchParams.get("openChat") === "1";
  const queryFixerId = searchParams.get("fixerId");
  const queryConversationId = searchParams.get("conversationId");

  const { data: verification, isLoading: verLoading, isError: verErr } = useMyVerification();
  const { data: rawJob, isLoading, isError, error, refetch: refetchJob } = useJobById(jobId);

  const applyMutation = useApplyToJob(jobId);
  const requestCompletion = useRequestCompletion(jobId);
  const approveCompletion = useApproveCompletion(jobId);
  const rejectCompletion = useRejectCompletion(jobId);
  const disputeQuery = useJobDispute(jobId, { enabled: !!jobId });
  const openDispute = useOpenJobDispute(jobId);
  const [showReportModal, setShowReportModal] = useState(false);

  const [disputeImage, setDisputeImage] = useState<File | null>(null);
  const [mounted, setMounted] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveRating, setApproveRating] = useState<number>(5);
  const [approveComment, setApproveComment] = useState<string>("");
  const [approveErr, setApproveErr] = useState<string | null>(null);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [rejectErr, setRejectErr] = useState<string | null>(null);

  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const [disputeReason, setDisputeReason] = useState("");
  const [disputeMsg, setDisputeMsg] = useState<string | null>(null);
  const [disputeErr, setDisputeErr] = useState<string | null>(null);

  const [urgentBannerDismissed, setUrgentBannerDismissed] = useState(false);

  const hasAutoRedirectedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const storedRoles = useMemo(() => (mounted ? getStoredRoles() : []), [mounted]);
  const storedActiveRole = useMemo(() => (mounted ? getActiveRole() : null), [mounted]);
  const activeUiRole = useMemo(() => roleForUi(storedRoles, storedActiveRole), [storedRoles, storedActiveRole]);
  const myUserId = useMemo(() => (mounted ? decodeJwtUserId(getToken()) : null), [mounted]);

  const isClient = activeUiRole === "CLIENT";
  const isFixer = activeUiRole === "FIXER";

  const myAppsQuery = useMyApplications({ skip: 0, take: 200 }, { enabled: !!myUserId && isFixer });

  useEffect(() => {
    if (!mounted || verLoading) return;
    if (verErr || !verification) router.replace("/login");
    else if (verification.status !== "APPROVED") router.replace("/app/verification");
  }, [mounted, verification, verLoading, verErr, router]);

  const job = (rawJob ?? null) as JobShape | null;

  const jobOwnerId = job?.clientId ?? null;
  const assignedFixerId = job?.fixerId ?? null;
  const effectiveFixerId = queryFixerId || assignedFixerId || null;

  const isJobOwner = !!job && !!myUserId && jobOwnerId === myUserId;
  const isAssignedFixer = !!job && !!myUserId && assignedFixerId === myUserId;
  const isClientOwnedJobViewedInFixerMode = isFixer && isJobOwner;

  const derivedPrice = useMemo(() => {
    const milli = job?.lockedPriceMilliFec ?? job?.priceMilliFec ?? null;
    return fmtFec(milli);
  }, [job]);

  const hasApplied = useMemo(() => {
    if (!isFixer) return false;
    const apps = Array.isArray(myAppsQuery.data) ? myAppsQuery.data : [];
    return apps.some((a: unknown) => {
      const aa = a as { jobId?: string; job?: { id?: string } };
      return (aa?.jobId ?? aa?.job?.id) === jobId;
    });
  }, [isFixer, myAppsQuery.data, jobId]);

  const applicationsQuery = useJobApplications(jobId, { skip: 0, take: 1, enabled: isClient && isJobOwner && !!jobId });
  const hasApplications = (applicationsQuery.data?.total ?? 0) > 0;
  const isUrgentJob = job?.postingType === "URGENT";

  const canEdit =
    isClient &&
    isJobOwner &&
    !isUrgentJob &&
    job?.status === "OPEN" &&
    !hasApplications;

  const isDraftJob =
    isClient &&
    isJobOwner &&
    job?.status === "DRAFT";

  const canApply = useMemo(() => {
    if (!isFixer) return false;
    if (!job) return false;
    if (!myUserId) return false;
    if (job.status !== "OPEN") return false;
    if (isJobOwner) return false;
    if (isAssignedFixer) return false;
    if (hasApplied) return false;
    return true;
  }, [isFixer, job, myUserId, isJobOwner, isAssignedFixer, hasApplied]);

  const canOpenMyChat = useMemo(() => {
    if (!isFixer) return false;
    if (!myUserId) return false;
    if (isJobOwner) return false;
    return hasApplied || isAssignedFixer;
  }, [isFixer, myUserId, hasApplied, isAssignedFixer, isJobOwner]);

  const canClientOpenUrgentChat = useMemo(() => {
    if (!isClient) return false;
    if (!isJobOwner) return false;
    if (!effectiveFixerId) return false;
    return true;
  }, [isClient, isJobOwner, effectiveFixerId]);

  const completionRequestedAt = job?.completedRequestedAt ? new Date(job.completedRequestedAt) : null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const completionApprovedAt = job?.completedApprovedAt ? new Date(job.completedApprovedAt) : null;

  const completionRequest = (job?.completionRequest ?? null) as CompletionRequestShape | null;
  const completionRequestStatus = completionRequest?.status ?? null;
  const completionReviewNote = completionRequest?.reviewNote ?? null;
  const completionReviewedAt = completionRequest?.reviewedAt ?? null;
  const [continuingPayment, setContinuingPayment] =
  useState(false);
  const [deletingDraft, setDeletingDraft] =
  useState(false);

  useEffect(() => {
    if (completionApprovedAt) setRatingSubmitted(true);
  }, [completionApprovedAt]);

  const canFixerRequestCompletion =
    isFixer &&
    job?.status === "IN_PROGRESS" &&
    isAssignedFixer &&
    !completionRequestedAt &&
    !isClientOwnedJobViewedInFixerMode;

  const canClientReviewCompletion =
    isClient &&
    isJobOwner &&
    job?.status === "IN_PROGRESS" &&
    !!completionRequestedAt &&
    !completionApprovedAt &&
    !ratingSubmitted;

  const existingDispute = (disputeQuery.data as { dispute?: unknown } | undefined)?.dispute ?? null;
  async function handleContinuePayment() {
  try {
    setContinuingPayment(true);

    const payment =
      await continuePostingPayment(jobId);

    if (!payment.authorizationUrl) {
  throw new Error("Payment gateway did not return an authorization URL.");
}

window.location.href = payment.authorizationUrl;
  } finally {
    setContinuingPayment(false);
  }
}
async function handleDeleteDraft() {
  const confirmed = window.confirm(
    "Delete this draft job? This cannot be undone."
  );

  if (!confirmed) return;

  try {
    setDeletingDraft(true);

    await deleteDraftJob(jobId);

    window.location.href = "/app/dashboard";
  } finally {
    setDeletingDraft(false);
  }
}

  const canFixerOpenDisputeAfterCompletionReject =
    !!job &&
    isFixer &&
    isAssignedFixer &&
    job.status === "IN_PROGRESS" &&
    completionRequestStatus === "REJECTED" &&
    !existingDispute &&
    !isClientOwnedJobViewedInFixerMode;

  const fixerCompletedReview = isAssignedFixer && job?.status === "COMPLETED" ? job?.review ?? null : null;

  useEffect(() => {
    if (!mounted) return;
    if (!jobId) return;
    if (!openChat) return;
    if (!effectiveFixerId) return;
    if (hasAutoRedirectedRef.current) return;

    const allowRedirect =
      (isClient && isJobOwner) || (isFixer && (isAssignedFixer || hasApplied));

    if (!allowRedirect) return;

    hasAutoRedirectedRef.current = true;

    const next = new URLSearchParams();
    if (urgent) next.set("urgent", "1");
    if (queryConversationId) next.set("conversationId", queryConversationId);

    const queryString = next.toString();
    router.replace(
      `/app/jobs/${jobId}/chats/${effectiveFixerId}${
        queryString ? `?${queryString}` : ""
      }`
    );
  }, [
    mounted,
    jobId,
    openChat,
    effectiveFixerId,
    isClient,
    isFixer,
    isJobOwner,
    isAssignedFixer,
    hasApplied,
    urgent,
    queryConversationId,
    router,
  ]);

  if (!jobId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          Invalid job id in URL.
        </div>
      </div>
    );
  }

  if (!mounted || verLoading || isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          Loading…
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="font-semibold">Failed to load job.</p>
          <pre className="mt-2 whitespace-pre-wrap">
            {error ? renderAxiosError(error) : "Unknown error"}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      {/* Header */}
      <div>
        <Link
          href={`/app/jobs/${jobId}`}
          className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
        >
          ← Back to job
        </Link>

        <h1 className="mt-2 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {job.skillCategory ?? "Job"}
        </h1>

        <p className="mt-1 flex items-center gap-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
  <Image
    src="/location-pin-svgrepo-com.svg"
    alt="Location"
    width={14}
    height={14}
  />

  <span>
  {job.area && `${job.area}`}
  {job.lga && ` • ${job.lga}`}
  {` ${job.city ?? "City"}, ${job.state ?? "State"}`}
</span>
</p>
</div>

      {/* Urgent banner */}
      {urgent && !urgentBannerDismissed && (
        <div className="rounded-2xl border border-[#5B8FCC] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 p-4 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="font-semibold">Urgent hire started</p>
              <p>
                The urgent hiring fee has been charged successfully. You can now
                continue directly in chat with this fixer.
              </p>

              <div className="flex flex-wrap gap-2">
                {canClientOpenUrgentChat && effectiveFixerId && (
                  <Link
  href={`/app/jobs/${job.id}/chats/${effectiveFixerId}${
    queryConversationId
      ? `?conversationId=${encodeURIComponent(queryConversationId)}`
      : ""
  }`}
  className={`inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors
    bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300`}
>
  Open urgent chat
</Link>

                )}
              </div>
            </div>

            <button
  type="button"
  onClick={() => setUrgentBannerDismissed(true)}
  className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors
    border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200`}
>
  Close
</button>

          </div>
        </div>
      )}

      {/* Role mismatch warning */}
      {isClientOwnedJobViewedInFixerMode && (
        <div className="rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-4 text-sm leading-6 text-[#B45309] dark:text-amber-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          You are viewing your own client-posted job while your active role is{" "}
          <span className="font-semibold">FIXER</span>. This page is read-only
          in fixer mode. Client actions like applicants, chats, completion
          review, and dispute handling are hidden until you switch back to{" "}
          <span className="font-semibold">CLIENT</span>.
        </div>
      )}

      {/* Images */}
      {Array.isArray(job.images) && job.images.length > 0 && (
        <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Job images</div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {job.images.map((img) => {
              const src = buildImageSrc(img?.imagePath ?? img?.imageUrl);
              if (!src) return null;

              return (
                <div
                  key={img.id}
                  className="relative aspect-square overflow-hidden rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E]"
                >
                  <Image
                    src={src}
                    alt="Job image"
                    fill
                    unoptimized
                    className="object-contain"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Price & Status */}
      <div className="space-y-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Price</p>
            <p className="mt-1 text-[#6B7C99] dark:text-[#8FA0BC]">{derivedPrice}</p>
          </div>
          <div>
            <p className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Status</p>
            <p className="mt-1 text-[#6B7C99] dark:text-[#8FA0BC]">{job.status ?? "—"}</p>
          </div>
        </div>

        <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">Job ID: {job.id}</p>
      </div>

      {/* Fixer's rating (if completed) */}
      {fixerCompletedReview && (
        <div className="space-y-2 rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm font-semibold text-[#2E7D32] dark:text-green-200">
            Your rating on this job
          </p>
          <div className="flex items-center gap-2 text-sm text-[#2E7D32] dark:text-green-200">
            <span className="font-semibold">Rating:</span>
            {renderStars(fixerCompletedReview.rating)}
            <span>{fixerCompletedReview.rating}/5</span>
          </div>
          {fixerCompletedReview.comment ? (
            <div className="text-sm text-[#2E7D32] dark:text-green-200">
              <span className="font-semibold">Review:</span>{" "}
              {fixerCompletedReview.comment}
            </div>
          ) : (
            <div className="text-sm text-[#2E7D32] dark:text-green-200">
              No written review was left for this job.
            </div>
          )}
        </div>
      )}

      {/* Quick actions (only if not in read-only fixer mode) */}
      {!isClientOwnedJobViewedInFixerMode && (
        <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Quick actions</div>

          <div className="grid gap-2">
            {isClient && isJobOwner && (
              <Link
  href={`/app/jobs/${jobId}/applications`}
  className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors
    bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300`}
>
  View applicants
</Link>

            )}
            {canEdit && (
              <Link
  href={`/app/jobs/${jobId}/edit`}
  className={`inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100`}
>
  Edit job
</Link>

            )}
            {isDraftJob && (
  <>
   {/* Standard jobs can edit their draft. Urgent jobs cannot. */}
{!isUrgentJob && (
  <Link
    href={`/app/jobs/${jobId}/edit`}
    className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold
      bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg focus:ring-2 focus:ring-blue-400
      transition-colors disabled:opacity-50 disabled:cursor-not-allowed
      dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-2 dark:focus:ring-blue-300"
  >
    Edit Draft
  </Link>
)}

    {/* Continue to Payment */}
    <button
      type="button"
      onClick={handleContinuePayment}
      disabled={continuingPayment}
      className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold
        bg-green-600 text-white shadow-md hover:bg-green-700 hover:shadow-lg focus:ring-2 focus:ring-green-400
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-300"
    >
      {continuingPayment ? "Redirecting..." : "Continue to Payment"}
    </button>

    {/* Delete Draft */}
    <button
      type="button"
      onClick={handleDeleteDraft}
      disabled={deletingDraft}
      className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold
        bg-red-600 text-white shadow-md hover:bg-red-700 hover:shadow-lg focus:ring-2 focus:ring-red-400
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-300"
    >
      {deletingDraft ? "Deleting..." : "Delete Draft"}
    </button>
  </>
)}

            {!isJobOwner && (
              <button
  onClick={() => setShowReportModal(true)}
  className={`inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors
    border-red-300 bg-white text-red-600 hover:bg-red-50
    dark:border-red-700 dark:bg-gray-800 dark:text-red-300 dark:hover:bg-red-900/20`}
>
  Report job
</button>

            )}

            {isClient && isJobOwner && effectiveFixerId && job?.status !== "COMPLETED" && job?.status !== "DRAFT" && (
              <Link
  href={`/app/jobs/${jobId}/chats/${effectiveFixerId}${
    queryConversationId
      ? `?conversationId=${encodeURIComponent(queryConversationId)}`
      : ""
  }`}
  className={`inline-flex w-full items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100`}
>
  Open direct chat with fixer
</Link>

            )}

            {isFixer && jobOwnerId && (
              <Link
                href={`/app/clients/${jobOwnerId}`}
                className="inline-flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              >
                View client profile
              </Link>
            )}

            {isFixer && (
              canOpenMyChat ? (
                <Link
  href={`/app/jobs/${jobId}/chats/${myUserId}`}
  className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors
    bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300`}
>
  Open my chat
</Link>

              ) : (
                <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Apply to this job to open a chat.
                </div>
              )
            )}

            {isFixer && myAppsQuery.isLoading && (
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Checking your application…
              </div>
            )}
          </div>
        </div>
      )}

      {/* Apply section (fixer only) */}
      {!isClientOwnedJobViewedInFixerMode && isFixer && (
        <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Apply</p>

          {hasApplied ? (
            <div className="rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
              You have applied to this job.
            </div>
          ) : !canApply ? (
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              {job.status !== "OPEN"
                ? `This job is ${String(job.status)}. Applications are only allowed when it is OPEN.`
                : isAssignedFixer
                  ? "You are the assigned fixer for this job."
                  : isJobOwner
                    ? "You cannot apply to your own job in fixer mode."
                    : "You cannot apply to this job."}
            </div>
          ) : (
          <button
            disabled={applyMutation.isPending}
            onClick={async () => {
              setActionMsg(null);
              await applyMutation.mutateAsync({ note: "Interested" });
              setActionMsg("Application submitted.");
              await myAppsQuery.refetch();
            }}
            className="
              w-full rounded-lg px-4 py-3 font-semibold
              bg-blue-600 text-white
              hover:bg-blue-700 focus:ring-2 focus:ring-blue-400
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
              dark:bg-blue-500 dark:text-white
              dark:hover:bg-blue-600 dark:focus:ring-blue-300
            "
          >
            {applyMutation.isPending ? "Submitting…" : "Apply for this job"}
          </button>

          )}

          {applyMutation.isError && (
            <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <p className="font-semibold">Application failed.</p>
              <pre className="mt-2 whitespace-pre-wrap">
                {renderAxiosError(applyMutation.error)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Job completion section */}
      {!isClientOwnedJobViewedInFixerMode && job?.status !== "COMPLETED" && (
        <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Job completion</p>

          {actionMsg && (
            <div className="rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
              {actionMsg}
            </div>
          )}

          {completionRequest && (
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              <div>
                <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Completion request status:</span>{" "}
                {completionRequestStatus ?? "—"}
              </div>
              {completionReviewedAt && (
                <div className="mt-1">
                  Reviewed at: {new Date(completionReviewedAt).toLocaleString()}
                </div>
              )}
              {completionReviewNote && (
                <div className="mt-1">
                  Review note: {completionReviewNote}
                </div>
              )}
            </div>
          )}

          {isFixer && canFixerRequestCompletion && job?.status !== "COMPLETED" && (
            <button
  disabled={requestCompletion.isPending}
  onClick={async () => {
    setActionMsg(null);
    await requestCompletion.mutateAsync({ note: "Work completed" });
    setActionMsg("Completion request submitted.");
    await refetchJob();
  }}
  className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors
    ${requestCompletion.isPending
      ? "cursor-not-allowed bg-blue-200 text-blue-400 dark:bg-blue-900 dark:text-blue-500 opacity-50"
      : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md hover:shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300"}
  `}
>
  {requestCompletion.isPending ? "Submitting…" : "Send Request for Completion"}
</button>


          )}

          {isClient && canClientReviewCompletion && job?.status !== "COMPLETED" && (
            <>
              <div className="rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
                Carefully inspect the job before approving. Once approved, the fixer is paid and the job is permanently settled.
              </div>

              <button
  disabled={approveCompletion.isPending}
  onClick={() => {
    setApproveErr(null);
    setApproveRating(5);
    setApproveComment("");
    setApproveOpen(true);
  }}
  className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold transition-colors
    border-green-300 bg-white text-green-700 hover:bg-green-50
    dark:border-green-700 dark:bg-gray-800 dark:text-green-300 dark:hover:bg-green-900/20
    disabled:cursor-not-allowed disabled:opacity-50`}
>
  {approveCompletion.isPending ? "Submitting…" : "Approve completion"}
</button>

<button
  disabled={!canClientReviewCompletion || rejectCompletion.isPending}
  onClick={() => {
    setRejectErr(null);
    setRejectReason("");
    setRejectOpen(true);
  }}
  className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold transition-colors
    border-red-300 bg-white text-red-600 hover:bg-red-50
    dark:border-red-700 dark:bg-gray-800 dark:text-red-300 dark:hover:bg-red-900/20
    disabled:cursor-not-allowed disabled:opacity-50`}
>
  {rejectCompletion.isPending ? "Submitting…" : "Reject completion"}
</button>

            </>
          )}

          {(requestCompletion.isError || approveCompletion.isError || rejectCompletion.isError) && (
            <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <p className="font-semibold">Action failed.</p>
              <pre className="mt-2 whitespace-pre-wrap">
                {requestCompletion.isError
                  ? renderAxiosError(requestCompletion.error)
                  : approveCompletion.isError
                    ? renderAxiosError(approveCompletion.error)
                    : renderAxiosError(rejectCompletion.error)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Dispute section */}
      {!isClientOwnedJobViewedInFixerMode &&
        job?.status !== "COMPLETED" &&
        (existingDispute || canFixerOpenDisputeAfterCompletionReject || disputeQuery.isLoading) && (
          <div className="space-y-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">

            {disputeMsg && (
              <div className="rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
                {disputeMsg}
              </div>
            )}

            {disputeErr && (
              <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                {disputeErr}
              </div>
            )}

            {disputeQuery.isLoading ? (
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Checking dispute status…
              </div>
            ) : existingDispute ? (
              <div className="space-y-2 rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-4 text-sm text-[#B45309] dark:text-amber-300">
                <div>
                  <span className="font-semibold">Dispute status:</span>{" "}
                  {(existingDispute as { status?: string })?.status ?? "—"}
                </div>
                <div>
                  <span className="font-semibold">Reason:</span>{" "}
                  {(existingDispute as { reason?: string })?.reason ?? "—"}
                </div>
                <div>
                  <span className="font-semibold">Opened at:</span>{" "}
                  {(existingDispute as { createdAt?: string })?.createdAt
                    ? new Date(
                        (existingDispute as { createdAt: string }).createdAt
                      ).toLocaleString()
                    : "—"}
                </div>
                {(existingDispute as { resolutionType?: string })?.resolutionType && (
                  <div>
                    <span className="font-semibold">Resolution:</span>{" "}
                    {(existingDispute as { resolutionType: string }).resolutionType}
                  </div>
                )}
              </div>
            ) : canFixerOpenDisputeAfterCompletionReject ? (
              <div className="space-y-3">
                <div className="rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
                  Your completion request was rejected. If the issue cannot be resolved, escalate to admin.
                </div>

                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Explain the dispute clearly."
                  className="min-h-30 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  rows={4}
                  disabled={openDispute.isPending}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Optional image evidence
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="block w-full text-sm text-[#6B7C99] dark:text-[#8FA0BC] file:mr-3 file:rounded-xl file:border-0 file:bg-[#EAF0FB] dark:file:bg-[#16202E] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#1A2B4A] dark:file:text-[#E8F0FA] hover:file:bg-[#D4E3F7] dark:hover:file:bg-[#1E2A3A]"
                    disabled={openDispute.isPending}
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      setDisputeImage(file);
                    }}
                  />
                </div>

                <button
  type="button"
  disabled={openDispute.isPending || !disputeReason.trim()}
  onClick={async () => {
    try {
      setDisputeMsg(null);
      setDisputeErr(null);

      await openDispute.mutateAsync({
        reason: disputeReason.trim(),
        image: disputeImage,
      });

      setDisputeMsg("Dispute opened successfully. Admin will review it.");
      setDisputeReason("");
      setDisputeImage(null);
      await refetchJob();
      await disputeQuery.refetch();
    } catch (e) {
      setDisputeErr(renderAxiosError(e));
    }
  }}
  className={`w-full rounded-lg border px-4 py-3 text-sm font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100
    disabled:cursor-not-allowed disabled:opacity-50`}
>
  {openDispute.isPending ? "Submitting…" : "Open dispute"}
</button>

              </div>
            ) : null}
          </div>
        )}

      {/* Modals */}
      {approveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => setApproveOpen(false)}
          />
          <div className="relative w-[92vw] max-w-md rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_8px_32px_rgba(91,143,204,0.16)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Approve completion
                </div>
                <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Rate the fixer. Comment is optional.
                </div>
              </div>

              <button
  onClick={() => setApproveOpen(false)}
  type="button"
  className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-sm transition-colors
    border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200`}
>
  ✕
</button>

            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Rating</label>
                <div className="mt-2">
                  <RatingPicker value={approveRating} onChange={setApproveRating} />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Optional comment
                </label>
                <textarea
                  value={approveComment}
                  onChange={(e) => setApproveComment(e.target.value)}
                  placeholder="e.g. Great work, arrived on time…"
                  className="mt-2 min-h-27.5 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  rows={3}
                />
              </div>

              {approveErr && (
                <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                  {approveErr}
                </div>
              )}

              <div className="flex gap-2">
                <button
  type="button"
  disabled={approveCompletion.isPending}
  onClick={() => setApproveOpen(false)}
  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100
    disabled:cursor-not-allowed disabled:opacity-50`}
>
  Cancel
</button>

<button
  type="button"
  disabled={approveCompletion.isPending}
  onClick={async () => {
    try {
      setApproveErr(null);

      if (!isValidRating(approveRating)) {
        setApproveErr("Rating must be an integer from 1 to 5.");
        return;
      }

      setActionMsg(null);

      await approveCompletion.mutateAsync({
        rating: approveRating,
        comment: approveComment.trim() ? approveComment.trim() : undefined,
      });

      setRatingSubmitted(true);
      setApproveOpen(false);
      setActionMsg("Completion approved.");
      await refetchJob();
    } catch (e) {
      setApproveErr(renderAxiosError(e));
    }
  }}
  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors
    bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300
    disabled:cursor-not-allowed disabled:opacity-50`}
>
  {approveCompletion.isPending ? "Submitting…" : "Approve"}
</button>

              </div>
            </div>
          </div>
        </div>
      )}

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50 dark:bg-black/70"
            onClick={() => setRejectOpen(false)}
          />
          <div className="relative w-[92vw] max-w-md rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_8px_32px_rgba(91,143,204,0.16)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Reject completion
                </div>
                <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Give a clear reason. This is required and will be shown to the fixer.
                </div>
              </div>

              <button
  type="button"
  onClick={() => setRejectOpen(false)}
  className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-sm transition-colors
    border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200`}
>
  ✕
</button>

            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why the completion is being rejected."
                  className="mt-2 min-h-30 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  rows={4}
                />
              </div>

              {rejectErr && (
                <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                  {rejectErr}
                </div>
              )}

              <div className="flex gap-2">
                <button
  type="button"
  disabled={rejectCompletion.isPending}
  onClick={() => setRejectOpen(false)}
  className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100
    disabled:cursor-not-allowed disabled:opacity-50`}
>
  Cancel
</button>

<button
  type="button"
  disabled={rejectCompletion.isPending}
  onClick={async () => {
    try {
      setRejectErr(null);

      if (!rejectReason.trim()) {
        setRejectErr("Reason is required.");
        return;
      }

      setActionMsg(null);

      await rejectCompletion.mutateAsync({
        reason: rejectReason.trim(),
      });

      setRejectOpen(false);
      setRejectReason("");
      setActionMsg("Completion rejected.");
      await refetchJob();
    } catch (e) {
      setRejectErr(renderAxiosError(e));
    }
  }}
  className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors
    bg-red-600 hover:bg-red-700 focus:ring-2 focus:ring-red-400 shadow-md
    dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-300
    disabled:cursor-not-allowed disabled:opacity-50`}
>
  {rejectCompletion.isPending ? "Submitting…" : "Submit rejection"}
</button>

              </div>
            </div>
          </div>
        </div>
      )}

      <ReportJobModal
        jobId={jobId}
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
