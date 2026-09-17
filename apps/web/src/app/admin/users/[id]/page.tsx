"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useAdminForceReverifyUser,
  useAdminSetUserNotes,
  useAdminSuspendUser,
  useAdminUnsuspendUser,
  useAdminUserDetail,
  useAdminUpdateUser,
} from "@/lib/admin/users/queries";
import { formatFecFromMilli } from "@/lib/wallet/ui";
import UserInvestigationPanel from "@/components/admin/UserInvestigationPanel";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatSkills(skills: string | null | undefined) {
  if (!skills?.trim()) return [];

  return skills
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function badgeClass(
  variant: "success" | "warning" | "danger" | "neutral" | "info",
) {
  switch (variant) {
    case "success":
      return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";

    case "warning":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200";

    case "danger":
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";

    case "info":
      return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-200";

    default:
      return "border-[#C5D5EE] bg-[#F4F8FF] text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]";
  }
}

function Section({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#C5D5EE] bg-white shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
      <div className="flex flex-col gap-2 border-b border-[#D9E3F1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#2D3F55]">
        <div>
          {eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              {eyebrow}
            </p>
          )}

          <h3 className="mt-0.5 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            {title}
          </h3>
        </div>

        {action}
      </div>

      <div className="p-5">{children}</div>
    </section>
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
      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7C99] dark:text-[#8FA0BC]">
        {label}
      </span>

      <span
        className={[
          "mt-1 block text-sm leading-5 text-[#1A2B4A] dark:text-[#E8F0FA]",
          breakAll ? "break-all" : "",
        ].join(" ")}
      >
        {value?.trim() ? value : "Not available"}
      </span>
    </div>
  );
}

