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
      <span className="mt-1 block break-words text-sm leading-5 text-[#1A2B4A] dark:text-[#E8F0FA]">
        {value ?? "Not available"}
      </span>
    </div>
  );
}

function formatLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function MetadataFields({
  value,
  depth = 0,
}: {
  value: unknown;
  depth?: number;
}) {
  if (value === null || value === undefined) {
    return <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Not available</p>;
  }

  if (!isRecord(value)) {
    return (
      <p className="break-words text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
        {Array.isArray(value) ? value.join(", ") : String(value)}
      </p>
    );
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No metadata available.</p>;
  }

  return (
    <div className={depth === 0 ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3 sm:grid-cols-2"}>
      {entries.map(([key, item]) => (
        <div
          key={key}
          className="min-w-0 rounded-lg border border-[#D9E3F1] bg-[#F7F9FC] p-3 dark:border-[#2D3F55] dark:bg-[#16202E]"
        >
          <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7C99] dark:text-[#8FA0BC]">
            {formatLabel(key)}
          </span>
          <div className="mt-1">
            {isRecord(item) ? (
              <MetadataFields value={item} depth={depth + 1} />
            ) : Array.isArray(item) ? (
              <p className="break-words text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                {item.length ? item.map(String).join(", ") : "None"}
              </p>
            ) : (
              <p className="break-words text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                {item === null ? "Not available" : String(item)}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function getRecordValue(record: unknown, key: string): unknown {
  if (!isRecord(record)) return null;
  return record[key];
}

function getRecordString(record: unknown, key: string) {
  const value = getRecordValue(record, key);
  return value === null || value === undefined || value === "" ? "Not available" : String(value);
}

function getRecordNumber(record: unknown, key: string): number | null {
  const value = getRecordValue(record, key);
  return typeof value === "number" ? value : null;
}

function FinancialRecord({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#D9E3F1] bg-[#F7F9FC] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
        {title}
      </h4>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalItems <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-[#D9E3F1] pt-4 dark:border-[#2D3F55] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
        Showing {start}–{end} of {totalItems}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="rounded-lg border border-[#C5D5EE] bg-white px-3 py-1.5 text-xs font-semibold text-[#315F96] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2]"
        >
          Previous
        </button>

        {pages.map((pageNumber) => (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={[
              "min-w-8 rounded-lg border px-2.5 py-1.5 text-xs font-semibold",
              pageNumber === page
                ? "border-[#5B8FCC] bg-[#5B8FCC] text-white"
                : "border-[#C5D5EE] bg-white text-[#315F96] hover:bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2] dark:hover:bg-[#16202E]",
            ].join(" ")}
          >
            {pageNumber}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="rounded-lg border border-[#C5D5EE] bg-white px-3 py-1.5 text-xs font-semibold text-[#315F96] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2]"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function EntryList({
  title,
  entries,
}: {
  title: string;
  entries: AdminLedgerSurroundingEntry[];
}) {
  const pageSize = 10;
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleEntries = entries.slice((safePage - 1) * pageSize, safePage * pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [entries]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
          {title}
        </h4>
        <span className="inline-flex rounded-full border border-[#C5D5EE] bg-[#F4F8FF] px-2.5 py-1 text-[11px] font-semibold text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]">
          {entries.length} records
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No surrounding entries.</p>
      ) : (
        <>
          <div className="space-y-2">
            {visibleEntries.map((entry) => (
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

          <PaginationControls
            page={safePage}
            totalPages={totalPages}
            totalItems={entries.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </>
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
          <MetadataFields value={entry.metadata} />
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
          {"deposit" in related && related.deposit ? (
            <FinancialRecord title="Deposit">
              <Field label="Deposit ID" value={getRecordString(related.deposit, "id")} />
              <Field label="User ID" value={getRecordString(related.deposit, "userId")} />
              <Field label="Reference" value={getRecordString(related.deposit, "reference")} />
              <Field label="Amount" value={formatFec(getRecordNumber(related.deposit, "amountMilliFec"))} />
              <Field label="Created" value={formatDate(getRecordString(related.deposit, "createdAt"))} />
            </FinancialRecord>
          ) : null}

          {"withdrawal" in related && related.withdrawal ? (
            <FinancialRecord title="Withdrawal">
              <Field label="Withdrawal ID" value={getRecordString(related.withdrawal, "id")} />
              <Field label="Amount" value={formatFec(getRecordNumber(related.withdrawal, "amountMilliFec"))} />
              <Field label="Status" value={<Badge value={getRecordString(related.withdrawal, "status")} />} />
              <Field label="Created" value={formatDate(getRecordString(related.withdrawal, "createdAt"))} />
              <Field label="Reviewed" value={formatDate(getRecordString(related.withdrawal, "reviewedAt"))} />
              <Field label="Paid" value={formatDate(getRecordString(related.withdrawal, "paidAt"))} />
              <Field label="Failure reason" value={getRecordString(related.withdrawal, "failureReason")} />
            </FinancialRecord>
          ) : null}

          {related.jobPayment ? (
            <FinancialRecord title="Job payment">
              <Field label="Payment ID" value={getRecordString(related.jobPayment, "id")} />
              <Field label="Job ID" value={getRecordString(related.jobPayment, "jobId")} />
              <Field label="Amount" value={formatFec(getRecordNumber(related.jobPayment, "amountMilliFec"))} />
              <Field label="Payment fee" value={formatFec(getRecordNumber(related.jobPayment, "paymentFeeMilliFec"))} />
              <Field label="Status" value={<Badge value={getRecordString(related.jobPayment, "status")} />} />
              <Field label="Paid" value={formatDate(getRecordString(related.jobPayment, "paidAt"))} />
              <Field label="Expires" value={formatDate(getRecordString(related.jobPayment, "expiresAt"))} />
              <Field label="Created" value={formatDate(getRecordString(related.jobPayment, "createdAt"))} />
            </FinancialRecord>
          ) : null}

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

          {"earnings" in related && related.earnings ? (
            <FinancialRecord title="Fixer earnings">
              <Field label="Earning ID" value={getRecordString(related.earnings, "id")} />
              <Field label="Fixer ID" value={getRecordString(related.earnings, "fixerId")} />
              <Field label="Job ID" value={getRecordString(related.earnings, "jobId")} />
              <Field label="Amount" value={formatFec(getRecordNumber(related.earnings, "amountMilliFec"))} />
              <Field label="Available" value={formatFec(getRecordNumber(related.earnings, "availableMilliFec"))} />
              <Field label="Status" value={<Badge value={getRecordString(related.earnings, "status")} />} />
              <Field label="Paid" value={formatDate(getRecordString(related.earnings, "paidAt"))} />
              <Field label="Created" value={formatDate(getRecordString(related.earnings, "createdAt"))} />
            </FinancialRecord>
          ) : null}

          {"platformRevenue" in related && related.platformRevenue ? (
            <FinancialRecord title="Platform revenue">
              <Field label="Revenue ID" value={getRecordString(related.platformRevenue, "id")} />
              <Field label="Job ID" value={getRecordString(related.platformRevenue, "jobId")} />
              <Field label="Gross" value={formatFec(getRecordNumber(related.platformRevenue, "grossMilliFec"))} />
              <Field label="Platform fee" value={formatFec(getRecordNumber(related.platformRevenue, "platformFeeMilliFec"))} />
              <Field label="Created" value={formatDate(getRecordString(related.platformRevenue, "createdAt"))} />
            </FinancialRecord>
          ) : null}
        </div>
      </Section>
    </div>
  );
}
