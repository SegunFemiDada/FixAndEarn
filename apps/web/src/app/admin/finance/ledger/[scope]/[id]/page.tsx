"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { useAdminLedgerEntry } from "@/lib/admin/ledger/queries";
import type { AdminLedgerSurroundingEntry } from "@/lib/admin/ledger/types";
import { extractApiErrorMessage } from "@/lib/admin/queries";

function formatFec(milli: number | null | undefined) {
  if (typeof milli !== "number") return "Not available";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function badgeClass(value: string | null | undefined) {
  const normalized = String(value ?? "").toUpperCase();
  if (["CREDIT", "CLEAR", "ACTIVE", "COMPLETED", "SUCCESS"].includes(normalized)) {
    return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";
  }
  if (["DEBIT"].includes(normalized)) {
    return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";
  }
  if (["PENDING", "OPEN", "FLAGGED"].includes(normalized)) {
    return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200";
  }
  return "border-[#C5D5EE] bg-[#F4F8FF] text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]";
}

function Badge({ value }: { value: string | null | undefined }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeClass(value)}`}>
      {value || "Not available"}
    </span>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#C5D5EE] bg-white shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
      <div className="border-b border-[#D9E3F1] px-5 py-4 dark:border-[#2D3F55]">
        <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7C99] dark:text-[#8FA0BC]">
        {label}
      </span>
      <span className="mt-1 block wrap-break-word text-sm leading-5 text-[#1A2B4A] dark:text-[#E8F0FA]">
        {value ?? "Not available"}
      </span>
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Not available</p>;
  }

  let text = "";
  try {
    text = JSON.stringify(value, null, 2);
  } catch {
    text = String(value);
  }

  return (
    <pre className="max-h-80 overflow-auto rounded-lg border border-[#D9E3F1] bg-[#F7F9FC] p-4 text-xs leading-5 text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#D9E3F1]">
      {text}
    </pre>
  );
}

function EntryList({
  title,
  entries,
}: {
  title: string;
  entries: AdminLedgerSurroundingEntry[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
        {title}
      </h4>
      {entries.length === 0 ? (
        <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No surrounding entries.</p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-[#D9E3F1] bg-[#F7F9FC] p-3 dark:border-[#2D3F55] dark:bg-[#16202E]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge value={entry.direction} />
                <Badge value={entry.type} />
                <span className="text-xs font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatFec(entry.amountMilliFec)}
                </span>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Field label="Entry ID" value={entry.id} />
                <Field label="Created" value={formatDate(entry.createdAt)} />
                <Field label="Reference" value={entry.reference || "Not available"} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminLedgerInvestigationPage() {
  const params = useParams<{ scope: string; id: string }>();
  const scope = params?.scope === "PLATFORM" ? "PLATFORM" : "USER";
  const entryId = typeof params?.id === "string" ? params.id : "";

  const query = useAdminLedgerEntry(scope, entryId);

  if (query.isLoading) {
    return (
      <section className="rounded-xl border border-[#C5D5EE] bg-white p-6 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Loading ledger investigation...
        </p>
      </section>
    );
  }

  if (query.isError) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-700 dark:bg-red-900/20">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-200">
          Failed to load ledger investigation
        </h2>
        <p className="mt-2 text-sm text-red-700 dark:text-red-200">
          {extractApiErrorMessage(query.error)}
        </p>
        <Link
          href="/admin/finance/ledger"
          className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#315F96] dark:bg-[#1E2A3A] dark:text-[#8FC1F2]"
        >
          Back to Ledger
        </Link>
      </section>
    );
  }

  const data = query.data;

  if (!data) {
    return (
      <section className="rounded-xl border border-[#C5D5EE] bg-white p-6 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Ledger entry not found.
        </p>
      </section>
    );
  }

  const entry = data.entry;
  const wallet = data.wallet;
  const user = data.scope === "USER" ? data.user : null;
  const related = data.related;
  const before = data.surroundingEntries.before;
  const after = data.surroundingEntries.after;
  const difference = wallet.differenceMilliFec;
  const discrepancy = difference !== 0;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-[#C5D5EE] bg-white p-5 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Finance / Ledger
            </p>
            <h2 className="mt-1 break-all text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Ledger Entry Investigation
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge value={data.scope} />
              <Badge value={entry.type} />
              <Badge value={entry.direction} />
            </div>
          </div>
          <Link
            href="/admin/finance/ledger"
            className="inline-flex shrink-0 rounded-lg border border-[#5B8FCC] px-4 py-2.5 text-sm font-semibold text-[#315F96] hover:bg-[#F4F8FF] dark:text-[#8FC1F2] dark:hover:bg-[#16202E]"
          >
            Back to Ledger
          </Link>
        </div>
      </section>

      {discrepancy ? (
        <section className="rounded-xl border border-red-300 bg-red-50 p-5 dark:border-red-700 dark:bg-red-900/20">
          <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">
            Wallet balance discrepancy detected
          </h3>
          <p className="mt-1 text-sm text-red-700 dark:text-red-200">
            The stored wallet balance differs from the balance reconstructed from ledger entries.
          </p>
          <p className="mt-3 text-lg font-semibold text-red-800 dark:text-red-200">
            Difference: {formatFec(difference)}
          </p>
        </section>
      ) : (
        <section className="rounded-xl border border-green-300 bg-green-50 p-5 dark:border-green-700 dark:bg-green-900/20">
          <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
            Wallet balance reconciles with ledger
          </h3>
          <p className="mt-1 text-sm text-green-700 dark:text-green-200">
            Stored and reconstructed balances currently match.
          </p>
        </section>
      )}

      {user ? (
        <Section title="User context">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Field label="Name" value={user.fullName} />
            <Field label="Email" value={user.email} />
            <Field label="User ID" value={user.id} />
            <Field label="Account status" value={user.isActive ? "Active" : "Inactive"} />
            <Field label="Created" value={formatDate(user.createdAt)} />
          </div>
          <Link
            href={`/admin/users/${user.id}`}
            className="mt-4 inline-flex text-sm font-semibold text-[#315F96] hover:underline dark:text-[#8FC1F2]"
          >
            Open user record
          </Link>
        </Section>
      ) : null}

      <Section title="Ledger entry">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Field label="Entry ID" value={entry.id} />
          <Field label={data.scope === "USER" ? "Wallet ID" : "Platform wallet ID"} value={entry.walletId ?? entry.platformWalletId} />
          <Field label="Type" value={<Badge value={entry.type} />} />
          <Field label="Direction" value={<Badge value={entry.direction} />} />
          <Field label="Amount" value={formatFec(entry.amountMilliFec)} />
          <Field label="Reference" value={entry.reference || "Not available"} />
          <Field label="Created" value={formatDate(entry.createdAt)} />
          <Field label="Idempotency key" value={entry.idempotencyKey || "Not available"} />
        </div>
        <div className="mt-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
            Metadata
          </h4>
          <JsonBlock value={entry.metadata} />
        </div>
      </Section>

      <Section title="Wallet balance reconciliation">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Stored balance" value={formatFec(wallet.actualBalanceMilliFec)} />
          <Field label="Ledger calculated balance" value={formatFec(wallet.calculatedBalanceMilliFec)} />
          <Field label="Difference" value={formatFec(wallet.differenceMilliFec)} />
        </div>
      </Section>

      <Section title="Surrounding ledger entries">
        <div className="grid gap-6 xl:grid-cols-2">
          <EntryList title="Entries before" entries={before} />
          <EntryList title="Entries after" entries={after} />
        </div>
      </Section>

      <Section title="Related financial records">
        <div className="space-y-6">
          {"deposit" in related ? (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Deposit
              </h4>
              <JsonBlock value={related.deposit} />
            </div>
          ) : null}

          {"withdrawal" in related ? (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Withdrawal
              </h4>
              <JsonBlock value={related.withdrawal} />
            </div>
          ) : null}

          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Job payment
            </h4>
            <JsonBlock value={related.jobPayment} />
          </div>

          {related.job ? (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Job
              </h4>
              <div className="mb-3">
                <Link
                  href={`/admin/jobs/${related.job.id}`}
                  className="text-sm font-semibold text-[#315F96] hover:underline dark:text-[#8FC1F2]"
                >
                  Open job {related.job.id}
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Field label="Status" value={<Badge value={related.job.status} />} />
                <Field label="Client" value={related.job.client?.fullName ?? related.job.clientId} />
                <Field label="Fixer" value={related.job.fixer?.fullName ?? related.job.fixerId ?? "Not assigned"} />
                <Field label="Price" value={formatFec(related.job.priceMilliFec)} />
                <Field label="Locked price" value={formatFec(related.job.lockedPriceMilliFec)} />
              </div>
            </div>
          ) : null}

          {"earnings" in related ? (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Fixer earnings
              </h4>
              <JsonBlock value={related.earnings} />
            </div>
          ) : null}

          {"platformRevenue" in related ? (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                Platform revenue
              </h4>
              <JsonBlock value={related.platformRevenue} />
            </div>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
