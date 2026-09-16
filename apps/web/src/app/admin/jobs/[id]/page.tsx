"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import {
  useAdminFlagJob,
  useAdminJobDetail,
  useAdminUnflagJob,
} from "@/lib/admin/jobs/queries";
import type { AdminJobStatus } from "@/lib/admin/jobs/types";

function formatFec(milli: number | null | undefined) {
  if (typeof milli !== "number") return "—";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

function formatDate(value: string | null | undefined) {
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

function statusClass(status: AdminJobStatus | string) {
  switch (status) {
    case "OPEN":
      return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";

    case "IN_PROGRESS":
      return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-200";

    case "COMPLETED":
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200";

    case "DISPUTED":
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";

    case "DRAFT":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200";

    default:
      return "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200";
  }
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
  breakAll = false,
}: {
  label: string;
  value: React.ReactNode;
  breakAll?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B7C99] dark:text-[#8FA0BC]">
        {label}
      </p>

      <div
        className={[
          "mt-1 text-sm leading-5 text-[#1A2B4A] dark:text-[#E8F0FA]",
          breakAll ? "break-all" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function AdminJobInvestigationPage() {
  const params = useParams<{ id: string }>();
  const jobId = typeof params?.id === "string" ? params.id : "";

  const query = useAdminJobDetail(jobId, Boolean(jobId));
  const job = query.data;

  const flagMutation = useAdminFlagJob();
  const unflagMutation = useAdminUnflagJob();

  const [flagReason, setFlagReason] = React.useState("");
  const [showFlagForm, setShowFlagForm] = React.useState(false);

  const moderationBusy =
    flagMutation.isPending || unflagMutation.isPending;

  async function handleFlag() {
    const reason = flagReason.trim();

    if (!reason) {
      return;
    }

    await flagMutation.mutateAsync({
      id: jobId,
      reason,
    });

    setFlagReason("");
    setShowFlagForm(false);
  }

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-[#C5D5EE] bg-white p-6 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading job investigation...
          </p>
        </section>
      </div>
    );
  }

  if (query.isError || !job) {
    return (
      <div className="space-y-6">
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-700 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-200">
            Job not found
          </h2>

          <p className="mt-2 text-sm text-red-700 dark:text-red-200">
            The requested job could not be loaded from the admin service.
          </p>

          <Link
            href="/admin/jobs"
            className="mt-4 inline-flex rounded-lg bg-gray-200 px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            Back to Job Management
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-[#C5D5EE] bg-white p-5 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                Job Investigation
              </span>

              <StatusBadge className={statusClass(job.status)}>
                {job.status}
              </StatusBadge>

              <StatusBadge className="border-[#C5D5EE] bg-[#F4F8FF] text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]">
                {job.postingType}
              </StatusBadge>

              <StatusBadge
                className={
                  job.moderationStatus === "FLAGGED"
                    ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200"
                    : "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                }
              >
                {job.moderationStatus === "FLAGGED"
                  ? "FLAGGED"
                  : "CLEAR"}
              </StatusBadge>
            </div>

            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA]">
              {job.skillCategory}
            </h2>

            <p className="mt-1 break-all font-mono text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
              {job.id}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/jobs"
              className="inline-flex items-center justify-center rounded-lg border border-[#C5D5EE] bg-white px-4 py-2 text-sm font-semibold text-[#315F96] transition-colors hover:bg-[#F4F8FF] dark:border-[#3A506B] dark:bg-[#1E2A3A] dark:text-[#8FC1F2] dark:hover:bg-[#243247]"
            >
              Back to Jobs
            </Link>

            {job.moderationStatus === "FLAGGED" ? (
              <button
                type="button"
                disabled={moderationBusy}
                onClick={() => unflagMutation.mutate(jobId)}
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-green-500 dark:hover:bg-green-600"
              >
                {unflagMutation.isPending
                  ? "Clearing flag..."
                  : "Unflag Job"}
              </button>
            ) : (
              <button
                type="button"
                disabled={moderationBusy}
                onClick={() =>
                  setShowFlagForm((current) => !current)
                }
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-red-500 dark:hover:bg-red-600"
              >
                Flag Job
              </button>
            )}
          </div>
        </div>

        {showFlagForm && job.moderationStatus !== "FLAGGED" && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
            <label className="block text-sm font-semibold text-red-800 dark:text-red-200">
              Moderation reason
            </label>

            <textarea
              value={flagReason}
              onChange={(event) => setFlagReason(event.target.value)}
              rows={4}
              placeholder="Explain why this job violates FixAndEarn policy."
              className="mt-2 w-full rounded-xl border border-red-200 bg-white px-3 py-3 text-sm text-[#1A2B4A] outline-none focus:border-red-400 focus:ring-2 focus:ring-red-300/30 dark:border-red-700 dark:bg-[#1E2A3A] dark:text-[#E8F0FA]"
            />

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={moderationBusy || !flagReason.trim()}
                onClick={handleFlag}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-600"
              >
                {flagMutation.isPending
                  ? "Flagging..."
                  : "Confirm Flag"}
              </button>

              <button
                type="button"
                disabled={moderationBusy}
                onClick={() => {
                  setShowFlagForm(false);
                  setFlagReason("");
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>

            {flagMutation.isError && (
              <p className="mt-3 text-sm text-red-700 dark:text-red-200">
                Unable to flag this job. Please try again.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Operational summary */}
      <section className="overflow-hidden rounded-xl border border-[#C5D5EE] bg-white shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <div className="grid grid-cols-2 divide-x divide-[#D9E3F1] divide-y dark:divide-[#2D3F55] md:grid-cols-5 md:divide-y-0">
          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Listed price
            </p>
            <p className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {formatFec(job.priceMilliFec)}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Locked price
            </p>
            <p className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {formatFec(job.lockedPriceMilliFec)}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Applications
            </p>
            <p className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {job.applications.length}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Payments
            </p>
            <p className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {job.payments.length}
            </p>
          </div>

          <div className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Conversations
            </p>
            <p className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {job.conversations.length}
            </p>
          </div>
        </div>
      </section>

      {/* Job Overview */}
      <Section title="Job Overview">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Job ID" value={job.id} breakAll />

          <Field
            label="Skill category"
            value={job.skillCategory}
          />

          <Field label="Posting type" value={job.postingType} />

          <Field
            label="Status"
            value={
              <StatusBadge className={statusClass(job.status)}>
                {job.status}
              </StatusBadge>
            }
          />

          <Field
            label="Listed price"
            value={formatFec(job.priceMilliFec)}
          />

          <Field
            label="Locked price"
            value={formatFec(job.lockedPriceMilliFec)}
          />

          <Field
            label="Created"
            value={formatDate(job.createdAt)}
          />

          <Field
            label="Updated"
            value={formatDate(job.updatedAt)}
          />

          <Field label="State" value={job.state} />

          <Field label="City" value={job.city} />

          <Field
            label="LGA"
            value={job.lga ?? "Not provided"}
          />

          <Field
            label="Area"
            value={job.area ?? "Not provided"}
          />

          <Field
            label="Completion requested"
            value={formatDate(job.completedRequestedAt)}
          />

          <Field
            label="Completion approved"
            value={formatDate(job.completedApprovedAt)}
          />

          <Field
            label="Selected conversation"
            value={job.selectedConversationId ?? "Not selected"}
            breakAll
          />
        </div>
      </Section>

      {/* Moderation */}
      <Section title="Moderation">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Moderation status"
            value={
              <StatusBadge
                className={
                  job.moderationStatus === "FLAGGED"
                    ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200"
                    : "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                }
              >
                {job.moderationStatus}
              </StatusBadge>
            }
          />

          <Field
            label="Flagged at"
            value={formatDate(job.flaggedAt)}
          />

          <Field
            label="Flagged by admin"
            value={job.flaggedByAdminId ?? "Not flagged"}
            breakAll
          />

          <div className="sm:col-span-2 lg:col-span-4">
            <Field
              label="Flag reason"
              value={
                job.flagReason?.trim()
                  ? job.flagReason
                  : "No moderation flag."
              }
            />
          </div>
        </div>
      </Section>

      {/* Parties */}
      <Section title="Parties">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-[#D9E3F1] bg-[#F8FAFD] p-5 dark:border-[#2D3F55] dark:bg-[#16202E]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Client
              </p>

              <StatusBadge
                className={
                  job.client.isActive
                    ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                    : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200"
                }
              >
                {job.client.isActive ? "ACTIVE" : "SUSPENDED"}
              </StatusBadge>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Name"
                value={job.client.fullName}
              />

              <Field
                label="Email"
                value={job.client.email}
                breakAll
              />

              <Field
                label="Phone"
                value={job.client.phone ?? "Not available"}
              />

              <Field
                label="User ID"
                value={job.client.id}
                breakAll
              />
            </div>
          </div>

          <div className="rounded-xl border border-[#D9E3F1] bg-[#F8FAFD] p-5 dark:border-[#2D3F55] dark:bg-[#16202E]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Assigned fixer
              </p>

              {job.fixer && (
                <StatusBadge
                  className={
                    job.fixer.isActive
                      ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                      : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200"
                  }
                >
                  {job.fixer.isActive ? "ACTIVE" : "SUSPENDED"}
                </StatusBadge>
              )}
            </div>

            {job.fixer ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={job.fixer.fullName}
                />

                <Field
                  label="Email"
                  value={job.fixer.email}
                  breakAll
                />

                <Field
                  label="Phone"
                  value={job.fixer.phone ?? "Not available"}
                />

                <Field
                  label="User ID"
                  value={job.fixer.id}
                  breakAll
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                No fixer assigned.
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* Applications */}
      <Section title={`Applications (${job.applications.length})`}>
        {job.applications.length === 0 ? (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No applications recorded.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#D9E3F1] dark:border-[#2D3F55]">
            <table className="min-w-205 w-full border-collapse text-left">
              <thead className="bg-[#F4F7FB] dark:bg-[#16202E]">
                <tr className="border-b border-[#D9E3F1] dark:border-[#2D3F55]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Fixer
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Email
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Applied
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Note
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2D3F55]">
                {job.applications.map((application) => (
                  <tr
                    key={application.id}
                    className="bg-white dark:bg-[#1E2A3A]"
                  >
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {application.fixer.fullName}
                      </p>
                    </td>

                    <td className="max-w-60 px-4 py-4 align-top">
                      <p className="break-all text-sm text-[#516786] dark:text-[#AAB9D0]">
                        {application.fixer.email}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <StatusBadge className="border-[#C5D5EE] bg-[#F4F8FF] text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]">
                        {application.status}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-4 align-top whitespace-nowrap text-sm text-[#516786] dark:text-[#AAB9D0]">
                      {formatDate(application.createdAt)}
                    </td>

                    <td className="max-w-90 px-4 py-4 align-top">
                      <p className="whitespace-pre-wrap text-sm leading-5 text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {application.note?.trim()
                          ? application.note
                          : "No note provided."}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Conversations / Negotiations */}
      <Section
        title={`Conversations & Negotiations (${job.conversations.length})`}
      >
        {job.conversations.length === 0 ? (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No conversations recorded.
          </p>
        ) : (
          <div className="space-y-4">
            {job.conversations.map((conversation) => (
              <article
                key={conversation.id}
                className="rounded-xl border border-[#D9E3F1] bg-[#F8FAFD] p-5 dark:border-[#2D3F55] dark:bg-[#16202E]"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {conversation.fixer.fullName}
                      </p>

                      <StatusBadge className="border-[#C5D5EE] bg-white text-[#516786] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#AAB9D0]">
                        {conversation.status}
                      </StatusBadge>

                      <StatusBadge
                        className={
                          conversation.active
                            ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                            : "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                        }
                      >
                        {conversation.active ? "ACTIVE" : "INACTIVE"}
                      </StatusBadge>
                    </div>

                    <p className="mt-1 break-all font-mono text-[11px] text-[#6B7C99] dark:text-[#8FA0BC]">
                      {conversation.id}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-right sm:grid-cols-4">
                    <Field
                      label="Messages"
                      value={conversation._count.messages}
                    />

                    <Field
                      label="Agreements"
                      value={conversation._count.agreements}
                    />

                    <Field
                      label="Created"
                      value={formatDate(conversation.createdAt)}
                    />

                    <Field
                      label="Updated"
                      value={formatDate(conversation.updatedAt)}
                    />
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-[#D9E3F1] bg-white p-4 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      Negotiation
                    </p>

                    {conversation.negotiation && (
                      <StatusBadge className="border-[#C5D5EE] bg-[#F4F8FF] text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]">
                        {conversation.negotiation.status}
                      </StatusBadge>
                    )}
                  </div>

                  {conversation.negotiation ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      <Field
                        label="Proposed price"
                        value={formatFec(
                          conversation.negotiation
                            .proposedPriceMilliFec,
                        )}
                      />

                      <Field
                        label="Locked price"
                        value={formatFec(
                          conversation.negotiation
                            .lockedPriceMilliFec,
                        )}
                      />

                      <Field
                        label="Locked by"
                        value={
                          conversation.negotiation
                            .lockedByUserId ?? "Not available"
                        }
                        breakAll
                      />

                      <Field
                        label="Client accepted"
                        value={formatDate(
                          conversation.negotiation
                            .clientAcceptedAt,
                        )}
                      />

                      <Field
                        label="Fixer accepted"
                        value={formatDate(
                          conversation.negotiation
                            .fixerAcceptedAt,
                        )}
                      />

                      <Field
                        label="Agreed at"
                        value={formatDate(
                          conversation.negotiation.agreedAt,
                        )}
                      />

                      <Field
                        label="Rejected at"
                        value={formatDate(
                          conversation.negotiation.rejectedAt,
                        )}
                      />

                      <Field
                        label="Rejected by"
                        value={
                          conversation.negotiation
                            .rejectedByUserId ?? "Not available"
                        }
                        breakAll
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                      No negotiation record for this conversation.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      {/* Payments */}
      <Section title={`Payments (${job.payments.length})`}>
        {job.payments.length === 0 ? (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No job payments recorded.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[#D9E3F1] dark:border-[#2D3F55]">
            <table className="min-w-262.5 w-full border-collapse text-left">
              <thead className="bg-[#F4F7FB] dark:bg-[#16202E]">
                <tr className="border-b border-[#D9E3F1] dark:border-[#2D3F55]">
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Type
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Provider fee
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#2D3F55]">
                {job.payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="bg-white dark:bg-[#1E2A3A]"
                  >
                    <td className="px-4 py-4 align-top">
                      <StatusBadge className="border-[#C5D5EE] bg-[#F4F8FF] text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]">
                        {payment.type}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-4 align-top">
                      <StatusBadge
                        className={
                          payment.status === "PAID"
                            ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                            : payment.status === "FAILED"
                              ? "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200"
                              : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200"
                        }
                      >
                        {payment.status}
                      </StatusBadge>
                    </td>

                    <td className="px-4 py-4 align-top whitespace-nowrap text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {formatFec(payment.amountMilliFec)}
                    </td>

                    <td className="px-4 py-4 align-top whitespace-nowrap text-sm text-[#516786] dark:text-[#AAB9D0]">
                      {formatFec(payment.paymentFeeMilliFec)}
                    </td>

                    <td className="max-w-65 px-4 py-4 align-top">
                      <p className="break-all font-mono text-xs text-[#516786] dark:text-[#AAB9D0]">
                        {payment.paymentReference}
                      </p>
                    </td>

                    <td className="px-4 py-4 align-top whitespace-nowrap text-sm text-[#516786] dark:text-[#AAB9D0]">
                      {formatDate(payment.paidAt)}
                    </td>

                    <td className="px-4 py-4 align-top whitespace-nowrap text-sm text-[#516786] dark:text-[#AAB9D0]">
                      {formatDate(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {job.payments.length > 0 && (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {job.payments.map((payment) => (
              <div
                key={`${payment.id}-meta`}
                className="rounded-lg border border-[#D9E3F1] bg-[#F8FAFD] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  {payment.type} details
                </p>

                <div className="mt-3 space-y-3">
                  <Field
                    label="Expires at"
                    value={formatDate(payment.expiresAt)}
                  />

                  <Field
                    label="Conversation ID"
                    value={
                      payment.conversationId ??
                      "Not applicable"
                    }
                    breakAll
                  />

                  <Field
                    label="Fixer ID"
                    value={
                      payment.fixerId ?? "Not assigned"
                    }
                    breakAll
                  />

                  <Field
                    label="Locked price"
                    value={formatFec(
                      payment.lockedPriceMilliFec,
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Completion */}
      <Section title="Completion">
        {job.completionRequest ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Status"
              value={job.completionRequest.status}
            />

            <Field
              label="Fixer"
              value={job.completionRequest.fixerId}
              breakAll
            />

            <Field
              label="Requested at"
              value={formatDate(
                job.completionRequest.requestedAt,
              )}
            />

            <Field
              label="Reviewed at"
              value={formatDate(
                job.completionRequest.reviewedAt,
              )}
            />

            <Field
              label="Reviewed by client"
              value={
                job.completionRequest.reviewedByClientId ??
                "Not reviewed"
              }
              breakAll
            />

            <div className="sm:col-span-2 lg:col-span-3">
              <Field
                label="Review note"
                value={
                  job.completionRequest.reviewNote?.trim()
                    ? job.completionRequest.reviewNote
                    : "No review note."
                }
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No completion request recorded.
          </p>
        )}
      </Section>

      {/* Dispute */}
      <Section title="Dispute">
        {job.dispute ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field
                label="Dispute ID"
                value={job.dispute.id}
                breakAll
              />

              <Field
                label="Status"
                value={job.dispute.status}
              />

              <Field
                label="Created"
                value={formatDate(job.dispute.createdAt)}
              />

              <Field
                label="Opened by"
                value={job.dispute.openedBy.fullName}
              />

              <Field
                label="Opened by email"
                value={job.dispute.openedBy.email}
                breakAll
              />

              <Field
                label="Resolved at"
                value={formatDate(job.dispute.resolvedAt)}
              />

              <Field
                label="Resolved by"
                value={
                  job.dispute.resolvedByAdmin
                    ? job.dispute.resolvedByAdmin.fullName
                    : "Not resolved"
                }
              />
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-700 dark:bg-red-900/20">
              <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-200">
                Reason
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-800 dark:text-red-100">
                {job.dispute.reason}
              </p>
            </div>

            {job.dispute.evidence !== null &&
              job.dispute.evidence !== undefined && (
                <div className="rounded-xl border border-[#D9E3F1] bg-[#F8FAFD] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                    Evidence
                  </p>

                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap wrap-break-word text-xs leading-5 text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {JSON.stringify(
                      job.dispute.evidence,
                      null,
                      2,
                    )}
                  </pre>
                </div>
              )}
          </div>
        ) : (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No dispute recorded.
          </p>
        )}
      </Section>

      {/* Review */}
      <Section title="Review">
        {job.review ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Rating"
              value={`${job.review.rating} / 5`}
            />

            <Field
              label="Client ID"
              value={job.review.clientId}
              breakAll
            />

            <Field
              label="Fixer ID"
              value={job.review.fixerId}
              breakAll
            />

            <Field
              label="Created"
              value={formatDate(job.review.createdAt)}
            />

            <div className="sm:col-span-2 lg:col-span-4">
              <Field
                label="Comment"
                value={
                  job.review.comment?.trim()
                    ? job.review.comment
                    : "No review comment."
                }
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No review recorded.
          </p>
        )}
      </Section>

      {/* Financial outcome */}
      <Section title="Earnings & Platform Revenue">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-[#D9E3F1] bg-[#F8FAFD] p-5 dark:border-[#2D3F55] dark:bg-[#16202E]">
            <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Fixer earnings
            </p>

            {job.earnings ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Gross earning"
                  value={formatFec(
                    job.earnings.amountMilliFec,
                  )}
                />

                <Field
                  label="Available"
                  value={formatFec(
                    job.earnings.availableMilliFec,
                  )}
                />

                <Field
                  label="Status"
                  value={job.earnings.status}
                />

                <Field
                  label="Paid at"
                  value={formatDate(job.earnings.paidAt)}
                />

                <Field
                  label="Created"
                  value={formatDate(job.earnings.createdAt)}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                No fixer earning record.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-[#D9E3F1] bg-[#F8FAFD] p-5 dark:border-[#2D3F55] dark:bg-[#16202E]">
            <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Platform revenue
            </p>

            {job.PlatformRevenue ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label="Gross"
                  value={formatFec(
                    job.PlatformRevenue.grossMilliFec,
                  )}
                />

                <Field
                  label="Platform fee"
                  value={formatFec(
                    job.PlatformRevenue.platformFeeMilliFec,
                  )}
                />

                <Field
                  label="Recorded at"
                  value={formatDate(
                    job.PlatformRevenue.createdAt,
                  )}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                No platform revenue record.
              </p>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}