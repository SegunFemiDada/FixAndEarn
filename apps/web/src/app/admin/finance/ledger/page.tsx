"use client";

import Link from "next/link";
import * as React from "react";
import { useAdminLedgerList } from "@/lib/admin/ledger/queries";
import type {
  AdminLedgerDirection,
  AdminLedgerSearchParams,
  AdminLedgerScope,
  AdminLedgerType,
} from "@/lib/admin/ledger/types";

const TYPE_OPTIONS: Array<{ label: string; value: "" | AdminLedgerType }> = [
  { label: "All ledger types", value: "" },
  { label: "Deposit", value: "DEPOSIT" },
  { label: "Withdrawal request", value: "WITHDRAWAL_REQUEST" },
  { label: "Withdrawal approved", value: "WITHDRAWAL_APPROVED" },
  { label: "Withdrawal rejected", value: "WITHDRAWAL_REJECTED" },
  { label: "Job payment", value: "JOB_PAYMENT" },
  { label: "Job payout", value: "JOB_PAYOUT" },
  { label: "Commission", value: "COMMISSION" },
  { label: "Adjustment", value: "ADJUSTMENT" },
  { label: "Fee", value: "FEE" },
];

const DIRECTION_OPTIONS: Array<{
  label: string;
  value: "" | AdminLedgerDirection;
}> = [
  { label: "All directions", value: "" },
  { label: "Credit", value: "CREDIT" },
  { label: "Debit", value: "DEBIT" },
];

const ROLE_OPTIONS = [
  { label: "All wallet roles", value: "" },
  { label: "Client", value: "CLIENT" },
  { label: "Fixer", value: "FIXER" },
] as const;

function formatFec(milli: number | null | undefined) {
  if (typeof milli !== "number") return "—";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function directionClass(direction: AdminLedgerDirection) {
  return direction === "CREDIT"
    ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
    : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";
}

function StatusBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex rounded-full border border-[#C5D5EE] bg-[#F4F8FF] px-2.5 py-1 text-[11px] font-semibold text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]">
      {value}
    </span>
  );
}

