// Path: apps/web/src/app/admin/users/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { useAdminUsersList } from "@/lib/admin/users/queries";
import type {
  AdminSearchRole,
  UserRoleCode,
  VerificationStatus,
} from "@/lib/admin/users/types";

const ROLE_OPTIONS: Array<{ label: string; value: AdminSearchRole }> = [
  { label: "All roles", value: "" },
  { label: "Client", value: "CLIENT" },
  { label: "Fixer", value: "FIXER" },
];

const VERIFICATION_OPTIONS: Array<{ label: string; value: "" | VerificationStatus }> = [
  { label: "All verification", value: "" },
  { label: "Approved", value: "APPROVED" },
  { label: "Pending", value: "PENDING" },
  { label: "Rejected", value: "REJECTED" },
];

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRoles(roles: Array<{ role: { code: UserRoleCode } }>) {
  return roles.map((r) => r.role.code);
}

function getVerificationStatusClass(status: VerificationStatus | null | undefined) {
  if (status === "APPROVED") return "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200";
  if (status === "REJECTED") return "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300";
  if (status === "PENDING") return "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
  return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] text-[#6B7C99] dark:text-[#8FA0BC]";
}

export default function AdminUsersPage() {
  const [searchInput, setSearchInput] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [role, setRole] = React.useState<AdminSearchRole>("");
  const [verificationStatus, setVerificationStatus] = React.useState<
    "" | VerificationStatus
  >("");

  const [skip, setSkip] = React.useState(0);
  const take = 20;

  const query = useAdminUsersList(
    {
      q: searchTerm || undefined,
      role: role || undefined,
      verificationStatus:
        verificationStatus === "" ? undefined : verificationStatus,
      skip,
      take,
    },
    true
  );

  const items = query.data ?? [];
  const hasPrevious = skip > 0;
  const hasNext = items.length === take;

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSkip(0);
    setSearchTerm(searchInput.trim());
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Users</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">User management</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Search users, filter by role and verification status, and inspect account state.
        </p>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-6">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-4 border-b border-[#C5D5EE] dark:border-[#2D3F55] pb-4 lg:grid-cols-[1fr_200px_200px_auto]"
        >
          <div>
            <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Search</label>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Name or email"
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
            />
          </div>

          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value as AdminSearchRole);
              setSkip(0);
            }}
            className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            value={verificationStatus}
            onChange={(e) => {
              setVerificationStatus(e.target.value as "" | VerificationStatus);
              setSkip(0);
            }}
            className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
          >
            {VERIFICATION_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

         <button
  type="submit"
  className="
    inline-flex items-center justify-center
    rounded-lg px-4 py-3 font-semibold
    bg-blue-600 text-white
    hover:bg-blue-700 focus:ring-2 focus:ring-blue-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-blue-500 dark:text-white
    dark:hover:bg-blue-600 dark:focus:ring-blue-300
  "
>
  Search
</button>

        </form>

        {query.isLoading ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading users...</div>
        ) : query.isError ? (
          <div className="mt-4 rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(query.error)}
          </div>
        ) : items.length === 0 ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No users found.</div>
        ) : (
          <div className="mt-4 grid gap-4">
            {items.map((user) => {
              const roles = formatRoles(user.roles);
              const vStatus = user.verification?.status ?? null;

              return (
                <article key={user.id} className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{user.fullName}</h3>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${
                            user.isActive
                              ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                              : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300"
                          }`}
                        >
                          {user.isActive ? "Active" : "Suspended"}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getVerificationStatusClass(vStatus)}`}
                        >
                          {vStatus ?? "NO_VERIFICATION"}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{user.email}</p>
                      <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        {user.phone ? (
                          <span>📱 {user.phone} {user.phoneVerifiedAt ? '✓ Verified' : '✗ Not verified'}</span>
                        ) : (
                          <span>No phone number</span>
                        )}
                      </div>
                      <div className="mt-2 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        {roles.join(", ")} • {formatDateTime(user.createdAt)}
                      </div>
                    </div>

                   <Link
  href={`/admin/users/${user.id}`}
  className="inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors
    bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-400 shadow-md hover:shadow-lg
    disabled:cursor-not-allowed disabled:opacity-50
    dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-300"
>
  Open
</Link>


                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex gap-2">
         <button
  onClick={() => setSkip((s) => Math.max(0, s - take))}
  disabled={!hasPrevious}
  className="
    rounded-lg px-4 py-2 font-semibold
    bg-gray-200 text-gray-700
    hover:bg-gray-300 focus:ring-2 focus:ring-gray-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-gray-700 dark:text-gray-200
    dark:hover:bg-gray-600 dark:focus:ring-gray-500
  "
>
  Previous
</button>

<button
  onClick={() => setSkip((s) => s + take)}
  disabled={!hasNext}
  className="
    rounded-lg px-4 py-2 font-semibold
    bg-gray-200 text-gray-700
    hover:bg-gray-300 focus:ring-2 focus:ring-gray-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-gray-700 dark:text-gray-200
    dark:hover:bg-gray-600 dark:focus:ring-gray-500
  "
>
  Next
</button>

        </div>
      </section>
    </div>
  );
}