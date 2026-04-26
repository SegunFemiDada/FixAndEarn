//path: apps/web/src/app/app/profile/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import {
  getActiveRole,
  getStoredRoles,
  setActiveRole,
  type Role,
} from "@/lib/auth/session";
import { useSwitchRole } from "@/lib/account/queries";
import { useWithdrawalPinStatus, useSetWithdrawalPin } from "@/lib/wallet/queries";
import { sendPhoneVerificationCode, verifyPhoneCode } from "@/lib/auth/api"; // you need to create these API functions

type RecentReview = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  client: {
    displayName: string;
  };
};

type MyProfileResponse = {
  id: string;
  email: string;
  fullName: string;
  isVerified: boolean;
  avatarUrl?: string | null;
  phone?: string | null;
  phoneVerifiedAt?: string | null;
  roles: string[];
  verification: {
    status: string | null;
  };
  availability?: {
    preferred: string;
    effective: string;
    updatedAt?: string | null;
  };
  rating?: {
    average: number;
    count: number;
  };
  socials?: {
    instagram?: { handle: string; url: string } | null;
    tiktok?: { handle: string; url: string } | null;
  } | null;
  profile?: {
    bio?: string | null;
    skills?: string | null;
    state?: string | null;
    city?: string | null;
    lga?: string | null;
    area?: string | null;
  } | null;
  stats?: {
    completedJobs: number;
  } | null;
  recentReviews?: RecentReview[];
};

