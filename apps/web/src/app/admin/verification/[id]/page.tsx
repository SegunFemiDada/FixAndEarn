// Path: apps/web/src/app/admin/verification/[id]/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useNinVerificationDecision,
  useVerificationDecision,
  useVerificationDetail,
} from "@/lib/admin/verification/queries";
import type {
  VerificationDecisionAction,
  VerificationReuploadField,
} from "@/lib/admin/verification/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const PANEL_CLASS =
  "rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]";

const SUBPANEL_CLASS =
  "rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080] dark:focus:border-[#5B8FCC]";

const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100";

const REUPLOAD_FIELD_OPTIONS: Array<{
  value: VerificationReuploadField;
  label: string;
}> = [
  { value: "ninImage", label: "NIN image" },
  { value: "selfie", label: "Selfie" },
  { value: "utilityBill", label: "Utility bill" },
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

function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const styles = {
    neutral:
      "border-[#C5D5EE] bg-[#F4F8FF] text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]",
    success:
      "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200",
    warning:
      "border-[#F5A623] bg-[#FEF8E7] text-[#B45309] dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
    danger:
      "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function getVerificationTone(
  status: string,
): "neutral" | "success" | "warning" | "danger" {
  if (status === "APPROVED" || status === "VERIFIED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED" || status === "FAILED") return "danger";
  return "neutral";
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
      className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
        disabled
          ? "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-400 opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
          : styles
      }`}
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
    <div className="min-w-0">
      <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
        {label}
      </span>
      <span
        className={[
          "mt-1 block text-sm text-[#1A2B4A] dark:text-[#E8F0FA]",
          breakAll ? "break-all" : "",
        ].join(" ")}
      >
        {value?.trim() ? value : "Not available"}
      </span>
    </div>
  );
}

function Section({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${PANEL_CLASS} ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {title}
        </h3>

        {description ? (
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-5">{children}</div>
    </section>
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
    <div className={SUBPANEL_CLASS}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {label}
        </h3>

        {src ? (
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[#5B8FCC] hover:underline dark:text-[#7AAEE0]"
          >
            Open file
          </a>
        ) : null}
      </div>

      {src ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-[#C5D5EE] bg-white dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <Image
            src={src}
            alt={label}
            width={1200}
            height={800}
            className="h-auto max-h-130 w-full object-contain"
            unoptimized
          />
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          No file available.
        </p>
      )}
    </div>
  );
}

export default function AdminVerificationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const verificationId = typeof params?.id === "string" ? params.id : "";

  const detailQuery = useVerificationDetail(
    verificationId,
    Boolean(verificationId),
  );

  const decisionMutation = useVerificationDecision(verificationId);
  const ninDecisionMutation = useNinVerificationDecision(verificationId);

  const [reason, setReason] = React.useState("");
  const [selectedAction, setSelectedAction] =
    React.useState<VerificationDecisionAction | null>(null);
  const [localMessage, setLocalMessage] = React.useState<string | null>(null);
  const [reuploadFields, setReuploadFields] = React.useState<
    VerificationReuploadField[]
  >([]);

  const [ninNote, setNinNote] = React.useState("");
  const [selectedNinAction, setSelectedNinAction] = React.useState<
    "VERIFY" | "FAIL" | null
  >(null);

  const [ninLocalMessage, setNinLocalMessage] = React.useState<string | null>(
    null,
  );

  const detail = detailQuery.data;
  const canDecide = detail?.status === "PENDING";
  const skills = formatSkills(detail?.skills ?? null);

  function toggleReuploadField(field: VerificationReuploadField) {
    setReuploadFields((current) =>
      current.includes(field)
        ? current.filter((item) => item !== field)
        : [...current, field],
    );
  }

  function handleNinDecision(action: "VERIFY" | "FAIL") {
    setNinLocalMessage(null);

    const trimmedNote = ninNote.trim();

    if (!trimmedNote) {
      setSelectedNinAction(action);
      setNinLocalMessage("A note is required before making an NIN decision.");
      return;
    }

    const confirmed = window.confirm(
      action === "VERIFY"
        ? "Mark this NIN as verified?"
        : "Mark this NIN verification as failed?",
    );

    if (!confirmed) return;

    setSelectedNinAction(action);

    ninDecisionMutation.mutate(
      {
        action,
        note: trimmedNote,
      },
      {
        onSuccess: (response) => {
          setNinLocalMessage(
            `NIN decision saved successfully. Current status: ${response.status}.`,
          );
          setNinNote("");
        },
      },
    );
  }

  function handleDecision(action: VerificationDecisionAction) {
    setLocalMessage(null);

    const trimmedReason = reason.trim();
    const requiresReason =
      action === "REJECT" || action === "REQUEST_REUPLOAD";

    if (requiresReason && !trimmedReason) {
      setSelectedAction(action);
      setLocalMessage(
        "Reason is required for reject and request reupload actions.",
      );
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
          : `Request reupload for: ${reuploadFields.join(", ")}?`,
    );

    if (!confirmed) return;

    setSelectedAction(action);

    decisionMutation.mutate(
      {
        action,
        reason: trimmedReason || undefined,
        reuploadFields:
          action === "REQUEST_REUPLOAD" ? reuploadFields : undefined,
      },
      {
        onSuccess: (response) => {
          setLocalMessage(
            `Decision saved successfully. Current status: ${response.status}.`,
          );
          setReason("");
          setReuploadFields([]);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                Verification
              </p>

              {detail ? (
                <StatusBadge tone={getVerificationTone(detail.status)}>
                  {detail.status}
                </StatusBadge>
              ) : null}
            </div>

            <h2 className="mt-2 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Verification review
            </h2>

            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Investigate the applicant record, identity evidence and review
              decisions from one desktop workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href="/admin/verification" className={SECONDARY_BUTTON_CLASS}>
              Back to queue
            </Link>

            <button
              type="button"
              onClick={() => router.refresh()}
              className={SECONDARY_BUTTON_CLASS}
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {detailQuery.isLoading ? (
        <section className={PANEL_CLASS}>
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading verification details...
          </p>
        </section>
      ) : detailQuery.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] bg-[#FFF4F3] p-6 dark:border-red-700 dark:bg-red-900/20">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">
            Failed to load verification
          </h3>

          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(detailQuery.error)}
          </p>
        </section>
      ) : !detail ? (
        <section className={PANEL_CLASS}>
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Verification record not found.
          </p>
        </section>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.85fr)]">
            <div className="min-w-0 space-y-6">
              <Section
                title="Applicant"
                description="Core account and verification record information."
              >
                <div className="flex flex-col gap-4 border-b border-[#DCE6F4] pb-5 dark:border-[#2D3F55] lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {detail.user.fullName}
                      </h3>

                      <StatusBadge tone={getVerificationTone(detail.status)}>
                        {detail.status}
                      </StatusBadge>

                      <StatusBadge
                        tone={detail.user.isActive ? "success" : "danger"}
                      >
                        {detail.user.isActive
                          ? "User active"
                          : "User inactive"}
                      </StatusBadge>
                    </div>

                    <p className="mt-2 break-all text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                      {detail.user.email}
                    </p>
                  </div>

                  <div className="shrink-0">
                    <StatusBadge
                      tone={getVerificationTone(
                        detail.ninVerificationStatus,
                      )}
                    >
                      NIN {detail.ninVerificationStatus}
                    </StatusBadge>
                  </div>
                </div>

                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField
                    label="Verification ID"
                    value={detail.id}
                    breakAll
                  />

                  <DetailField
                    label="User ID"
                    value={detail.user.id}
                    breakAll
                  />

                  <DetailField
                    label="Email"
                    value={detail.user.email}
                    breakAll
                  />

                  <DetailField
                    label="Submitted"
                    value={formatDateTime(detail.createdAt)}
                  />

                  <DetailField
                    label="Updated"
                    value={formatDateTime(detail.updatedAt)}
                  />

                  <DetailField
                    label="User joined"
                    value={formatDateTime(detail.user.createdAt)}
                  />

                  <DetailField
                    label="Reviewed at"
                    value={formatDateTime(detail.reviewedAt)}
                  />

                  <DetailField
                    label="Reviewed by admin ID"
                    value={detail.reviewedByAdminId}
                    breakAll
                  />

                  <DetailField
                    label="Review reason"
                    value={detail.reviewReason}
                  />
                </div>

                {detail.reuploadFields?.length ? (
                  <div className="mt-5 rounded-xl border border-[#F5A623] bg-[#FEF8E7] p-4 dark:border-amber-700 dark:bg-amber-900/20">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#B45309] dark:text-amber-300">
                      Existing reupload fields
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {detail.reuploadFields.map((field) => (
                        <span
                          key={field}
                          className="rounded-full border border-[#F5A623] bg-white px-3 py-1 text-xs font-medium text-[#B45309] dark:border-amber-700 dark:bg-[#1E2A3A] dark:text-amber-300"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Section>

              <Section
                title="Identity and profile"
                description="Identity hashes and applicant-provided profile information."
              >
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField
                    label="NIN hash"
                    value={detail.ninHash}
                    breakAll
                  />

                  <DetailField
                    label="Face hash"
                    value={detail.faceHash}
                    breakAll
                  />

                  <DetailField label="Bio" value={detail.bio} />

                  <DetailField
                    label="Instagram"
                    value={detail.instagram}
                  />

                  <DetailField label="TikTok" value={detail.tiktok} />
                </div>

                <div className="mt-5">
                  <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Skills
                  </span>

                  {skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {skills.map((skill) => (
                        <span
                          key={`${detail.id}-${skill}`}
                          className="rounded-full border border-[#C5D5EE] bg-[#F4F8FF] px-3 py-1 text-xs font-medium text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                      No skills provided.
                    </p>
                  )}
                </div>
              </Section>

              <Section
                title="Address"
                description="Applicant-provided location information."
              >
                <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField
                    label="House number"
                    value={detail.addressHouse}
                  />

                  <DetailField
                    label="Street name"
                    value={detail.addressStreet}
                  />

                  <DetailField label="Area" value={detail.addressArea} />

                  <DetailField
                    label="Nearest bus stop"
                    value={detail.nearestBusStop}
                  />

                  <DetailField label="LGA" value={detail.lga} />

                  <DetailField label="City" value={detail.city} />

                  <DetailField label="State" value={detail.state} />
                </div>
              </Section>

              <Section
                title="Submitted evidence"
                description="Verification files attached to this submission."
              >
                <div className="grid gap-4 xl:grid-cols-3">
                  <ImagePreview
                    label="NIN image"
                    path={detail.ninImagePath}
                  />

                  <ImagePreview
                    label="Selfie image"
                    path={detail.selfieImagePath}
                  />

                  <ImagePreview
                    label="Utility bill"
                    path={detail.utilityBillPath}
                  />
                </div>
              </Section>
            </div>

            <aside className="min-w-0 space-y-6 xl:sticky xl:top-6 xl:self-start">
              <Section
                title="NIN verification"
                description="Record the outcome of the official NIN verification process."
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusBadge
                    tone={getVerificationTone(
                      detail.ninVerificationStatus,
                    )}
                  >
                    {detail.ninVerificationStatus}
                  </StatusBadge>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                  <DetailField
                    label="NIN decision date"
                    value={formatDateTime(detail.ninVerifiedAt)}
                  />

                  <DetailField
                    label="Reviewed by admin ID"
                    value={detail.ninVerifiedByAdminId}
                    breakAll
                  />
                </div>

                {detail.ninVerificationNote ? (
                  <div className={`mt-5 ${SUBPANEL_CLASS}`}>
                    <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Previous NIN verification note
                    </span>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {detail.ninVerificationNote}
                    </p>
                  </div>
                ) : null}

                {canDecide ? (
                  <>
                    <div className="mt-5">
                      <label
                        htmlFor="nin-verification-note"
                        className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                      >
                        Officer note
                      </label>

                      <textarea
                        id="nin-verification-note"
                        rows={5}
                        maxLength={500}
                        value={ninNote}
                        onChange={(event) => setNinNote(event.target.value)}
                        placeholder="Record the outcome of your official NIN verification."
                        disabled={ninDecisionMutation.isPending}
                        className={INPUT_CLASS}
                      />

                      <p className="mt-2 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        Required for both Verify and Fail decisions.
                      </p>
                    </div>

                    {ninLocalMessage ? (
                      <div className="mt-4 rounded-xl border border-[#C5D5EE] bg-[#EAF0FB] p-3 text-sm text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-blue-900/20 dark:text-[#E8F0FA]">
                        {ninLocalMessage}
                      </div>
                    ) : null}

                    {ninDecisionMutation.isError ? (
                      <div className="mt-4 rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] p-3 text-sm text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
                        {extractApiErrorMessage(ninDecisionMutation.error)}
                      </div>
                    ) : null}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <button
                        type="button"
                        disabled={ninDecisionMutation.isPending}
                        onClick={() => handleNinDecision("VERIFY")}
                        className="inline-flex items-center justify-center rounded-lg bg-[#2E7D32] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1B5E20] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
                      >
                        {ninDecisionMutation.isPending &&
                        selectedNinAction === "VERIFY"
                          ? "Verifying..."
                          : "Verify NIN"}
                      </button>

                      <button
                        type="button"
                        disabled={ninDecisionMutation.isPending}
                        onClick={() => handleNinDecision("FAIL")}
                        className="inline-flex items-center justify-center rounded-lg bg-[#D9534F] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C13E3A] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
                      >
                        {ninDecisionMutation.isPending &&
                        selectedNinAction === "FAIL"
                          ? "Failing..."
                          : "Fail NIN"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-5 rounded-xl border border-[#F5A623] bg-[#FEF8E7] p-3 text-sm text-[#B45309] dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    This verification is no longer pending, so the NIN
                    decision cannot be changed.
                  </div>
                )}
              </Section>

              <Section
                title="Decision controls"
                description="Approve, reject, or request targeted reupload using the existing decision workflow."
              >
                <div className={SUBPANEL_CLASS}>
                  <label
                    htmlFor="verification-reason"
                    className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                  >
                    Reason
                  </label>

                  <textarea
                    id="verification-reason"
                    rows={5}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Required for reject and request reupload."
                    disabled={!canDecide || decisionMutation.isPending}
                    className={INPUT_CLASS}
                  />

                  <p className="mt-2 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Reject and request reupload require a reason. Approve does
                    not.
                  </p>
                </div>

                <div className={`mt-4 ${SUBPANEL_CLASS}`}>
                  <div className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Reupload fields
                  </div>

                  <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Required only for request reupload. Select the exact fields
                    the user must correct.
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                    {REUPLOAD_FIELD_OPTIONS.map((option) => {
                      const checked = reuploadFields.includes(option.value);

                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-2 rounded-xl border border-[#C5D5EE] bg-white px-3 py-2.5 text-sm text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA]"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={
                              !canDecide || decisionMutation.isPending
                            }
                            onChange={() =>
                              toggleReuploadField(option.value)
                            }
                            className="h-4 w-4 rounded border-gray-300"
                          />

                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {localMessage ? (
                  <div className="mt-4 rounded-xl border border-[#C5D5EE] bg-[#EAF0FB] p-3 text-sm text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-blue-900/20 dark:text-[#E8F0FA]">
                    {localMessage}
                  </div>
                ) : null}

                {decisionMutation.isError ? (
                  <div className="mt-4 rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] p-3 text-sm text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
                    {extractApiErrorMessage(decisionMutation.error)}
                  </div>
                ) : null}

                {!canDecide ? (
                  <div className="mt-4 rounded-xl border border-[#F5A623] bg-[#FEF8E7] p-3 text-sm text-[#B45309] dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    This verification is no longer pending, so no further
                    decision can be submitted.
                  </div>
                ) : null}

                {canDecide &&
                detail.ninVerificationStatus !== "VERIFIED" ? (
                  <div className="mt-4 rounded-xl border border-[#F5A623] bg-[#FEF8E7] p-3 text-sm text-[#B45309] dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    Overall approval is disabled until the NIN has been
                    manually verified by an authorized Verification Officer.
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3">
                  <ActionButton
                    label={
                      decisionMutation.isPending &&
                      selectedAction === "APPROVE"
                        ? "Approving..."
                        : "Approve"
                    }
                    action="APPROVE"
                    disabled={
                      !canDecide ||
                      decisionMutation.isPending ||
                      detail.ninVerificationStatus !== "VERIFIED"
                    }
                    onClick={handleDecision}
                  />

                  <ActionButton
                    label={
                      decisionMutation.isPending &&
                      selectedAction === "REQUEST_REUPLOAD"
                        ? "Submitting..."
                        : "Request reupload"
                    }
                    action="REQUEST_REUPLOAD"
                    disabled={!canDecide || decisionMutation.isPending}
                    onClick={handleDecision}
                  />

                  <ActionButton
                    label={
                      decisionMutation.isPending &&
                      selectedAction === "REJECT"
                        ? "Rejecting..."
                        : "Reject"
                    }
                    action="REJECT"
                    disabled={!canDecide || decisionMutation.isPending}
                    onClick={handleDecision}
                  />
                </div>
              </Section>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}