// Path: apps/web/src/app/admin/users/[id]/page.tsx
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

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

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = typeof params?.id === "string" ? params.id : "";

  const detailQuery = useAdminUserDetail(userId, Boolean(userId));
  const suspendMutation = useAdminSuspendUser(userId);
  const unsuspendMutation = useAdminUnsuspendUser(userId);
  const forceReverifyMutation = useAdminForceReverifyUser(userId);
  const notesMutation = useAdminSetUserNotes(userId);
  const updateUserMutation = useAdminUpdateUser(userId);

  const [actionReason, setActionReason] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [currentAction, setCurrentAction] = React.useState<
    "SUSPEND" | "UNSUSPEND" | "FORCE_REVERIFY" | "NOTES" | null
  >(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = React.useState(false);
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
    if (detail) {
      setNotes(detail.adminNotes ?? "");
      setEditForm({
        fullName: detail.fullName || "",
        email: detail.email || "",
        bio: detail.verification?.bio || "",
        skills: detail.verification?.skills || "",
        addressHouse: detail.verification?.addressHouse || "",
        addressStreet: detail.verification?.addressStreet || "",
        addressArea: detail.verification?.addressArea || "",
        nearestBusStop: detail.verification?.nearestBusStop || "",
        lga: detail.verification?.lga || "",
        city: detail.verification?.city || "",
        state: detail.verification?.state || "",
        instagram: detail.verification?.instagram || "",
        tiktok: detail.verification?.tiktok || "",
      });
    }
  }, [detail]);

  const roleCodes = detail?.roles.map((item) => item.role.code).join(", ") ?? "";
  const verificationSkills = formatSkills(detail?.verification?.skills);

  function setOk(text: string) {
    setMessage({ type: "ok", text });
  }

  function setErr(text: string) {
    setMessage({ type: "err", text });
  }

  async function handleSuspend() {
    if (!detail) return;

    setMessage(null);

    const confirmed = window.confirm("Suspend this user account?");
    if (!confirmed) return;

    setCurrentAction("SUSPEND");

    suspendMutation.mutate(
      { reason: actionReason.trim() || undefined },
      {
        onSuccess: async () => {
          await detailQuery.refetch();
          setOk("User suspended successfully.");
        },
        onError: (error) => {
          setErr(extractApiErrorMessage(error));
        },
      }
    );
  }

  async function handleUnsuspend() {
    if (!detail) return;

    setMessage(null);

    const confirmed = window.confirm("Unsuspend this user account?");
    if (!confirmed) return;

    setCurrentAction("UNSUSPEND");

    unsuspendMutation.mutate(
      { reason: actionReason.trim() || undefined },
      {
        onSuccess: async () => {
          await detailQuery.refetch();
          setOk("User re-activated successfully.");
        },
        onError: (error) => {
          setErr(extractApiErrorMessage(error));
        },
      }
    );
  }

  async function handleForceReverify() {
    if (!detail) return;

    setMessage(null);

    const confirmed = window.confirm("Force this user to re-verify?");
    if (!confirmed) return;

    setCurrentAction("FORCE_REVERIFY");

    forceReverifyMutation.mutate(
      { reason: actionReason.trim() || undefined },
      {
        onSuccess: async () => {
          await detailQuery.refetch();
          setOk("Force reverify flag enabled successfully.");
        },
        onError: (error) => {
          setErr(extractApiErrorMessage(error));
        },
      }
    );
  }

  async function handleSaveNotes() {
    if (!detail) return;

    setMessage(null);
    setCurrentAction("NOTES");

    notesMutation.mutate(
      { notes: notes.trim() || undefined },
      {
        onSuccess: async () => {
          await detailQuery.refetch();
          setOk("Admin notes updated successfully.");
        },
        onError: (error) => {
          setErr(extractApiErrorMessage(error));
        },
      }
    );
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    updateUserMutation.mutate(editForm, {
      onSuccess: async () => {
        await detailQuery.refetch();
        setOk("User updated successfully.");
        setEditModalOpen(false);
      },
      onError: (error) => {
        setErr(extractApiErrorMessage(error));
      },
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">User detail</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Administrative user review</h2>
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Full user record returned by the current admin backend, including role-sensitive masking where enforced.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
            >
              Back
            </Link>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setEditModalOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
            >
              Edit User
            </button>
          </div>
        </div>
      </section>

      {detailQuery.isLoading ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading user details...</p>
        </section>
      ) : detailQuery.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">Failed to load user</h3>
          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">{extractApiErrorMessage(detailQuery.error)}</p>
        </section>
      ) : !detail ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">User record not found.</p>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{detail.fullName}</h3>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium",
                    detail.isActive
                      ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                      : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                  ].join(" ")}
                >
                  {detail.isActive ? "Active" : "Suspended"}
                </span>

                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium",
                    detail.verification?.status === "APPROVED"
                      ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                      : detail.verification?.status === "REJECTED"
                        ? "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300"
                        : detail.verification?.status === "PENDING"
                          ? "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300"
                          : "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] text-[#6B7C99] dark:text-[#8FA0BC]",
                  ].join(" ")}
                >
                  {detail.verification?.status ?? "NO_VERIFICATION"}
                </span>

                {detail.forceReverify && (
                  <span className="rounded-full border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 px-3 py-1 text-xs font-medium text-[#B45309] dark:text-amber-300">
                    FORCE_REVERIFY
                  </span>
                )}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="User ID" value={detail.id} breakAll />
                <DetailField label="Email" value={detail.email} breakAll />
                <DetailField label="Phone" value={detail.phone ?? "Not provided"} />
                <DetailField label="Phone Verified" value={detail.phoneVerifiedAt ? formatDateTime(detail.phoneVerifiedAt) : "No"} />
                <DetailField label="Roles" value={roleCodes} />
                <DetailField label="Joined" value={formatDateTime(detail.createdAt)} />
                <DetailField label="Updated" value={formatDateTime(detail.updatedAt)} />
                <DetailField label="Wallet balance" value={detail.wallet ? formatFecFromMilli(detail.wallet.balanceMilliFec) : "Not available"} />
              </div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Verification summary</h3>

              {!detail.verification ? (
                <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No verification record found for this user.</p>
              ) : (
                <>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <DetailField label="Verification ID" value={detail.verification.id} breakAll />
                    <DetailField label="Status" value={detail.verification.status} />
                    <DetailField label="Reviewed at" value={formatDateTime(detail.verification.reviewedAt)} />
                    <DetailField label="Review reason" value={detail.verification.reviewReason} />
                    <DetailField label="House number" value={detail.verification.addressHouse} />
                    <DetailField label="Street name" value={detail.verification.addressStreet} />
                    <DetailField label="Area" value={detail.verification.addressArea} />
                    <DetailField label="Nearest bus stop" value={detail.verification.nearestBusStop} />
                    <DetailField label="LGA" value={detail.verification.lga} />
                    <DetailField label="City" value={detail.verification.city} />
                    <DetailField label="State" value={detail.verification.state} />
                    <DetailField label="Instagram" value={detail.verification.instagram} />
                    <DetailField label="TikTok" value={detail.verification.tiktok} />
                  </div>

                  <div className="mt-4">
                    <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Bio</span>
                    <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">{detail.verification.bio || "Not available"}</p>
                  </div>

                  <div className="mt-4">
                    <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Skills</span>
                    {verificationSkills.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {verificationSkills.map((skill) => (
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
                </>
              )}
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Recent financial activity</h3>

              <div className="mt-4 grid gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Recent deposits</h4>
                  {detail.deposits.length === 0 ? (
                    <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No deposits found.</p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {detail.deposits.map((deposit) => (
                        <div key={deposit.id} className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3">
                          <div className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {formatFecFromMilli(deposit.amountMilliFec)}
                          </div>
                          <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">{deposit.status ?? "UNKNOWN"}</div>
                          <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">{formatDateTime(deposit.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Recent withdrawals</h4>
                  {detail.withdrawals.length === 0 ? (
                    <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No withdrawals found.</p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {detail.withdrawals.map((withdrawal) => (
                        <div key={withdrawal.id} className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3">
                          <div className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {formatFecFromMilli(withdrawal.amountMilliFec)}
                          </div>
                          <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">{withdrawal.status ?? "UNKNOWN"}</div>
                          <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">{formatDateTime(withdrawal.createdAt)}</div>
                          {withdrawal.reviewNote && (
                            <div className="mt-2 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">Note: {withdrawal.reviewNote}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Bank details</h3>

              {!detail.bankDetails ? (
                <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Bank details are not available for this admin role or have not been saved.
                </p>
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField label="Bank name" value={detail.bankDetails.bankName ?? null} />
                  <DetailField label="Account name" value={detail.bankDetails.accountName ?? null} />
                  <DetailField label="Account number" value={detail.bankDetails.accountNumber ?? null} />
                  <DetailField label="Bank code" value={detail.bankDetails.bankCode ?? null} />
                  <DetailField
                    label="Recipient code"
                    value={detail.bankDetails.paystackRecipientCode ?? null}
                    breakAll
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Admin actions</h3>
              <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Suspend and unsuspend accept an optional reason. Force reverify accepts an optional reason. Notes save
                directly to the user record.
              </p>

              <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <label htmlFor="user-action-reason" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Action reason
                </label>
                <textarea
                  id="user-action-reason"
                  rows={4}
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  placeholder="Optional reason for suspend, unsuspend, or force reverify."
                  disabled={busy}
                  className="mt-2 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                />
              </div>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={handleSuspend}
                  disabled={!detail.isActive || busy}
                  className={[
                    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
                    !detail.isActive || busy
                      ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                      : "border border-[#F2C0BC] dark:border-red-700 bg-white dark:bg-[#1E2A3A] text-[#D9534F] dark:text-red-300 hover:bg-[#FFF4F3] dark:hover:bg-red-900/20",
                  ].join(" ")}
                >
                  {suspendMutation.isPending && currentAction === "SUSPEND" ? "Suspending..." : "Suspend user"}
                </button>

                <button
                  type="button"
                  onClick={handleUnsuspend}
                  disabled={detail.isActive || busy}
                  className={[
                    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
                    detail.isActive || busy
                      ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                      : "border border-[#B8D9B8] dark:border-green-700 bg-white dark:bg-[#1E2A3A] text-[#2E7D32] dark:text-green-200 hover:bg-[#F0FAF0] dark:hover:bg-green-900/20",
                  ].join(" ")}
                >
                  {unsuspendMutation.isPending && currentAction === "UNSUSPEND" ? "Unsuspending..." : "Unsuspend user"}
                </button>

                <button
                  type="button"
                  onClick={handleForceReverify}
                  disabled={busy || detail.forceReverify}
                  className={[
                    "inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
                    busy || detail.forceReverify
                      ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                      : "border border-[#F5A623] dark:border-amber-700 bg-white dark:bg-[#1E2A3A] text-[#B45309] dark:text-amber-300 hover:bg-[#FEF8E7] dark:hover:bg-amber-900/20",
                  ].join(" ")}
                >
                  {forceReverifyMutation.isPending && currentAction === "FORCE_REVERIFY"
                    ? "Updating..."
                    : detail.forceReverify
                      ? "Force reverify already enabled"
                      : "Force reverify"}
                </button>
              </div>

              {message && (
                <div
                  className={[
                    "mt-4 rounded-2xl border p-3 text-sm",
                    message.type === "ok"
                      ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                      : "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                  ].join(" ")}
                >
                  {message.text}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Admin notes</h3>

              <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <label htmlFor="admin-notes" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Notes
                </label>
                <textarea
                  id="admin-notes"
                  rows={8}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Internal admin notes for this user."
                  disabled={busy}
                  className="mt-2 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={busy}
                className={[
                  "mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition",
                  busy
                    ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                    : "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]",
                ].join(" ")}
              >
                {notesMutation.isPending && currentAction === "NOTES" ? "Saving..." : "Save notes"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Edit User Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 dark:bg-black/70">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_8px_32px_rgba(91,143,204,0.16)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Edit User</h2>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-[#6B7C99] dark:text-[#8FA0BC] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA] transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Skills (comma separated)</label>
                  <input
                    type="text"
                    value={editForm.skills}
                    onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">House Number</label>
                  <input
                    type="text"
                    value={editForm.addressHouse}
                    onChange={(e) => setEditForm({ ...editForm, addressHouse: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Street Name</label>
                  <input
                    type="text"
                    value={editForm.addressStreet}
                    onChange={(e) => setEditForm({ ...editForm, addressStreet: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Area</label>
                  <input
                    type="text"
                    value={editForm.addressArea}
                    onChange={(e) => setEditForm({ ...editForm, addressArea: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Nearest Bus Stop</label>
                  <input
                    type="text"
                    value={editForm.nearestBusStop}
                    onChange={(e) => setEditForm({ ...editForm, nearestBusStop: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">LGA</label>
                  <input
                    type="text"
                    value={editForm.lga}
                    onChange={(e) => setEditForm({ ...editForm, lga: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">City</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">State</label>
                  <input
                    type="text"
                    value={editForm.state}
                    onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Instagram</label>
                  <input
                    type="text"
                    value={editForm.instagram}
                    onChange={(e) => setEditForm({ ...editForm, instagram: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">TikTok</label>
                  <input
                    type="text"
                    value={editForm.tiktok}
                    onChange={(e) => setEditForm({ ...editForm, tiktok: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}