function StatusBadge({
  children,
  variant = "neutral",
}: {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        badgeClass(variant),
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const userId =
    typeof params?.id === "string" ? params.id : "";

  const detailQuery = useAdminUserDetail(
    userId,
    Boolean(userId),
  );

  const suspendMutation = useAdminSuspendUser(userId);
  const unsuspendMutation = useAdminUnsuspendUser(userId);
  const forceReverifyMutation =
    useAdminForceReverifyUser(userId);
  const notesMutation = useAdminSetUserNotes(userId);
  const updateUserMutation =
    useAdminUpdateUser(userId);

  const [actionReason, setActionReason] =
    React.useState("");

  const [notes, setNotes] = React.useState("");

  const [message, setMessage] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  const [currentAction, setCurrentAction] =
    React.useState<
      | "SUSPEND"
      | "UNSUSPEND"
      | "FORCE_REVERIFY"
      | "NOTES"
      | null
    >(null);

  const [editModalOpen, setEditModalOpen] =
    React.useState(false);

  const [editForm, setEditForm] = React.useState({
    fullName: "",
    email: "",
    bio: "",
    skills: "",
    addressHouse: "",
    addressStreet: "",
    addressArea: "",
    nearestBusStop: "",
    lga: "",
    city: "",
    state: "",
    instagram: "",
    tiktok: "",
  });

  const detail = detailQuery.data;

  const busy =
    suspendMutation.isPending ||
    unsuspendMutation.isPending ||
    forceReverifyMutation.isPending ||
    notesMutation.isPending ||
    updateUserMutation.isPending;

  React.useEffect(() => {
    if (!detail) return;

    setNotes(detail.adminNotes ?? "");

    setEditForm({
      fullName: detail.fullName || "",
      email: detail.email || "",
      bio: detail.verification?.bio || "",
      skills: detail.verification?.skills || "",
      addressHouse:
        detail.verification?.addressHouse || "",
      addressStreet:
        detail.verification?.addressStreet || "",
      addressArea:
        detail.verification?.addressArea || "",
      nearestBusStop:
        detail.verification?.nearestBusStop || "",
      lga: detail.verification?.lga || "",
      city: detail.verification?.city || "",
      state: detail.verification?.state || "",
      instagram:
        detail.verification?.instagram || "",
      tiktok: detail.verification?.tiktok || "",
    });
  }, [detail]);

  const roleCodes =
    detail?.roles
      .map((item) => item.role.code)
      .join(", ") ?? "";

  const verificationSkills = formatSkills(
    detail?.verification?.skills,
  );

  function setOk(text: string) {
    setMessage({
      type: "ok",
      text,
    });
  }

  function setErr(text: string) {
    setMessage({
      type: "err",
      text,
    });
  }

  async function handleSuspend() {
    if (!detail) return;

    setMessage(null);

    const confirmed = window.confirm(
      "Suspend this user account?",
    );

    if (!confirmed) return;

    setCurrentAction("SUSPEND");

    suspendMutation.mutate(
      {
        reason:
          actionReason.trim() || undefined,
      },
      {
        onSuccess: async () => {
          await detailQuery.refetch();
          setOk(
            "User suspended successfully.",
          );
        },
        onError: (error) => {
          setErr(
            extractApiErrorMessage(error),
          );
        },
      },
    );
  }

  async function handleUnsuspend() {
    if (!detail) return;

    setMessage(null);

    const confirmed = window.confirm(
      "Unsuspend this user account?",
    );

    if (!confirmed) return;

    setCurrentAction("UNSUSPEND");

    unsuspendMutation.mutate(
      {
        reason:
          actionReason.trim() || undefined,
      },
      {
        onSuccess: async () => {
          await detailQuery.refetch();
          setOk(
            "User re-activated successfully.",
          );
        },
        onError: (error) => {
          setErr(
            extractApiErrorMessage(error),
          );
        },
      },
    );
  }

  async function handleForceReverify() {
    if (!detail) return;

    setMessage(null);

    const confirmed = window.confirm(
      "Force this user to re-verify?",
    );

    if (!confirmed) return;

    setCurrentAction("FORCE_REVERIFY");

    forceReverifyMutation.mutate(
      {
        reason:
          actionReason.trim() || undefined,
      },
      {
        onSuccess: async () => {
          await detailQuery.refetch();
          setOk(
            "Force reverify flag enabled successfully.",
          );
        },
        onError: (error) => {
          setErr(
            extractApiErrorMessage(error),
          );
        },
      },
    );
  }

  async function handleSaveNotes() {
    if (!detail) return;

    setMessage(null);
    setCurrentAction("NOTES");

    notesMutation.mutate(
      {
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: async () => {
          await detailQuery.refetch();
          setOk(
            "Admin notes updated successfully.",
          );
        },
        onError: (error) => {
          setErr(
            extractApiErrorMessage(error),
          );
        },
      },
    );
  }

  async function handleEditSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault();

    setMessage(null);

    updateUserMutation.mutate(editForm, {
      onSuccess: async () => {
        await detailQuery.refetch();
        setOk("User updated successfully.");
        setEditModalOpen(false);
      },
      onError: (error) => {
        setErr(
          extractApiErrorMessage(error),
        );
      },
    });
  }

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-[#C5D5EE] bg-white p-6 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading user details...
          </p>
        </section>
      </div>
    );
  }

  if (detailQuery.isError) {
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-700 dark:bg-red-900/20">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-200">
            Failed to load user
          </h3>

          <p className="mt-2 text-sm text-red-700 dark:text-red-200">
            {extractApiErrorMessage(
              detailQuery.error,
            )}
          </p>

          <Link
            href="/admin/users"
            className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#315F96] shadow-sm dark:bg-[#1E2A3A] dark:text-[#8FC1F2]"
          >
            Back to Users
          </Link>
        </section>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-[#C5D5EE] bg-white p-6 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            User record not found.
          </p>

          <Link
            href="/admin/users"
            className="mt-4 inline-flex rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
          >
            Back to Users
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <section className="rounded-xl border border-[#C5D5EE] bg-white p-5 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                User Management
              </span>

              <StatusBadge
                variant={
                  detail.isActive
                    ? "success"
                    : "danger"
                }
              >
                {detail.isActive
                  ? "ACTIVE"
                  : "SUSPENDED"}
              </StatusBadge>

              <StatusBadge
                variant={
                  detail.verification?.status ===
                  "APPROVED"
                    ? "success"
                    : detail.verification?.status ===
                        "REJECTED"
                      ? "danger"
                      : detail.verification?.status ===
                          "PENDING"
                        ? "warning"
                        : "neutral"
                }
              >
                {detail.verification?.status ??
                  "NO VERIFICATION"}
              </StatusBadge>

              {detail.forceReverify && (
                <StatusBadge variant="warning">
                  FORCE REVERIFY
                </StatusBadge>
              )}
            </div>

            <h2 className="mt-2 truncate text-2xl font-semibold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA]">
              {detail.fullName}
            </h2>

            <p className="mt-1 break-all font-mono text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
              {detail.id}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center rounded-lg border border-[#C5D5EE] bg-white px-4 py-2 text-sm font-semibold text-[#315F96] transition-colors hover:bg-[#F4F8FF] dark:border-[#3A506B] dark:bg-[#1E2A3A] dark:text-[#8FC1F2] dark:hover:bg-[#243247]"
            >
              Back
            </Link>

            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center justify-center rounded-lg border border-[#C5D5EE] bg-white px-4 py-2 text-sm font-semibold text-[#516786] transition-colors hover:bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#AAB9D0] dark:hover:bg-[#243247]"
            >
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                setEditModalOpen(true)
              }
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              Edit User
            </button>
          </div>
        </div>
      </section>

      {/* Operational summary */}
      <section className="overflow-hidden rounded-xl border border-[#C5D5EE] bg-white shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <div className="grid grid-cols-2 divide-x divide-y divide-[#D9E3F1] md:grid-cols-4 md:divide-y-0 dark:divide-[#2D3F55]">
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Role
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {roleCodes || "None"}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Wallet
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {detail.wallet
                ? formatFecFromMilli(
                    detail.wallet
                      .balanceMilliFec,
                  )
                : "Not available"}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Verification
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {detail.verification?.status ??
                "Not submitted"}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Joined
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {formatDateTime(detail.createdAt)}
            </p>
          </div>
        </div>
      </section>

      {/* Main record */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        {/* Primary information */}
        <div className="space-y-5">
          <Section
            title="Account details"
            eyebrow="Identity"
          >
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField
                label="Full name"
                value={detail.fullName}
              />

              <DetailField
                label="Email"
                value={detail.email}
                breakAll
              />

              <DetailField
                label="Phone"
                value={
                  detail.phone ??
                  "Not provided"
                }
              />

              <DetailField
                label="Phone verified"
                value={
                  detail.phoneVerifiedAt
                    ? formatDateTime(
                        detail.phoneVerifiedAt,
                      )
                    : "No"
                }
              />

              <DetailField
                label="Roles"
                value={roleCodes}
              />

              <DetailField
                label="User ID"
                value={detail.id}
                breakAll
              />

              <DetailField
                label="Joined"
                value={formatDateTime(
                  detail.createdAt,
                )}
              />

              <DetailField
                label="Last updated"
                value={formatDateTime(
                  detail.updatedAt,
                )}
              />

              <DetailField
                label="Wallet balance"
                value={
                  detail.wallet
                    ? formatFecFromMilli(
                        detail.wallet
                          .balanceMilliFec,
                      )
                    : "Not available"
                }
              />
            </div>
          </Section>

          {/* Verification */}
          <Section
            title="Verification"
            eyebrow="Identity & profile"
            action={
              <StatusBadge
                variant={
                  detail.verification?.status ===
                  "APPROVED"
                    ? "success"
                    : detail.verification?.status ===
                        "REJECTED"
                      ? "danger"
                      : detail.verification?.status ===
                          "PENDING"
                        ? "warning"
                        : "neutral"
                }
              >
                {detail.verification?.status ??
                  "NO RECORD"}
              </StatusBadge>
            }
          >
            {!detail.verification ? (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                No verification record exists
                for this user.
              </p>
            ) : (
              <div className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField
                    label="Verification ID"
                    value={
                      detail.verification.id
                    }
                    breakAll
                  />

                  <DetailField
                    label="Status"
                    value={
                      detail.verification.status
                    }
                  />

                  <DetailField
                    label="Reviewed at"
                    value={formatDateTime(
                      detail.verification
                        .reviewedAt,
                    )}
                  />

                  <DetailField
                    label="Review reason"
                    value={
                      detail.verification
                        .reviewReason
                    }
                  />

                  <DetailField
                    label="House number"
                    value={
                      detail.verification
                        .addressHouse
                    }
                  />

                  <DetailField
                    label="Street"
                    value={
                      detail.verification
                        .addressStreet
                    }
                  />

                  <DetailField
                    label="Area"
                    value={
                      detail.verification
                        .addressArea
                    }
                  />

                  <DetailField
                    label="Nearest bus stop"
                    value={
                      detail.verification
                        .nearestBusStop
                    }
                  />

                  <DetailField
                    label="LGA"
                    value={
                      detail.verification.lga
                    }
                  />

                  <DetailField
                    label="City"
                    value={
                      detail.verification.city
                    }
                  />

                  <DetailField
                    label="State"
                    value={
                      detail.verification.state
                    }
                  />

                  <DetailField
                    label="Instagram"
                    value={
                      detail.verification
                        .instagram
                    }
                  />

                  <DetailField
                    label="TikTok"
                    value={
                      detail.verification.tiktok
                    }
                  />
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7C99] dark:text-[#8FA0BC]">
                    Bio
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {detail.verification.bio ||
                      "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7C99] dark:text-[#8FA0BC]">
                    Skills
                  </p>

                  {verificationSkills.length >
                  0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {verificationSkills.map(
                        (skill) => (
                          <span
                            key={`${detail.id}-${skill}`}
                            className="rounded-full border border-[#C5D5EE] bg-[#F4F8FF] px-3 py-1 text-xs font-medium text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]"
                          >
                            {skill}
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                      No skills provided.
                    </p>
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* Bank details */}
          <Section
            title="Bank details"
            eyebrow="Withdrawal destination"
          >
            {!detail.bankDetails ? (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Bank details are not available
                for this admin role or have not
                been saved.
              </p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <DetailField
                  label="Bank name"
                  value={
                    detail.bankDetails
                      .bankName ?? null
                  }
                />

                <DetailField
                  label="Account name"
                  value={
                    detail.bankDetails
                      .accountName ?? null
                  }
                />

                <DetailField
                  label="Account number"
                  value={
                    detail.bankDetails
                      .accountNumber ?? null
                  }
                  breakAll
                />

                <DetailField
                  label="Bank code"
                  value={
                    detail.bankDetails
                      .bankCode ?? null
                  }
                />
              </div>
            )}
          </Section>
        </div>

        {/* Administrative controls */}
        <aside className="space-y-5 xl:sticky xl:top-5">
          <Section
            title="Admin actions"
            eyebrow="Account control"
          >
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="user-action-reason"
                  className="block text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]"
                >
                  Action reason
                </label>

                <textarea
                  id="user-action-reason"
                  rows={4}
                  value={actionReason}
                  onChange={(event) =>
                    setActionReason(
                      event.target.value,
                    )
                  }
                  placeholder="Optional reason for suspend, unsuspend, or force reverify."
                  disabled={busy}
                  className="mt-2 w-full resize-y rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3.5 py-3 text-sm text-[#1A2B4A] outline-none placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#5D718F]"
                />
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleSuspend}
                  disabled={
                    !detail.isActive ||
                    busy
                  }
                  className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-red-500 dark:hover:bg-red-600"
                >
                  {suspendMutation.isPending &&
                  currentAction ===
                    "SUSPEND"
                    ? "Suspending..."
                    : "Suspend user"}
                </button>

                <button
                  type="button"
                  onClick={handleUnsuspend}
                  disabled={
                    detail.isActive ||
                    busy
                  }
                  className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  {unsuspendMutation.isPending &&
                  currentAction ===
                    "UNSUSPEND"
                    ? "Unsuspending..."
                    : "Unsuspend user"}
                </button>

                <button
                  type="button"
                  onClick={
                    handleForceReverify
                  }
                  disabled={
                    busy ||
                    detail.forceReverify
                  }
                  className="w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                  {forceReverifyMutation.isPending &&
                  currentAction ===
                    "FORCE_REVERIFY"
                    ? "Updating..."
                    : detail.forceReverify
                      ? "Force reverify enabled"
                      : "Force reverify"}
                </button>
              </div>

              {message && (
                <div
                  className={[
                    "rounded-lg border px-4 py-3 text-sm",
                    message.type === "ok"
                      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200",
                  ].join(" ")}
                >
                  {message.text}
                </div>
              )}
            </div>
          </Section>

          <Section
            title="Admin notes"
            eyebrow="Internal"
          >
            <div>
              <label
                htmlFor="admin-notes"
                className="block text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]"
              >
                Notes
              </label>

              <textarea
                id="admin-notes"
                rows={9}
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Internal admin notes for this user."
                disabled={busy}
                className="mt-2 w-full resize-y rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3.5 py-3 text-sm text-[#1A2B4A] outline-none placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#5D718F]"
              />

              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={busy}
                className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                {notesMutation.isPending &&
                currentAction ===
                  "NOTES"
                  ? "Saving..."
                  : "Save notes"}
              </button>
            </div>
          </Section>

          <Section
            title="Account snapshot"
            eyebrow="Current state"
          >
            <div className="space-y-4">
              <DetailField
                label="Account"
                value={
                  detail.isActive
                    ? "Active"
                    : "Suspended"
                }
              />

              <DetailField
                label="Verification"
                value={
                  detail.verification
                    ?.status ??
                  "Not submitted"
                }
              />

              <DetailField
                label="Force reverify"
                value={
                  detail.forceReverify
                    ? "Enabled"
                    : "Not enabled"
                }
              />

              <DetailField
                label="Phone verification"
                value={
                  detail.phoneVerifiedAt
                    ? "Verified"
                    : "Not verified"
                }
              />

              <DetailField
                label="Wallet"
                value={
                  detail.wallet
                    ? formatFecFromMilli(
                        detail.wallet
                          .balanceMilliFec,
                      )
                    : "Not available"
                }
              />
            </div>
          </Section>
        </aside>
      </div>
      <UserInvestigationPanel userId={detail.id} />

      {/* Edit modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 dark:bg-black/70">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-[#C5D5EE] bg-white shadow-2xl dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#D9E3F1] bg-white px-5 py-4 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                  User Management
                </p>

                <h2 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Edit User
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditModalOpen(false)
                }
                className="rounded-lg border border-[#C5D5EE] px-3 py-2 text-sm font-semibold text-[#516786] hover:bg-[#F4F8FF] dark:border-[#2D3F55] dark:text-[#AAB9D0] dark:hover:bg-[#243247]"
                aria-label="Close edit user dialog"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleEditSubmit}
              className="space-y-6 p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="edit-full-name"
                    className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                  >
                    Full Name
                  </label>

                  <input
                    id="edit-full-name"
                    type="text"
                    value={editForm.fullName}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        fullName:
                          event.target
                            .value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3.5 py-2.5 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-email"
                    className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                  >
                    Email
                  </label>

                  <input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        email:
                          event.target
                            .value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3.5 py-2.5 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="edit-bio"
                    className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                  >
                    Bio
                  </label>

                  <textarea
                    id="edit-bio"
                    rows={4}
                    value={editForm.bio}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        bio: event.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3.5 py-2.5 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="edit-skills"
                    className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                  >
                    Skills (comma separated)
                  </label>

                  <input
                    id="edit-skills"
                    type="text"
                    value={editForm.skills}
                    onChange={(event) =>
                      setEditForm({
                        ...editForm,
                        skills:
                          event.target
                            .value,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3.5 py-2.5 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                  />
                </div>

                {[
                  [
                    "House Number",
                    "addressHouse",
                    "text",
                  ],
                  [
                    "Street",
                    "addressStreet",
                    "text",
                  ],
                  [
                    "Area",
                    "addressArea",
                    "text",
                  ],
                  [
                    "Nearest Bus Stop",
                    "nearestBusStop",
                    "text",
                  ],
                  ["LGA", "lga", "text"],
                  ["City", "city", "text"],
                  ["State", "state", "text"],
                  [
                    "Instagram",
                    "instagram",
                    "text",
                  ],
                  ["TikTok", "tiktok", "text"],
                ].map(
                  ([label, field]) => {
                    const key =
                      field as keyof typeof editForm;

                    return (
                      <div key={field}>
                        <label
                          htmlFor={`edit-${field}`}
                          className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                        >
                          {label}
                        </label>

                        <input
                          id={`edit-${field}`}
                          type="text"
                          value={editForm[key]}
                          onChange={(event) =>
                            setEditForm({
                              ...editForm,
                              [key]:
                                event.target
                                  .value,
                            })
                          }
                          className="mt-1 w-full rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3.5 py-2.5 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                        />
                      </div>
                    );
                  },
                )}
              </div>

              <div className="flex justify-end gap-2 border-t border-[#D9E3F1] pt-5 dark:border-[#2D3F55]">
                <button
                  type="button"
                  onClick={() =>
                    setEditModalOpen(false)
                  }
                  className="rounded-lg border border-[#C5D5EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#516786] hover:bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#AAB9D0] dark:hover:bg-[#243247]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    updateUserMutation.isPending
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {updateUserMutation.isPending
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}