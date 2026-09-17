"use client";

import * as React from "react";
import Image from "next/image";
import { useAdminUserInvestigation } from "@/lib/admin/users/queries";
import { formatFecFromMilli } from "@/lib/wallet/ui";

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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#C5D5EE] px-4 py-6 text-center dark:border-[#2D3F55]">
      <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        {text}
      </p>
    </div>
  );
}

function getVerificationVariant(
  status: string | null | undefined,
): "success" | "warning" | "danger" | "neutral" {
  switch (status) {
    case "APPROVED":
    case "VERIFIED":
      return "success";

    case "PENDING":
      return "warning";

    case "REJECTED":
    case "FAILED":
      return "danger";

    default:
      return "neutral";
  }
}

function renderDisputeEvidence(
  evidence: unknown,
): React.ReactNode {
  if (!evidence) {
    return null;
  }

  if (typeof evidence === "string") {
    return (
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
        {evidence}
      </p>
    );
  }

  if (
    typeof evidence === "object" &&
    evidence !== null &&
    "imagePath" in evidence &&
    typeof evidence.imagePath === "string" &&
    evidence.imagePath.trim()
  ) {
    const imagePath = evidence.imagePath.trim();

    return (
      <div className="mt-3 space-y-3">
        <div className="overflow-hidden rounded-lg border border-[#D9E3F1] bg-[#F8FAFD] dark:border-[#2D3F55] dark:bg-[#16202E]">
          <Image
            src={imagePath}
            alt="Dispute evidence"
            width={1600}
            height={1200}
            unoptimized
            className="max-h-105 w-full object-contain"
          />
        </div>

        <a
          href={imagePath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-lg border border-[#C5D5EE] bg-white px-3 py-2 text-xs font-semibold text-[#315F96] transition-colors hover:bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2] dark:hover:bg-[#243247]"
        >
          Open evidence
        </a>
      </div>
    );
  }

  try {
    return (
      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap wrap-break-word rounded-lg bg-[#F8FAFD] p-3 text-xs leading-5 text-[#1A2B4A] dark:bg-[#16202E] dark:text-[#E8F0FA]">
        {JSON.stringify(evidence, null, 2)}
      </pre>
    );
  } catch {
    return (
      <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        Evidence could not be displayed.
      </p>
    );
  }
}

function PaginatedList<T>({
  items,
  emptyText,
  renderItem,
  pageSize = 10,
}: {
  items: T[];
  emptyText: string;
  renderItem: (item: T, index: number) => React.ReactNode;
  pageSize?: number;
}) {
  const [page, setPage] = React.useState(1);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));

  React.useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  if (items.length === 0) {
    return <EmptyState text={emptyText} />;
  }

  const startIndex = (page - 1) * pageSize;
  const visibleItems = items.slice(startIndex, startIndex + pageSize);
  const endIndex = Math.min(startIndex + visibleItems.length, items.length);

  const pageNumbers =
    pageCount <= 5
      ? Array.from({ length: pageCount }, (_, index) => index + 1)
      : Array.from(
          new Set([
            1,
            Math.max(1, page - 1),
            page,
            Math.min(pageCount, page + 1),
            pageCount,
          ]),
        ).values();

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {visibleItems.map((item, index) =>
          renderItem(item, startIndex + index),
        )}
      </div>

      {items.length > pageSize && (
        <div className="flex flex-col gap-3 border-t border-[#D9E3F1] pt-3 dark:border-[#2D3F55] sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
            Showing {startIndex + 1}–{endIndex} of {items.length}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
              disabled={page === 1}
              className="rounded-lg border border-[#C5D5EE] bg-white px-3 py-2 text-xs font-semibold text-[#315F96] transition-colors hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2] dark:hover:bg-[#243247]"
              aria-label="Previous page"
            >
              Previous
            </button>

            {Array.from(pageNumbers).map((pageNumber, index, numbers) => {
              const previousPageNumber = numbers[index - 1];

              return (
                <React.Fragment key={pageNumber}>
                  {previousPageNumber !== undefined &&
                    pageNumber - previousPageNumber > 1 && (
                      <span className="px-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        …
                      </span>
                    )}

                  <button
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    aria-current={page === pageNumber ? "page" : undefined}
                    className={[
                      "min-w-9 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors",
                      page === pageNumber
                        ? "border-[#315F96] bg-[#315F96] text-white dark:border-[#5B8FCC] dark:bg-[#5B8FCC] dark:text-white"
                        : "border-[#C5D5EE] bg-white text-[#315F96] hover:bg-[#F4F8FF] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2] dark:hover:bg-[#243247]",
                    ].join(" ")}
                    aria-label={`Go to page ${pageNumber}`}
                  >
                    {pageNumber}
                  </button>
                </React.Fragment>
              );
            })}

            <button
              type="button"
              onClick={() =>
                setPage((currentPage) =>
                  Math.min(pageCount, currentPage + 1),
                )
              }
              disabled={page === pageCount}
              className="rounded-lg border border-[#C5D5EE] bg-white px-3 py-2 text-xs font-semibold text-[#315F96] transition-colors hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-40 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2] dark:hover:bg-[#243247]"
              aria-label="Next page"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserInvestigationPanel({
  userId,
}: {
  userId: string;
}) {
  const investigationQuery = useAdminUserInvestigation(
    userId,
    Boolean(userId),
  );

  if (investigationQuery.isLoading) {
    return (
      <Section
        title="User Investigation"
        eyebrow="History & activity"
      >
        <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Loading investigation history...
        </p>
      </Section>
    );
  }

  if (investigationQuery.isError) {
    return (
      <Section
        title="User Investigation"
        eyebrow="History & activity"
      >
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 dark:border-red-700 dark:bg-red-900/20">
          <p className="text-sm font-semibold text-red-700 dark:text-red-200">
            Failed to load investigation history.
          </p>

          <p className="mt-1 text-xs leading-5 text-red-700 dark:text-red-200">
            Please refresh the page and try again.
          </p>
        </div>
      </Section>
    );
  }

  const investigation = investigationQuery.data;

  if (!investigation) {
    return (
      <Section
        title="User Investigation"
        eyebrow="History & activity"
      >
        <EmptyState text="No investigation record was returned for this user." />
      </Section>
    );
  }

  const {
    user,
    jobsPosted,
    jobsAssigned,
    applications,
    conversations,
    reports,
    disputes,
    auditLogs,
  } = investigation;

  const verification = user.verification;

  return (
    <div className="space-y-5">
      <Section
        title="User Investigation"
        eyebrow="Investigation overview"
        action={
          <button
            type="button"
            onClick={() => investigationQuery.refetch()}
            disabled={investigationQuery.isFetching}
            className="rounded-lg border border-[#C5D5EE] bg-white px-3 py-2 text-xs font-semibold text-[#315F96] transition-colors hover:bg-[#F4F8FF] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2] dark:hover:bg-[#243247]"
          >
            {investigationQuery.isFetching
              ? "Refreshing..."
              : "Refresh history"}
          </button>
        }
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {[
            ["Jobs posted", jobsPosted.length],
            ["Jobs assigned", jobsAssigned.length],
            ["Applications", applications.length],
            ["Conversations", conversations.length],
            ["Reports", reports.length],
            ["Disputes", disputes.length],
            ["Admin actions", auditLogs.length],
            ["Deposits", user.deposits.length],
          ].map(([label, count]) => (
            <div
              key={label}
              className="rounded-lg border border-[#D9E3F1] bg-[#F8FAFD] px-3 py-3 dark:border-[#2D3F55] dark:bg-[#16202E]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                {label}
              </p>

              <p className="mt-1 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {count}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Verification investigation"
        eyebrow="Identity & compliance"
        action={
          verification ? (
            <StatusBadge
              variant={getVerificationVariant(
                verification.status,
              )}
            >
              {verification.status}
            </StatusBadge>
          ) : (
            <StatusBadge>NO RECORD</StatusBadge>
          )
        }
      >
        {!verification ? (
          <EmptyState text="No verification record exists for this user." />
        ) : (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-[#D9E3F1] bg-[#F8FAFD] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Identity verification
                </p>

                <div className="mt-2">
                  <StatusBadge
                    variant={getVerificationVariant(
                      verification.status,
                    )}
                  >
                    {verification.status}
                  </StatusBadge>
                </div>
              </div>

              <div className="rounded-lg border border-[#D9E3F1] bg-[#F8FAFD] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  NIN verification
                </p>

                <div className="mt-2">
                  <StatusBadge
                    variant={getVerificationVariant(
                      verification.ninVerificationStatus,
                    )}
                  >
                    {verification.ninVerificationStatus ??
                      "NOT AVAILABLE"}
                  </StatusBadge>
                </div>
              </div>

              <div className="rounded-lg border border-[#D9E3F1] bg-[#F8FAFD] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Force reverify
                </p>

                <div className="mt-2">
                  <StatusBadge
                    variant={
                      user.forceReverify
                        ? "warning"
                        : "neutral"
                    }
                  >
                    {user.forceReverify
                      ? "ENABLED"
                      : "NOT ENABLED"}
                  </StatusBadge>
                </div>
              </div>

              <div className="rounded-lg border border-[#D9E3F1] bg-[#F8FAFD] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                  Reviewed
                </p>

                <p className="mt-2 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {formatDateTime(
                    verification.reviewedAt,
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailField
                label="Verification ID"
                value={verification.id}
                breakAll
              />

              <DetailField
                label="Reviewed by admin ID"
                value={verification.reviewedByAdminId}
                breakAll
              />

              <DetailField
                label="NIN verified by admin ID"
                value={verification.ninVerifiedByAdminId}
                breakAll
              />

              <DetailField
                label="NIN verified at"
                value={formatDateTime(
                  verification.ninVerifiedAt,
                )}
              />

              <DetailField
                label="Created"
                value={formatDateTime(
                  verification.createdAt,
                )}
              />

              <DetailField
                label="Last updated"
                value={formatDateTime(
                  verification.updatedAt,
                )}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-[#D9E3F1] p-4 dark:border-[#2D3F55]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7C99] dark:text-[#8FA0BC]">
                  Review reason
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {verification.reviewReason ||
                    "No review reason recorded."}
                </p>
              </div>

              <div className="rounded-lg border border-[#D9E3F1] p-4 dark:border-[#2D3F55]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7C99] dark:text-[#8FA0BC]">
                  NIN verification note
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {verification.ninVerificationNote ||
                    "No NIN verification note recorded."}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                Verification queue behavior
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-700 dark:text-blue-300">
                Approved verification records leave the pending
                verification queue because the verification queue
                only contains records with a PENDING status.
              </p>
            </div>
          </div>
        )}
      </Section>

      <Section
        title="Account & financial history"
        eyebrow="Account activity"
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Account state
            </h4>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailField
                label="Account status"
                value={
                  user.isActive ? "ACTIVE" : "SUSPENDED"
                }
              />

              <DetailField
                label="Phone verification"
                value={
                  user.phoneVerifiedAt
                    ? formatDateTime(
                        user.phoneVerifiedAt,
                      )
                    : "Not verified"
                }
              />

              <DetailField
                label="Deletion request"
                value={
                  user.deletionRequestStatus ??
                  "None"
                }
              />

              <DetailField
                label="Deletion requested"
                value={formatDateTime(
                  user.deletionRequestedAt,
                )}
              />

              <DetailField
                label="Joined"
                value={formatDateTime(user.createdAt)}
              />

              <DetailField
                label="Last updated"
                value={formatDateTime(user.updatedAt)}
              />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Recent deposits
            </h4>

            <div className="mt-4">
              {user.deposits.length === 0 ? (
                <EmptyState text="No deposits found." />
              ) : (
                <div className="divide-y divide-[#E2E8F0] rounded-lg border border-[#D9E3F1] dark:divide-[#2D3F55] dark:border-[#2D3F55]">
                  <PaginatedList
                  items={user.deposits}
                  emptyText="No deposits found."
                  renderItem={(deposit) => (

                    <div
                      key={deposit.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatFecFromMilli(
                            deposit.amountMilliFec,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                          {formatDateTime(
                            deposit.createdAt,
                          )}
                        </p>
                      </div>

                      <StatusBadge
                        variant={
                          deposit.status === "SUCCESS"
                            ? "success"
                            : deposit.status === "FAILED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {deposit.status ?? "UNKNOWN"}
                      </StatusBadge>
                    </div>
                    )}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Recent withdrawals
            </h4>

            <div className="mt-4">
              {user.withdrawals.length === 0 ? (
                <EmptyState text="No withdrawals found." />
              ) : (
                <div className="divide-y divide-[#E2E8F0] rounded-lg border border-[#D9E3F1] dark:divide-[#2D3F55] dark:border-[#2D3F55]">
                  <PaginatedList
                  items={user.withdrawals}
                  emptyText="No withdrawals found."
                  renderItem={(withdrawal) => (

                    <div
                      key={withdrawal.id}
                      className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {formatFecFromMilli(
                            withdrawal.amountMilliFec,
                          )}
                        </p>

                        <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                          {formatDateTime(
                            withdrawal.createdAt,
                          )}
                        </p>

                        {withdrawal.reviewNote && (
                          <p className="mt-2 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                            {withdrawal.reviewNote}
                          </p>
                        )}
                      </div>

                      <StatusBadge
                        variant={
                          withdrawal.status === "PAID"
                            ? "success"
                            : withdrawal.status === "REJECTED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {withdrawal.status ?? "UNKNOWN"}
                      </StatusBadge>
                    </div>
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Jobs posted"
        eyebrow="Client activity"
        action={
          <StatusBadge variant="info">
            {jobsPosted.length} records
          </StatusBadge>
        }
      >
        {jobsPosted.length === 0 ? (
          <EmptyState text="This user has not posted any jobs in the returned history." />
        ) : (
          <div className="space-y-3">
            <PaginatedList
            items={jobsPosted}
            emptyText="This user has not posted any jobs in the returned history."
            renderItem={(job) => (

              <div
                key={job.id}
                className="rounded-lg border border-[#D9E3F1] p-4 dark:border-[#2D3F55]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {job.skillCategory}
                    </p>

                    <p className="mt-1 break-all font-mono text-[11px] text-[#6B7C99] dark:text-[#8FA0BC]">
                      {job.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge>
                      {job.status}
                    </StatusBadge>

                    <StatusBadge
                      variant={
                        job.moderationStatus === "APPROVED"
                          ? "success"
                          : job.moderationStatus ===
                              "REJECTED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {job.moderationStatus}
                    </StatusBadge>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailField
                    label="Location"
                    value={[
                      job.area,
                      job.city,
                      job.state,
                    ]
                      .filter(Boolean)
              .join(", ")}
            />

                  <DetailField
                    label="LGA"
                    value={job.lga}
                  />

                  <DetailField
                    label="Price"
                    value={formatFecFromMilli(
                      job.lockedPriceMilliFec ??
                        job.priceMilliFec,
                    )}
                  />

                  <DetailField
                    label="Created"
                    value={formatDateTime(
                      job.createdAt,
                    )}
                  />
                </div>
              </div>
    )}
  />
          </div>
        )}
      </Section>

      <Section
        title="Jobs assigned"
        eyebrow="Fixer activity"
        action={
          <StatusBadge variant="info">
            {jobsAssigned.length} records
          </StatusBadge>
        }
      >
        {jobsAssigned.length === 0 ? (
          <EmptyState text="This user has no assigned jobs in the returned history." />
        ) : (
          <div className="space-y-3">
            <PaginatedList
            items={jobsAssigned}
            emptyText="This user has no assigned jobs in the returned history."
            renderItem={(job) => (

              <div
                key={job.id}
                className="rounded-lg border border-[#D9E3F1] p-4 dark:border-[#2D3F55]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {job.skillCategory}
                    </p>

                    <p className="mt-1 break-all font-mono text-[11px] text-[#6B7C99] dark:text-[#8FA0BC]">
                      {job.id}
                    </p>
                  </div>

                  <StatusBadge>
                    {job.status}
                  </StatusBadge>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailField
                    label="Client ID"
                    value={job.clientId}
              breakAll
            />

                  <DetailField
                    label="Location"
                    value={[
                      job.area,
                      job.city,
                      job.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />

                  <DetailField
                    label="Price"
                    value={formatFecFromMilli(
                      job.lockedPriceMilliFec ??
                        job.priceMilliFec,
                    )}
                  />

                  <DetailField
                    label="Created"
                    value={formatDateTime(
                      job.createdAt,
                    )}
                  />
                </div>
              </div>
    )}
  />
          </div>
        )}
      </Section>

      <Section
        title="Applications"
        eyebrow="Fixer activity"
        action={
          <StatusBadge variant="info">
            {applications.length} records
          </StatusBadge>
        }
      >
        {applications.length === 0 ? (
          <EmptyState text="This user has no applications in the returned history." />
        ) : (
          <div className="space-y-3">
            <PaginatedList
            items={applications}
            emptyText="This user has no applications in the returned history."
            renderItem={(application) => (

              <div
                key={application.id}
                className="rounded-lg border border-[#D9E3F1] p-4 dark:border-[#2D3F55]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {application.job.skillCategory}
                    </p>

                    <p className="mt-1 break-all font-mono text-[11px] text-[#6B7C99] dark:text-[#8FA0BC]">
                      Application: {application.id}
                    </p>

                    <p className="mt-1 break-all font-mono text-[11px] text-[#6B7C99] dark:text-[#8FA0BC]">
                      Job: {application.jobId}
                    </p>
                  </div>

                  <StatusBadge
                    variant={
                      application.status === "APPLIED"
                        ? "success"
                        : application.status ===
                            "WITHDRAWN"
                          ? "neutral"
                          : "warning"
                    }
                  >
                    {application.status}
                  </StatusBadge>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <DetailField
                    label="Job status"
              value={application.job.status}
            />

                  <DetailField
                    label="Location"
                    value={[
                      application.job.area,
                      application.job.city,
                      application.job.state,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  />

                  <DetailField
                    label="Applied"
                    value={formatDateTime(
                      application.createdAt,
                    )}
                  />
                </div>

                {application.note && (
                  <div className="mt-4 rounded-lg bg-[#F8FAFD] p-3 dark:bg-[#16202E]">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Application note
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {application.note}
                    </p>
                  </div>
                )}
              </div>
    )}
  />
          </div>
        )}
      </Section>

      <Section
        title="Conversations"
        eyebrow="Chat activity"
        action={
          <StatusBadge variant="info">
            {conversations.length} records
          </StatusBadge>
        }
      >
        {conversations.length === 0 ? (
          <EmptyState text="No conversations found for this user." />
        ) : (
          <div className="space-y-3">
            <PaginatedList
            items={conversations}
            emptyText="No conversations found for this user."
            renderItem={(conversation) => (

              <div
                key={conversation.id}
                className="rounded-lg border border-[#D9E3F1] p-4 dark:border-[#2D3F55]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {conversation.job.skillCategory}
                    </p>

                    <p className="mt-1 break-all font-mono text-[11px] text-[#6B7C99] dark:text-[#8FA0BC]">
                      {conversation.id}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge>
                      {conversation.status}
                    </StatusBadge>

                    <StatusBadge
                      variant={
                        conversation.active
                          ? "success"
                          : "neutral"
                      }
                    >
                      {conversation.active
                        ? "ACTIVE"
                        : "INACTIVE"}
                    </StatusBadge>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailField
                    label="Job ID"
                    value={conversation.jobId}
              breakAll
            />

                  <DetailField
                    label="Messages"
                    value={String(
                      conversation._count.messages,
                    )}
                  />

                  <DetailField
                    label="Agreements"
                    value={String(
                      conversation._count.agreements,
                    )}
                  />

                  <DetailField
                    label="Last updated"
                    value={formatDateTime(
                      conversation.updatedAt,
                    )}
                  />
                </div>
              </div>
    )}
  />
          </div>
        )}
      </Section>

      <Section
        title="Reports"
        eyebrow="Moderation history"
        action={
          <StatusBadge variant="info">
            {reports.length} records
          </StatusBadge>
        }
      >
        {reports.length === 0 ? (
          <EmptyState text="No reports were found in the returned investigation history." />
        ) : (
          <div className="space-y-3">
            <PaginatedList
            items={reports}
            emptyText="No reports were found in the returned investigation history."
            renderItem={(report) => (

              <div
                key={report.id}
                className="rounded-lg border border-[#D9E3F1] p-4 dark:border-[#2D3F55]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {report.reason}
                    </p>

                    <p className="mt-1 break-all font-mono text-[11px] text-[#6B7C99] dark:text-[#8FA0BC]">
                      {report.id}
                    </p>
                  </div>

                  <StatusBadge
                    variant={
                      report.status === "RESOLVED"
                        ? "success"
                        : report.status === "PENDING"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {report.status}
                  </StatusBadge>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailField
                    label="Target type"
              value={report.targetType}
            />

                  <DetailField
                    label="Target ID"
                    value={report.targetId}
                    breakAll
                  />

                  <DetailField
                    label="Reporter ID"
                    value={report.reporterId}
                    breakAll
                  />

                  <DetailField
                    label="Created"
                    value={formatDateTime(
                      report.createdAt,
                    )}
                  />
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                  {report.description}
                </p>

                {report.resolvedAt && (
                  <p className="mt-3 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Resolved:{" "}
                    {formatDateTime(
                      report.resolvedAt,
                    )}
                  </p>
                )}
              </div>
    )}
  />
          </div>
        )}
      </Section>

      <Section
        title="Disputes"
        eyebrow="Dispute history"
        action={
          <StatusBadge variant="info">
            {disputes.length} records
          </StatusBadge>
        }
      >
        {disputes.length === 0 ? (
          <EmptyState text="No disputes were found in the returned investigation history." />
        ) : (
          <div className="space-y-3">
            <PaginatedList
            items={disputes}
            emptyText="No disputes were found in the returned investigation history."
            renderItem={(dispute) => (

              <div
                key={dispute.id}
                className="rounded-lg border border-[#D9E3F1] p-4 dark:border-[#2D3F55]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {dispute.reason}
                    </p>

                    <p className="mt-1 break-all font-mono text-[11px] text-[#6B7C99] dark:text-[#8FA0BC]">
                      {dispute.id}
                    </p>
                  </div>

                  <StatusBadge
                    variant={
                      dispute.status === "RESOLVED"
                        ? "success"
                        : "warning"
                    }
                  >
                    {dispute.status}
                  </StatusBadge>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <DetailField
                    label="Job ID"
                    value={dispute.jobId}
              breakAll
            />

                  <DetailField
                    label="Opened by"
                    value={dispute.openedByUserId}
                    breakAll
                  />

                  <DetailField
                    label="Resolved by admin"
                    value={dispute.resolvedByAdminId}
                    breakAll
                  />

                  <DetailField
                    label="Created"
                    value={formatDateTime(
                      dispute.createdAt,
                    )}
                  />
                </div>

                {dispute.evidence && (
                  <div className="mt-4 rounded-lg bg-[#F8FAFD] p-3 dark:bg-[#16202E]">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      Evidence
                    </p>

                    {renderDisputeEvidence(
                      dispute.evidence,
                    )}
                  </div>
                )}
              </div>
    )}
  />
          </div>
        )}
      </Section>

      <Section
        title="Admin audit history"
        eyebrow="Administrative activity"
        action={
          <StatusBadge variant="info">
            {auditLogs.length} records
          </StatusBadge>
        }
      >
        {auditLogs.length === 0 ? (
          <EmptyState text="No user-specific admin audit entries were found." />
        ) : (
          <div className="space-y-3">
            <PaginatedList
            items={auditLogs}
            emptyText="No user-specific admin audit entries were found."
            renderItem={(log) => (

              <div
                key={log.id}
                className="rounded-lg border border-[#D9E3F1] p-4 dark:border-[#2D3F55]"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge variant="info">
                        {log.action}
                      </StatusBadge>

                      <span className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {log.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-left lg:text-right">
                    <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {log.actor.fullName}
                    </p>

                    <p className="mt-1 break-all text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      {log.actor.email}
                    </p>

                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                      {log.actor.role}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <DetailField
                    label="Admin ID"
                    value={log.actorAdminId}
              breakAll
            />

                  <DetailField
                    label="IP address"
                    value={log.ip}
                    breakAll
                  />
                </div>
              </div>
    )}
  />
          </div>
        )}
      </Section>
    </div>
  );
}