export default function AdminLedgerPage() {
  const [scope, setScope] = React.useState<AdminLedgerScope>("USER");
  const [userIdInput, setUserIdInput] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [referenceInput, setReferenceInput] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [walletRole, setWalletRole] = React.useState<"" | "CLIENT" | "FIXER">("");
  const [type, setType] = React.useState<"" | AdminLedgerType>("");
  const [direction, setDirection] = React.useState<"" | AdminLedgerDirection>("");
  const [skip, setSkip] = React.useState(0);

  const take = 20;

  const query = useAdminLedgerList({
    scope,
    userId: scope === "USER" ? userId || undefined : undefined,
    walletRole: scope === "USER" ? walletRole || undefined : undefined,
    type: type || undefined,
    direction: direction || undefined,
    reference: reference || undefined,
    skip,
    take,
  } satisfies AdminLedgerSearchParams);

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const hasPrevious = skip > 0;
  const hasNext = skip + take < total;
  const pageNumber = Math.floor(skip / take) + 1;
  const totalPages = Math.max(1, Math.ceil(total / take));
  const firstItem = total === 0 ? 0 : skip + 1;
  const lastItem = Math.min(skip + take, total);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    setSkip(0);
    setUserId(userIdInput.trim());
    setReference(referenceInput.trim());
  }

  function changeScope(nextScope: AdminLedgerScope) {
    setScope(nextScope);
    setSkip(0);
    setUserId("");
    setUserIdInput("");
    setReference("");
    setReferenceInput("");
    setWalletRole("");
  }

  function goToPreviousPage() {
    if (hasPrevious) setSkip(Math.max(0, skip - take));
  }

  function goToNextPage() {
    if (hasNext) setSkip(skip + take);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
          Finance
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          Ledger Investigation
        </h2>
        <p className="mt-2 max-w-4xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Investigate user and platform ledger entries, trace financial references,
          and compare stored wallet balances with balances reconstructed from ledger activity.
        </p>
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
          Investigation only. This area does not provide controls for manually changing
          balances or ledger records.
        </div>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] bg-white p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] sm:p-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {(["USER", "PLATFORM"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => changeScope(option)}
              className={[
                "rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors",
                scope === option
                  ? "border-[#5B8FCC] bg-[#5B8FCC] text-white"
                  : "border-[#C5D5EE] bg-white text-[#1A2B4A] hover:bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]",
              ].join(" ")}
            >
              {option === "USER" ? "User Ledger" : "Platform Ledger"}
            </button>
          ))}
        </div>

        <form
          onSubmit={submitSearch}
          className="grid gap-4 border-b border-[#C5D5EE] pb-5 dark:border-[#2D3F55] lg:grid-cols-[minmax(260px,1fr)_190px_190px_190px_auto]"
        >
          {scope === "USER" ? (
            <div>
              <label
                htmlFor="ledger-user-id"
                className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
              >
                User ID
              </label>
              <input
                id="ledger-user-id"
                value={userIdInput}
                onChange={(event) => setUserIdInput(event.target.value)}
                placeholder="Filter by user ID"
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="ledger-reference"
                className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
              >
                Reference
              </label>
              <input
                id="ledger-reference"
                value={referenceInput}
                onChange={(event) => setReferenceInput(event.target.value)}
                placeholder="Payment or transaction reference"
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
              />
            </div>
          )}

          <select
            aria-label="Wallet role"
            value={walletRole}
            disabled={scope === "PLATFORM"}
            onChange={(event) => {
              setWalletRole(event.target.value as "" | "CLIENT" | "FIXER");
              setSkip(0);
            }}
            className="w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Ledger type"
            value={type}
            onChange={(event) => {
              setType(event.target.value as "" | AdminLedgerType);
              setSkip(0);
            }}
            className="w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Ledger direction"
            value={direction}
            onChange={(event) => {
              setDirection(event.target.value as "" | AdminLedgerDirection);
              setSkip(0);
            }}
            className="w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
          >
            {DIRECTION_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Search
          </button>
        </form>

        {scope === "USER" ? (
          <div className="mt-4">
            <label
              htmlFor="ledger-reference-user"
              className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
            >
              Reference
            </label>
            <input
              id="ledger-reference-user"
              value={referenceInput}
              onChange={(event) => setReferenceInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  setSkip(0);
                  setUserId(userIdInput.trim());
                  setReference(referenceInput.trim());
                }
              }}
              placeholder="Payment, withdrawal, or transaction reference"
              className="mt-1 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
            />
          </div>
        ) : null}

        {query.isLoading ? (
          <div className="py-8 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading ledger entries...
          </div>
        ) : query.isError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            Failed to load ledger entries.
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No ledger entries found.
          </div>
        ) : (
          <>
            <div className="mt-5 overflow-hidden rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55]">
              <div className="overflow-x-auto">
                <table className="min-w-250 w-full border-collapse text-left">
                  <thead className="bg-[#EEF4FC] dark:bg-[#1A2636]">
                    <tr className="border-b border-[#C5D5EE] dark:border-[#2D3F55]">
                      {[
                        "Created",
                        "Entry",
                        "User",
                        "Wallet",
                        "Type",
                        "Direction",
                        "Amount",
                        "Reference",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#516786] dark:text-[#AAB9D0]"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9E3F1] dark:divide-[#2D3F55]">
                    {items.map((entry) => (
                      <tr
                        key={entry.id}
                        className="bg-white transition-colors hover:bg-[#F4F8FF] dark:bg-[#1E2A3A] dark:hover:bg-[#243247]"
                      >
                        <td className="px-4 py-4 align-top whitespace-nowrap text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatDate(entry.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-45">
                            <div className="break-all text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                              {entry.id}
                            </div>
                            <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                              {entry.walletId}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          {entry.user ? (
                            <div className="min-w-45">
                              <Link
                                href={`/admin/users/${entry.user.id}`}
                                className="font-semibold text-[#315F96] hover:underline dark:text-[#8FC1F2]"
                              >
                                {entry.user.fullName}
                              </Link>
                              <div className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                                {entry.user.email}
                              </div>
                              <div className="mt-1 text-[11px] text-[#6B7C99] dark:text-[#8FA0BC]">
                                {entry.user.id}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                              Platform
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <StatusBadge value={entry.walletRole} />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${directionClass(
                              entry.direction,
                            )}`}
                          >
                            {entry.direction}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top whitespace-nowrap text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatFec(entry.amountMilliFec)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="max-w-55 break-all text-xs text-[#516786] dark:text-[#AAB9D0]">
                            {entry.reference || "—"}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top text-right">
                          <Link
                            href={`/admin/finance/ledger/${entry.scope}/${entry.id}`}
                            className="inline-flex rounded-lg border border-[#5B8FCC] px-3 py-2 text-xs font-semibold text-[#315F96] hover:bg-[#F4F8FF] dark:text-[#8FC1F2] dark:hover:bg-[#16202E]"
                          >
                            Investigate
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 border-t border-[#D9E3F1] pt-4 dark:border-[#2D3F55] sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                Showing {firstItem}–{lastItem} of {total} ledger entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={!hasPrevious}
                  className="rounded-lg border border-[#C5D5EE] px-3 py-2 text-xs font-semibold text-[#315F96] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2D3F55] dark:text-[#8FC1F2]"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-[#516786] dark:text-[#AAB9D0]">
                  Page {pageNumber} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={!hasNext}
                  className="rounded-lg border border-[#C5D5EE] px-3 py-2 text-xs font-semibold text-[#315F96] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2D3F55] dark:text-[#8FC1F2]"
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