async function getMyProfile(): Promise<MyProfileResponse> {
  const res = await apiClient.get("/profiles/me");
  return res.data;
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

function normalizeRole(value: unknown): Role | null {
  const v = String(value ?? "").toUpperCase();
  return v === "CLIENT" || v === "FIXER" ? v : null;
}

function backendMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: unknown } };
    message?: unknown;
  };

  const msg = e?.response?.data?.message;
  if (Array.isArray(msg)) return msg.map(String).join(", ");
  if (typeof msg === "string" && msg.trim()) return msg;
  if (typeof e?.message === "string" && e.message.trim()) return e.message;
  return "Role switch failed.";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default function ProfilePage() {
  const [mounted, setMounted] = useState(false);
  const [activeRole, setActiveRoleState] = useState<Role | null>(null);
  const [storedRoles, setStoredRolesState] = useState<Role[]>([]);
  const [switchMsg, setSwitchMsg] = useState<string | null>(null);
  const [switchErr, setSwitchErr] = useState<string | null>(null);

  const switchRoleMutation = useSwitchRole();

  // Withdrawal pin
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const setPinMutation = useSetWithdrawalPin();
  const [setPinModalOpen, setSetPinModalOpen] = useState(false);
  const [changePinModalOpen, setChangePinModalOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const { data: pinStatus, refetch: refetchPinStatus } = useWithdrawalPinStatus();

  // Phone verification
  const [phoneInput, setPhoneInput] = useState("");
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const sendPhoneMutation = useMutation({
    mutationFn: (phone: string) => sendPhoneVerificationCode(phone),
    onSuccess: () => setShowCodeInput(true),
  });
  const [phoneVerified, setPhoneVerified] = useState(false);
  const verifyMutation = useMutation({
    mutationFn: (code: string) => verifyPhoneCode(code),
    onSuccess: () => {
      alert("Phone verified successfully");
      setShowCodeInput(false);
      setVerifyCode("");
      refetch(); // refresh profile data
    },
  });

  // Account deletion
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const requestDeletionMutation = useMutation({
    mutationFn: async (reason: string) => {
      await apiClient.post("/users/request-deletion", { reason });
    },
    onSuccess: () => {
      alert("Deletion request submitted. Admin will review it.");
      setDeleteModalOpen(false);
      setDeleteReason("");
    },
  });

  useEffect(() => {
    setMounted(true);
    setActiveRoleState(getActiveRole());
    setStoredRolesState(getStoredRoles());
  }, []);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["profiles", "me"],
    queryFn: getMyProfile,
    staleTime: 10_000,
    retry: 1,
    enabled: mounted,
  });

  // Update phone input when data loads
  useEffect(() => {
    if (data?.phone) setPhoneInput(data.phone);
  }, [data]);

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Loading profile…
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
    const msg = e?.response?.data?.message ?? e?.message ?? "Failed to load profile.";

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="font-semibold">Failed to load profile</div>
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

  const roles = Array.isArray(data?.roles)
    ? data.roles
        .map((r) => (typeof r === "string" ? r : null))
        .filter(Boolean) as string[]
    : [];

  const normalizedRoles = Array.from(
    new Set([...roles, ...storedRoles].map((r) => normalizeRole(r)).filter(Boolean))
  ) as Role[];

  const hasFixerRole = normalizedRoles.includes("FIXER");
  const hasClientRole = normalizedRoles.includes("CLIENT");

  const completedJobs = Number(data?.stats?.completedJobs ?? 0);
  const avg = Number(data?.rating?.average ?? 0);
  const count = Number(data?.rating?.count ?? 0);
  const skills = parseSkills(data?.profile?.skills);
  const recentReviews = Array.isArray(data?.recentReviews) ? data.recentReviews : [];

  const showFixerSections = activeRole === "FIXER" || (!activeRole && hasFixerRole);

  const verifiedLabel =
    activeRole === "FIXER"
      ? "Verified"
      : activeRole === "CLIENT"
        ? "Verified"
        : hasFixerRole
          ? "Verified"
          : hasClientRole
            ? "Verified"
            : "Verified";

  const verifiedTone =
    activeRole === "FIXER"
      ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
      : activeRole === "CLIENT"
        ? "border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 text-[#5B8FCC] dark:text-[#7AAEE0]"
        : hasFixerRole
          ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
          : "border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 text-[#5B8FCC] dark:text-[#7AAEE0]";

  async function handleSwitch(role: Role) {
    setSwitchMsg(null);
    setSwitchErr(null);

    try {
      await switchRoleMutation.mutateAsync({ role });
      setActiveRole(role);
      setActiveRoleState(role);
      setSwitchMsg(`Active role switched to ${role}.`);
      window.location.reload();
    } catch (err) {
      setSwitchErr(backendMessage(err));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">My Profile</h1>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Your account profile and role-aware summary.
          </p>
        </div>

        {/* Main profile card */}
        <div className="space-y-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-4">
            {data?.avatarUrl ? (
              <Image
                src={data.avatarUrl}
                alt={data?.fullName ?? "Profile"}
                width={72}
                height={72}
                unoptimized
                className="h-[72px] w-[72px] rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] object-cover"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] text-base font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {initials(data?.fullName)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {data?.fullName ?? "User"}
                </div>

                {data?.isVerified && (
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${verifiedTone}`}
                  >
                    {verifiedLabel}
                  </span>
                )}
              </div>

              {data?.profile?.bio && (
                <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  {data.profile.bio}
                </div>
              )}

              <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{data?.email}</div>
              <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                Roles: {normalizedRoles.length ? normalizedRoles.join(", ") : "—"}
                {activeRole ? ` • Active: ${activeRole}` : ""}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3">
              <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">Verification</div>
              <div className="mt-1 font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {data?.verification?.status ?? "—"}
              </div>
            </div>

            {showFixerSections && (
              <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3">
                <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">Fixer stats</div>
                <div className="mt-1 font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {completedJobs} completed jobs
                </div>
                <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Rating {avg.toFixed(1)} ({count} review{count === 1 ? "" : "s"})
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Switch role section */}
        <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Switch account</div>
          <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Choose the role you want to actively use across the app. Verification stays with your account.
          </div>

          <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm">
            <div className="text-[#1A2B4A] dark:text-[#E8F0FA]">
              Available roles:{" "}
              <span className="font-semibold">
                {normalizedRoles.length ? normalizedRoles.join(", ") : "None"}
              </span>
            </div>
            <div className="mt-1 text-[#1A2B4A] dark:text-[#E8F0FA]">
              Active role: <span className="font-semibold">{activeRole ?? "None"}</span>
            </div>
          </div>

          {switchMsg && (
            <div className="rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
              {switchMsg}
            </div>
          )}

          {switchErr && (
            <div className="rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
              {switchErr}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleSwitch("CLIENT")}
              disabled={switchRoleMutation.isPending || activeRole === "CLIENT"}
              className={[
                "rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                switchRoleMutation.isPending || activeRole === "CLIENT"
                  ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                  : "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]",
              ].join(" ")}
            >
              {activeRole === "CLIENT" ? "Using CLIENT" : "Switch to CLIENT"}
            </button>

            <button
              type="button"
              onClick={() => handleSwitch("FIXER")}
              disabled={switchRoleMutation.isPending || activeRole === "FIXER"}
              className={[
                "rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
                switchRoleMutation.isPending || activeRole === "FIXER"
                  ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                  : "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]",
              ].join(" ")}
            >
              {activeRole === "FIXER" ? "Using FIXER" : "Switch to FIXER"}
            </button>
          </div>
        </div>

        {/* Fixer-specific sections */}
        {showFixerSections && (
          <>
            <div className="space-y-2 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Availability</div>
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Effective: <b className="text-[#1A2B4A] dark:text-[#E8F0FA]">{data?.availability?.effective ?? "—"}</b>
              </div>
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Preferred: {data?.availability?.preferred ?? "—"}
              </div>
            </div>

            <div className="space-y-2 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Skills</div>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-3 py-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No skills provided.</div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Recent reviews</div>
              {recentReviews.length > 0 ? (
                <div className="space-y-3">
                  {recentReviews.map((review) => {
                    const fullStars = Math.floor(review.rating);
                    const hasHalfStar = review.rating % 1 >= 0.5;
                    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
                    return (
                      <div
                        key={review.id}
                        className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {review.client.displayName}
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[...Array(fullStars)].map((_, i) => (
                              <span key={`full-${i}`} className="text-[#F5A623] dark:text-[#F5A623]">★</span>
                            ))}
                            {hasHalfStar && <span className="text-[#F5A623] dark:text-[#F5A623]">½</span>}
                            {[...Array(emptyStars)].map((_, i) => (
                              <span key={`empty-${i}`} className="text-[#C5D5EE] dark:text-[#4A6080]">★</span>
                            ))}
                          </div>
                        </div>
                        <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                          {formatDateTime(review.createdAt)}
                        </div>
                        <div className="mt-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {review.comment?.trim() ? review.comment : "No written review."}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No reviews yet.</div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Socials</div>
              <div className="flex flex-col gap-2">
                {data?.socials?.instagram ? (
                  <a
                    href={data.socials.instagram.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] underline transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E]"
                  >
                    Instagram: @{data.socials.instagram.handle}
                  </a>
                ) : (
                  <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Instagram not provided.</div>
                )}

                {data?.socials?.tiktok ? (
                  <a
                    href={data.socials.tiktok.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] underline transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E]"
                  >
                    TikTok: @{data.socials.tiktok.handle}
                  </a>
                ) : (
                  <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">TikTok not provided.</div>
                )}
              </div>

              {pinStatus?.hasPin ? (
                <button
                  onClick={() => setChangePinModalOpen(true)}
                  className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#D4E3F7] dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#D9534F] dark:text-[#D9534F] hover:bg-[#C5D5EE] dark:hover:bg-[#2D3F55] transition"
                >
                  Change withdrawal pin
                </button>
              ) : (
                <button
                  onClick={() => setSetPinModalOpen(true)}
                  className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#D4E3F7] dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#D9534F] dark:text-[#D9534F] hover:bg-[#C5D5EE] dark:hover:bg-[#2D3F55] transition"
                >
                  Set withdrawal pin
                </button>
              )}
            </div>
          </>
        )}

        {/* Common sections */}
        <div className="space-y-2 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Bio</div>
          <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {data?.profile?.bio ?? "No bio provided."}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Location</div>
          <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {[data?.profile?.area, data?.profile?.lga, data?.profile?.city, data?.profile?.state]
              .filter(Boolean)
              .join(", ") || "No location provided."}
          </div>
        </div>

        {/* Phone verification */}
        <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Phone verification</div>
          {data?.phoneVerifiedAt || phoneVerified ? (
            <div className="text-sm text-[#2E7D32] dark:text-green-200">
              ✓ Phone verified: {data?.phone || phoneInput}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Add your phone number to increase account security.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="e.g. +2348012345678"
                  className="flex-1 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                />
                <button
                  onClick={() => sendPhoneMutation.mutate(phoneInput)}
                  disabled={sendPhoneMutation.isPending || !phoneInput.trim()}
                  className="rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 shadow-[0_2px_12px_rgba(91,143,204,0.35)]"
                >
                  Send code
                </button>
              </div>
              {showCodeInput && (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="flex-1 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none"
                  />
                  <button
                    onClick={() => verifyMutation.mutate(verifyCode)}
                    disabled={verifyMutation.isPending || !verifyCode.trim()}
                    className="rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] dark:bg-green-700 dark:hover:bg-green-800 px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                  >
                    Verify
                  </button>
                </div>
              )}
              {sendPhoneMutation.isError && (
                <p className="text-sm text-[#D9534F] dark:text-red-300">Failed to send code. Try again.</p>
              )}
              {verifyMutation.isError && (
                <p className="text-sm text-[#D9534F] dark:text-red-300">Invalid or expired code.</p>
              )}
            </div>
          )}
        </div>

        {/* Danger zone – Account deletion */}
        <div className="space-y-3 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="font-semibold text-[#D9534F] dark:text-red-300">Danger zone</div>
          <p className="text-sm text-[#D9534F] dark:text-red-300/80">
            Once you request account deletion, your data will be anonymised after admin approval. This action cannot be undone.
          </p>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center justify-center rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#D9534F] dark:text-red-300 transition hover:bg-[#FFF4F3] dark:hover:bg-red-900/20"
          >
            Request account deletion
          </button>
        </div>

        {/* Set Pin Modal */}
        {setPinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
            <div className="max-w-md w-full rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h2 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Set Withdrawal Pin</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (newPin !== confirmPin) {
                    alert("Pins do not match");
                    return;
                  }
                  await setPinMutation.mutateAsync({ newPin });
                  await refetchPinStatus();
                  setSetPinModalOpen(false);
                  setNewPin("");
                  setConfirmPin("");
                  alert("Pin set successfully");
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">New pin (4-6 digits)</label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none"
                    required
                    minLength={4}
                    maxLength={6}
                    pattern="\d*"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Confirm new pin</label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] py-2 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)]">Save</button>
                  <button type="button" onClick={() => setSetPinModalOpen(false)} className="flex-1 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Change Pin Modal */}
        {changePinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
            <div className="max-w-md w-full rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h2 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Change Withdrawal Pin</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (newPin !== confirmPin) {
                    alert("New pins do not match");
                    return;
                  }
                  await setPinMutation.mutateAsync({ currentPin, newPin });
                  await refetchPinStatus();
                  setChangePinModalOpen(false);
                  setCurrentPin("");
                  setNewPin("");
                  setConfirmPin("");
                  alert("Pin changed successfully");
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Current pin</label>
                  <input
                    type="password"
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">New pin (4-6 digits)</label>
                  <input
                    type="password"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none"
                    required
                    minLength={4}
                    maxLength={6}
                    pattern="\d*"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Confirm new pin</label>
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] py-2 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)]">Change</button>
                  <button type="button" onClick={() => setChangePinModalOpen(false)} className="flex-1 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] transition">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deletion Request Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
            <div className="max-w-md w-full rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h2 className="text-xl font-semibold text-[#D9534F] dark:text-red-300">Request account deletion</h2>
              <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Please explain why you want to delete your account. This helps us improve.
              </p>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={4}
                className="mt-4 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080]"
                placeholder="Reason (required)"
              />
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => requestDeletionMutation.mutate(deleteReason)}
                  disabled={!deleteReason.trim() || requestDeletionMutation.isPending}
                  className="flex-1 rounded-xl bg-[#D9534F] hover:bg-[#C13E3A] dark:bg-red-700 dark:hover:bg-red-800 py-2 text-sm font-medium text-white transition disabled:opacity-50"
                >
                  {requestDeletionMutation.isPending ? "Submitting..." : "Submit request"}
                </button>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}