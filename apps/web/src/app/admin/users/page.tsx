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

const ROLE_OPTIONS: Array<{
  label: string;
  value: AdminSearchRole;
}> = [
  { label: "All roles", value: "" },
  { label: "Client", value: "CLIENT" },
  { label: "Fixer", value: "FIXER" },
];

const VERIFICATION_OPTIONS: Array<{
  label: string;
  value: "" | VerificationStatus;
}> = [
  { label: "All verification", value: "" },
  { label: "Approved", value: "APPROVED" },
  { label: "Pending", value: "PENDING" },
  { label: "Rejected", value: "REJECTED" },
];

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatRoles(
  roles: Array<{ role: { code: UserRoleCode } }>,
) {
  return roles.map((role) => role.role.code);
}

function verificationBadgeClass(
  status: VerificationStatus | null | undefined,
) {
  switch (status) {
    case "APPROVED":
      return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";

    case "PENDING":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200";

    case "REJECTED":
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";

    default:
      return "border-[#C5D5EE] bg-[#F4F8FF] text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]";
  }
}

function accountBadgeClass(isActive: boolean) {
  return isActive
    ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
    : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";
}

function RoleBadge({ role }: { role: UserRoleCode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#C5D5EE] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#516786] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#AAB9D0]">
      {role}
    </span>
  );
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
        verificationStatus === ""
          ? undefined
          : verificationStatus,
      skip,
      take,
    },
    true,
  );

  const items = query.data ?? [];

  const hasPrevious = skip > 0;
  const hasNext = items.length === take;

  const pageNumber = Math.floor(skip / take) + 1;

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();

    setSkip(0);
    setSearchTerm(searchInput.trim());
  }

  function resetFilters() {
    setSearchInput("");
    setSearchTerm("");
    setRole("");
    setVerificationStatus("");
    setSkip(0);
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <section className="rounded-xl border border-[#C5D5EE] bg-white px-5 py-5 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Administration
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA]">
              User Management
            </h2>

            <p className="mt-1 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Search accounts, review verification state, inspect account
              status, and open the full user record.
            </p>
          </div>

          <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Page{" "}
            <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {pageNumber}
            </span>
          </div>
        </div>
      </section>

      {/* Search / filters */}
      <section className="rounded-xl border border-[#C5D5EE] bg-white shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <form
          onSubmit={handleSearchSubmit}
          className="grid gap-3 p-4 xl:grid-cols-[minmax(320px,1fr)_190px_210px_auto_auto]"
        >
          <div>
            <label
              htmlFor="admin-users-search"
              className="block text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]"
            >
              Search users
            </label>

            <input
              id="admin-users-search"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Name, email, or User ID"
              className="mt-1 w-full rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3.5 py-2.5 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#5D718F]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-users-role"
              className="block text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]"
            >
              Role
            </label>

            <select
              id="admin-users-role"
              value={role}
              onChange={(event) => {
                setRole(
                  event.target.value as AdminSearchRole,
                );
                setSkip(0);
              }}
              className="mt-1 w-full rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3.5 py-2.5 text-sm text-[#1A2B4A] outline-none transition focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            >
              {ROLE_OPTIONS.map((option) => (
                <option
                  key={option.label}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="admin-users-verification"
              className="block text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]"
            >
              Verification
            </label>

            <select
              id="admin-users-verification"
              value={verificationStatus}
              onChange={(event) => {
                setVerificationStatus(
                  event.target.value as
                    | ""
                    | VerificationStatus,
                );
                setSkip(0);
              }}
              className="mt-1 w-full rounded-lg border border-[#C5D5EE] bg-[#F8FAFD] px-3.5 py-2.5 text-sm text-[#1A2B4A] outline-none transition focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            >
              {VERIFICATION_OPTIONS.map((option) => (
                <option
                  key={option.label}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="self-end rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Search
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="self-end rounded-lg border border-[#C5D5EE] bg-white px-4 py-2.5 text-sm font-semibold text-[#516786] transition-colors hover:bg-[#F4F8FF] focus:outline-none focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#AAB9D0] dark:hover:bg-[#243247]"
          >
            Reset
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D9E3F1] px-4 py-3 text-xs text-[#6B7C99] dark:border-[#2D3F55] dark:text-[#8FA0BC]">
          <span>
            Showing up to{" "}
            <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {take}
            </span>{" "}
            records per page
          </span>

          {(searchTerm || role || verificationStatus) && (
            <span className="font-medium text-[#315F96] dark:text-[#8FC1F2]">
              Filters active
            </span>
          )}
        </div>
      </section>

      {/* User table */}
      <section className="overflow-hidden rounded-xl border border-[#C5D5EE] bg-white shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        {query.isLoading ? (
          <div className="px-5 py-10 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading users...
          </div>
        ) : query.isError ? (
          <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            {extractApiErrorMessage(query.error)}
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-10 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No users found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-295 w-full border-collapse text-left">
                <thead className="bg-[#F4F7FB] dark:bg-[#16202E]">
                  <tr className="border-b border-[#D9E3F1] dark:border-[#2D3F55]">
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      User
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Role
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Verification
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Account
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Phone
                    </th>

                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Created
                    </th>

                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2D3F55]">
                  {items.map((user) => {
                    const roles = formatRoles(user.roles);

                    const verification =
                      user.verification?.status ?? null;

                    return (
                      <tr
                        key={user.id}
                        className="bg-white transition-colors hover:bg-[#F8FAFD] dark:bg-[#1E2A3A] dark:hover:bg-[#243247]"
                      >
                        {/* User */}
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-70">
                            <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {user.fullName}
                            </div>

                            <div className="mt-1 text-sm text-[#516786] dark:text-[#AAB9D0]">
                              {user.email}
                            </div>

                            <div className="mt-1 break-all font-mono text-[11px] text-[#7B8CA6] dark:text-[#7185A2]">
                              {user.id}
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-4 align-top">
                          <div className="flex min-w-32.5 flex-wrap gap-1.5">
                            {roles.length > 0 ? (
                              roles.map((userRole) => (
                                <RoleBadge
                                  key={userRole}
                                  role={userRole}
                                />
                              ))
                            ) : (
                              <span className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                                None
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Verification */}
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-35">
                            <span
                              className={[
                                "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                                verificationBadgeClass(
                                  verification,
                                ),
                              ].join(" ")}
                            >
                              {verification ?? "NO VERIFICATION"}
                            </span>
                          </div>
                        </td>

                        {/* Account */}
                        <td className="px-4 py-4 align-top">
                          <span
                            className={[
                              "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                              accountBadgeClass(user.isActive),
                            ].join(" ")}
                          >
                            {user.isActive
                              ? "ACTIVE"
                              : "SUSPENDED"}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-42.5">
                            {user.phone ? (
                              <>
                                <div className="text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                                  {user.phone}
                                </div>

                                <div
                                  className={[
                                    "mt-1 text-[11px] font-semibold",
                                    user.phoneVerifiedAt
                                      ? "text-green-700 dark:text-green-300"
                                      : "text-amber-700 dark:text-amber-300",
                                  ].join(" ")}
                                >
                                  {user.phoneVerifiedAt
                                    ? "Verified"
                                    : "Not verified"}
                                </div>
                              </>
                            ) : (
                              <span className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                                Not provided
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created */}
                        <td className="px-4 py-4 align-top">
                          <span className="whitespace-nowrap text-sm text-[#516786] dark:text-[#AAB9D0]">
                            {formatDateTime(user.createdAt)}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-4 text-right align-top">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-[#B7C9E3] bg-white px-3.5 py-2 text-sm font-semibold text-[#315F96] transition-colors hover:bg-[#EEF4FC] focus:outline-none focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#3A506B] dark:bg-[#1E2A3A] dark:text-[#8FC1F2] dark:hover:bg-[#243247]"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[#D9E3F1] px-4 py-3 dark:border-[#2D3F55]">
              <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                Page{" "}
                <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {pageNumber}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSkip((current) =>
                      Math.max(0, current - take),
                    )
                  }
                  disabled={!hasPrevious}
                  className="rounded-lg border border-[#C5D5EE] bg-white px-3 py-2 text-sm font-semibold text-[#516786] transition-colors hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#AAB9D0] dark:hover:bg-[#243247]"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSkip((current) => current + take)
                  }
                  disabled={!hasNext}
                  className="rounded-lg border border-[#C5D5EE] bg-white px-3 py-2 text-sm font-semibold text-[#516786] transition-colors hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#AAB9D0] dark:hover:bg-[#243247]"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}