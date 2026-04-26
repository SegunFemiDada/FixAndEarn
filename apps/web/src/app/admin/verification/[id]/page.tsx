// Path: apps/web/src/app/admin/verification/[id]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { useVerificationDecision, useVerificationDetail } from "@/lib/admin/verification/queries";
import type {
  VerificationDecisionAction,
  VerificationReuploadField,
} from "@/lib/admin/verification/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const REUPLOAD_FIELD_OPTIONS: Array<{ value: VerificationReuploadField; label: string }> = [
  { value: "ninImage", label: "NIN image" },
  { value: "selfie", label: "Selfie" },
  { value: "utilityBill", label: "Utility bill" },
  { value: "bvn", label: "BVN" },
  { value: "bio", label: "Bio" },
  { value: "skills", label: "Skills" },
  { value: "address", label: "Address" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
];

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatSkills(skills: string | null) {
  if (!skills?.trim()) return [];

  return skills
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildUploadUrl(path: string | null) {
  if (!path) return null;
  if (!API_BASE_URL) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path}`;
}

function ActionButton({
  label,
  action,
  disabled,
  onClick,
}: {
  label: string;
  action: VerificationDecisionAction;
  disabled: boolean;
  onClick: (action: VerificationDecisionAction) => void;
}) {
  const styles =
    action === "APPROVE"
      ? "bg-[#2E7D32] hover:bg-[#1B5E20] text-white dark:bg-green-700 dark:hover:bg-green-800"
      : action === "REQUEST_REUPLOAD"
        ? "bg-[#F5A623] hover:bg-[#D88A1A] text-white dark:bg-amber-600 dark:hover:bg-amber-700"
        : "bg-[#D9534F] hover:bg-[#C13E3A] text-white dark:bg-red-700 dark:hover:bg-red-800";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onClick(action)}
      className={[
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition",
        disabled
          ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
          : styles,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function DetailField({
  label,
  value,
  breakAll = false,
}: {
  label: string;
  value: string | null | undefined;
  breakAll?: boolean;
}) {
  return (
    <div>
      <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">{label}</span>
      <span className={["mt-1 block text-sm text-[#1A2B4A] dark:text-[#E8F0FA]", breakAll ? "break-all" : ""].join(" ")}>
        {value?.trim() ? value : "Not available"}
      </span>
    </div>
  );
}

function ImagePreview({
  label,
  path,
}: {
  label: string;
  path: string | null;
}) {
  const src = buildUploadUrl(path);

  return (
    <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{label}</h3>
        {src && (
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
          >
            Open file
          </a>
        )}
      </div>

      {src ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E]">
          <Image
            src={src}
            alt={label}
            width={1200}
            height={800}
            className="h-auto w-full object-cover"
            unoptimized
          />
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No file available.</p>
      )}
    </div>
  );
}

export default function AdminVerificationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const verificationId = typeof params?.id === "string" ? params.id : "";

  const detailQuery = useVerificationDetail(verificationId, Boolean(verificationId));
  const decisionMutation = useVerificationDecision(verificationId);

  const [reason, setReason] = React.useState("");
  const [selectedAction, setSelectedAction] = React.useState<VerificationDecisionAction | null>(null);
  const [localMessage, setLocalMessage] = React.useState<string | null>(null);
  const [reuploadFields, setReuploadFields] = React.useState<VerificationReuploadField[]>([]);

  const detail = detailQuery.data;
  const canDecide = detail?.status === "PENDING";
  const skills = formatSkills(detail?.skills ?? null);

  function toggleReuploadField(field: VerificationReuploadField) {
    setReuploadFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field]
    );
  }

  async function handleDecision(action: VerificationDecisionAction) {
    setLocalMessage(null);

    const trimmedReason = reason.trim();
    const requiresReason = action === "REJECT" || action === "REQUEST_REUPLOAD";

    if (requiresReason && !trimmedReason) {
      setSelectedAction(action);
      setLocalMessage("Reason is required for reject and request reupload actions.");
      return;
    }

    if (action === "REQUEST_REUPLOAD" && reuploadFields.length === 0) {
      setSelectedAction(action);
      setLocalMessage("Select at least one field that needs reupload.");
      return;
    }

    const confirmed = window.confirm(
      action === "APPROVE"
        ? "Approve this verification submission?"
        : action === "REJECT"
          ? "Reject this verification submission?"
          : `Request reupload for: ${reuploadFields.join(", ")}?`
    );

    if (!confirmed) return;

    setSelectedAction(action);

    decisionMutation.mutate(
      {
        action,
        reason: trimmedReason || undefined,
        reuploadFields: action === "REQUEST_REUPLOAD" ? reuploadFields : undefined,
      },
      {
        onSuccess: (response) => {
          setLocalMessage(`Decision saved successfully. Current status: ${response.status}.`);
          setReason("");
          setReuploadFields([]);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Verification detail</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Verification review</h2>
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Full verification record from the live admin detail endpoint.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/verification"
              className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
            >
              Back to queue
            </Link>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {detailQuery.isLoading ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading verification details...</p>
        </section>
      ) : detailQuery.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">Failed to load verification</h3>
          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">{extractApiErrorMessage(detailQuery.error)}</p>
        </section>
      ) : !detail ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Verification record not found.</p>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{detail.user.fullName}</h3>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium",
                    detail.status === "PENDING"
                      ? "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300"
                      : detail.status === "APPROVED"
                        ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                        : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                  ].join(" ")}
                >
                  {detail.status}
                </span>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium",
                    detail.user.isActive
                      ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                      : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                  ].join(" ")}
                >
                  {detail.user.isActive ? "User active" : "User inactive"}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Verification ID" value={detail.id} breakAll />
                <DetailField label="User ID" value={detail.user.id} breakAll />
                <DetailField label="Email" value={detail.user.email} breakAll />
                <DetailField label="Submitted" value={formatDateTime(detail.createdAt)} />
                <DetailField label="Updated" value={formatDateTime(detail.updatedAt)} />
                <DetailField label="User joined" value={formatDateTime(detail.user.createdAt)} />
                <DetailField label="Reviewed at" value={formatDateTime(detail.reviewedAt)} />
                <DetailField label="Reviewed by admin ID" value={detail.reviewedByAdminId} breakAll />
                <DetailField label="Review reason" value={detail.reviewReason} />
              </div>

              {detail.reuploadFields?.length ? (
                <div className="mt-4 rounded-xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3">
                  <div className="text-xs font-medium uppercase tracking-wide text-[#B45309] dark:text-amber-300">
                    Existing reupload fields
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detail.reuploadFields.map((field) => (
                      <span
                        key={field}
                        className="rounded-full border border-[#F5A623] dark:border-amber-700 bg-white dark:bg-[#1E2A3A] px-3 py-1 text-xs font-medium text-[#B45309] dark:text-amber-300"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Identity and profile details</h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="NIN hash" value={detail.ninHash} breakAll />
                <DetailField label="BVN hash" value={detail.bvnHash} breakAll />
                <DetailField label="Face hash" value={detail.faceHash} breakAll />
                <DetailField label="Bio" value={detail.bio} />
                <DetailField label="Instagram" value={detail.instagram} />
                <DetailField label="TikTok" value={detail.tiktok} />
              </div>

              <div className="mt-4">
                <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Skills</span>
                {skills.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={`${detail.id}-${skill}`}
                        className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-3 py-1 text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No skills provided.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Address details</h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="House number" value={detail.addressHouse} />
                <DetailField label="Street name" value={detail.addressStreet} />
                <DetailField label="Area" value={detail.addressArea} />
                <DetailField label="Nearest bus stop" value={detail.nearestBusStop} />
                <DetailField label="LGA" value={detail.lga} />
                <DetailField label="City" value={detail.city} />
                <DetailField label="State" value={detail.state} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Decision controls</h3>
              <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Approve, reject, or request targeted reupload using the live decision endpoint.
              </p>

              <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <label htmlFor="verification-reason" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Reason
                </label>
                <textarea
                  id="verification-reason"
                  rows={5}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Required for reject and request reupload."
                  disabled={!canDecide || decisionMutation.isPending}
                  className="mt-2 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                />
                <p className="mt-2 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  Reject and request reupload require a reason. Approve does not.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <div className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Reupload fields</div>
                <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                  Required only for request reupload. Select the exact fields the user must correct.
                </p>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {REUPLOAD_FIELD_OPTIONS.map((option) => {
                    const checked = reuploadFields.includes(option.value);

                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-3 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!canDecide || decisionMutation.isPending}
                          onChange={() => toggleReuploadField(option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {localMessage && (
                <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 p-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {localMessage}
                </div>
              )}

              {decisionMutation.isError && (
                <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                  {extractApiErrorMessage(decisionMutation.error)}
                </div>
              )}

              {!canDecide && (
                <div className="mt-4 rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
                  This verification is no longer pending, so no further decision can be submitted.
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ActionButton
                  label={decisionMutation.isPending && selectedAction === "APPROVE" ? "Approving..." : "Approve"}
                  action="APPROVE"
                  disabled={!canDecide || decisionMutation.isPending}
                  onClick={handleDecision}
                />
                <ActionButton
                  label={
                    decisionMutation.isPending && selectedAction === "REQUEST_REUPLOAD"
                      ? "Submitting..."
                      : "Request reupload"
                  }
                  action="REQUEST_REUPLOAD"
                  disabled={!canDecide || decisionMutation.isPending}
                  onClick={handleDecision}
                />
                <ActionButton
                  label={decisionMutation.isPending && selectedAction === "REJECT" ? "Rejecting..." : "Reject"}
                  action="REJECT"
                  disabled={!canDecide || decisionMutation.isPending}
                  onClick={handleDecision}
                />
              </div>
            </div>

            <ImagePreview label="NIN image" path={detail.ninImagePath} />
            <ImagePreview label="Selfie image" path={detail.selfieImagePath} />
            <ImagePreview label="Utility bill" path={detail.utilityBillPath} />
          </div>
        </section>
      )}
    </div>
  );
}