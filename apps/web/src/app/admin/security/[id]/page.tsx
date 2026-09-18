"use client";

import Link from "next/link";
import { isValidElement } from "react";
import { useParams } from "next/navigation";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { useAdminSecurityInvestigation } from "@/lib/admin/security/queries";
import type { AdminSecurityNearbyEvent } from "@/lib/admin/security/types";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatFec(value: number | null | undefined) {
  if (typeof value !== "number") return "Not available";
  return `${(value / 1000).toFixed(2)} FEC`;
}

function badgeClass(value: string | null | undefined) {
  const normalized = String(value ?? "").toUpperCase();
  if (
    ["APPROVED", "RESOLVED", "COMPLETED", "PAID", "ACTIVE", "SUCCESS"].includes(
      normalized,
    )
  )
    return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";
  if (
    ["PENDING", "OPEN", "FLAGGED", "IN_PROGRESS", "LOCKED"].includes(normalized)
  )
    return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200";
  if (
    [
      "REJECTED",
      "DISMISSED",
      "FAILED",
      "SUSPENDED",
      "INACTIVE",
      "CANCELLED",
    ].includes(normalized)
  )
    return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";
  return "border-[#C5D5EE] bg-[#F4F8FF] text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]";
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeClass(value)}`}
    >
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

function renderFieldValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }

  if (isValidElement(value)) {
    return value;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "object") {
    return (
      <div className="mt-1 rounded-lg border border-[#D9E3F1] bg-[#F8FAFD] p-3 dark:border-[#2D3F55] dark:bg-[#16202E]">
        <div className="grid gap-3 sm:grid-cols-2">
          <MetadataFields value={value} />
        </div>
      </div>
    );
  }

  return String(value);
}

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0">
      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7C99] dark:text-[#8FA0BC]">
        {label}
      </span>
      <span className="mt-1 block wrap-break-word text-sm leading-5 text-[#1A2B4A] dark:text-[#E8F0FA]">
        {renderFieldValue(value)}
      </span>
    </div>
  );
}

function MetadataFields({
  value,
  prefix = "",
}: {
  value: unknown;
  prefix?: string;
}) {
  if (value === null || value === undefined)
    return <Field label={prefix || "Value"} value="Not available" />;
  if (typeof value !== "object")
    return <Field label={prefix || "Value"} value={String(value)} />;
  if (Array.isArray(value))
    return (
      <div className="space-y-2 sm:col-span-2">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B7C99] dark:text-[#8FA0BC]">
          {prefix || "Value"}
        </span>
        <div className="rounded-lg bg-[#F4F8FF] p-3 dark:bg-[#16202E]">
          {value.length ? (
            value.map((item, index) => (
              <MetadataFields
                key={`${prefix}-${index}`}
                value={item}
                prefix={`[${index}]`}
              />
            ))
          ) : (
            <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Empty list
            </p>
          )}
        </div>
      </div>
    );
  const entries = Object.entries(value as Record<string, unknown>);
  if (!entries.length)
    return <Field label={prefix || "Metadata"} value="No metadata values" />;
  return (
    <>
      {entries.map(([key, item]) => (
        <MetadataFields
          key={prefix ? `${prefix}.${key}` : key}
          value={item}
          prefix={prefix ? `${prefix}.${key}` : key}
        />
      ))}
    </>
  );
}

function CorrelationCard({
  title,
  id,
  children,
}: {
  title: string;
  id: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#D9E3F1] p-4 dark:border-[#2D3F55]">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {title}
        </h4>
        {id ? (
          <span className="break-all font-mono text-[10px] text-[#6B7C99] dark:text-[#8FA0BC]">
            {id}
          </span>
        ) : (
          <StatusBadge value="NOT CORRELATED" />
        )}
      </div>
      {id && <div className="mt-4">{children}</div>}
    </div>
  );
}

function NearbyEvent({ event }: { event: AdminSecurityNearbyEvent }) {
  return (
    <div className="rounded-lg border border-[#D9E3F1] p-4 dark:border-[#2D3F55]">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex rounded-full border border-[#C5D5EE] bg-[#EAF0FB] px-2.5 py-1 text-[11px] font-semibold text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]">
            {event.action}
          </span>
          <p className="mt-3 text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
            {event.description}
          </p>
        </div>
        <span className="shrink-0 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
          {formatDateTime(event.createdAt)}
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="IP address" value={event.ip} />
        <Field label="User agent" value={event.userAgent} />
      </div>
      {typeof event.metadata === "object" &&
      event.metadata !== null &&
      !Array.isArray(event.metadata) ? (
        <div className="mt-4 rounded-lg bg-[#F8FAFD] p-3 dark:bg-[#16202E]">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
            Metadata
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetadataFields value={event.metadata} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminSecurityInvestigationPage() {
  const params = useParams<{ id: string }>();
  const logId = typeof params?.id === "string" ? params.id : "";
  const query = useAdminSecurityInvestigation(logId);
  const data = query.data;

  if (query.isLoading)
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-[#C5D5EE] bg-white p-6 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading security investigation...
          </p>
        </section>
      </div>
    );

  if (query.isError)
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-700 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-200">
            Failed to load security investigation
          </h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-200">
            {extractApiErrorMessage(query.error)}
          </p>
          <Link
            href="/admin/security"
            className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#315F96] dark:bg-[#1E2A3A] dark:text-[#8FC1F2]"
          >
            Back to Security Center
          </Link>
        </section>
      </div>
    );

  if (!data?.log)
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-[#C5D5EE] bg-white p-6 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Security log record not found.
          </p>
          <Link
            href="/admin/security"
            className="mt-4 inline-flex rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
          >
            Back to Security Center
          </Link>
        </section>
      </div>
    );

  const { log, correlations, correlationKeys, nearbyEvents } = data;

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#C5D5EE] bg-white p-5 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                Security Investigation
              </span>
              <StatusBadge value={log.action} />
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA]">
              {log.description}
            </h2>
            <p className="mt-2 break-all font-mono text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
              {log.id}
            </p>
          </div>
          <Link
            href="/admin/security"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#C5D5EE] bg-white px-4 py-2 text-sm font-semibold text-[#315F96] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2]"
          >
            ← Back to Security Center
          </Link>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Audit event">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Action" value={log.action} />
            <Field label="Created" value={formatDateTime(log.createdAt)} />
            <Field
              label="Actor"
              value={log.actor?.fullName || log.actorAdminId}
            />
            <Field
              label="Actor email"
              value={log.actor?.email || "Not available"}
            />
            <Field
              label="Actor role"
              value={log.actor?.role || "Not available"}
            />
            <Field
              label="Actor status"
              value={
                <StatusBadge
                  value={log.actor?.isActive ? "ACTIVE" : "INACTIVE"}
                />
              }
            />
            <Field label="IP address" value={log.ip || "Not available"} />
            <Field
              label="User agent"
              value={log.userAgent || "Not available"}
            />
          </div>
        </Section>
        <Section title="Correlation keys">
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.entries(correlationKeys).map(([key, value]) => (
              <Field
                key={key}
                label={key}
                value={
                  value ? (
                    <span className="break-all font-mono text-xs">{value}</span>
                  ) : (
                    <span className="text-[#8A9AB3]">
                      No identifier in this event
                    </span>
                  )
                }
              />
            ))}
          </div>
        </Section>
      </div>

      <Section title="Audit metadata">
        {Object.keys(log.metadata ?? {}).length === 0 ? (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            This audit event has no structured metadata.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <MetadataFields value={log.metadata} />
          </div>
        )}
      </Section>

      <Section title="Correlated records">
        <div className="space-y-4">
          <CorrelationCard title="User" id={correlationKeys.userId}>
            {correlations.user ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Name" value={correlations.user.fullName} />
                <Field label="Email" value={correlations.user.email} />
                <Field
                  label="Account status"
                  value={
                    <StatusBadge
                      value={correlations.user.isActive ? "ACTIVE" : "INACTIVE"}
                    />
                  }
                />
                <Field
                  label="Force reverify"
                  value={
                    <StatusBadge
                      value={
                        correlations.user.forceReverify ? "PENDING" : "CLEAR"
                      }
                    />
                  }
                />
                <Field
                  label="Deletion request"
                  value={correlations.user.deletionRequestStatus || "None"}
                />
                <Field
                  label="Created"
                  value={formatDateTime(correlations.user.createdAt)}
                />
                <Field
                  label="Updated"
                  value={formatDateTime(correlations.user.updatedAt)}
                />
              </div>
            ) : (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                The correlated user record no longer exists.
              </p>
            )}
          </CorrelationCard>

          <CorrelationCard title="Job" id={correlationKeys.jobId}>
            {correlations.job ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Status"
                  value={<StatusBadge value={correlations.job.status} />}
                />
                <Field label="Skill" value={correlations.job.skillCategory} />
                <Field
                  label="Client ID"
                  value={
                    <span className="break-all font-mono text-xs">
                      {correlations.job.clientId}
                    </span>
                  }
                />
                <Field
                  label="Fixer ID"
                  value={
                    correlations.job.fixerId ? (
                      <span className="break-all font-mono text-xs">
                        {correlations.job.fixerId}
                      </span>
                    ) : (
                      "Not assigned"
                    )
                  }
                />
                <Field
                  label="Price"
                  value={formatFec(correlations.job.priceMilliFec)}
                />
                <Field
                  label="Locked price"
                  value={formatFec(correlations.job.lockedPriceMilliFec)}
                />
                <Field
                  label="Created"
                  value={formatDateTime(correlations.job.createdAt)}
                />
                <Field
                  label="Updated"
                  value={formatDateTime(correlations.job.updatedAt)}
                />
              </div>
            ) : (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                The correlated job record no longer exists.
              </p>
            )}
          </CorrelationCard>

          <CorrelationCard title="Withdrawal" id={correlationKeys.withdrawalId}>
            {correlations.withdrawal ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="User ID"
                  value={
                    <span className="break-all font-mono text-xs">
                      {correlations.withdrawal.userId}
                    </span>
                  }
                />
                <Field
                  label="Amount"
                  value={formatFec(correlations.withdrawal.amountMilliFec)}
                />
                <Field
                  label="Status"
                  value={<StatusBadge value={correlations.withdrawal.status} />}
                />
                <Field
                  label="Reviewed by"
                  value={correlations.withdrawal.reviewedBy || "Not reviewed"}
                />
                <Field
                  label="Failure reason"
                  value={correlations.withdrawal.failureReason || "None"}
                />
                <Field
                  label="Created"
                  value={formatDateTime(correlations.withdrawal.createdAt)}
                />
                <Field
                  label="Reviewed"
                  value={formatDateTime(correlations.withdrawal.reviewedAt)}
                />
                <Field
                  label="Paid"
                  value={formatDateTime(correlations.withdrawal.paidAt)}
                />
              </div>
            ) : (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                The correlated withdrawal record no longer exists.
              </p>
            )}
          </CorrelationCard>

          <CorrelationCard title="Deposit" id={correlationKeys.depositId}>
            {correlations.deposit ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="User ID"
                  value={
                    <span className="break-all font-mono text-xs">
                      {correlations.deposit.userId}
                    </span>
                  }
                />
                <Field
                  label="Reference"
                  value={
                    <span className="break-all font-mono text-xs">
                      {correlations.deposit.reference}
                    </span>
                  }
                />
                <Field
                  label="Amount"
                  value={formatFec(correlations.deposit.amountMilliFec)}
                />
                <Field
                  label="Status"
                  value={<StatusBadge value={correlations.deposit.status} />}
                />
                <Field
                  label="Created"
                  value={formatDateTime(correlations.deposit.createdAt)}
                />
                <Field
                  label="Updated"
                  value={formatDateTime(correlations.deposit.updatedAt)}
                />
              </div>
            ) : (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                The correlated deposit record no longer exists.
              </p>
            )}
          </CorrelationCard>

          <CorrelationCard title="Job payment" id={correlationKeys.paymentId}>
            {correlations.payment ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Job ID"
                  value={
                    <span className="break-all font-mono text-xs">
                      {correlations.payment.jobId}
                    </span>
                  }
                />
                <Field label="Type" value={correlations.payment.type} />
                <Field
                  label="Status"
                  value={<StatusBadge value={correlations.payment.status} />}
                />
                <Field
                  label="Amount"
                  value={formatFec(correlations.payment.amountMilliFec)}
                />
                <Field
                  label="Payment fee"
                  value={formatFec(correlations.payment.paymentFeeMilliFec)}
                />
                <Field
                  label="Payment reference"
                  value={
                    <span className="break-all font-mono text-xs">
                      {correlations.payment.paymentReference ||
                        correlations.payment.id}
                    </span>
                  }
                />
                <Field
                  label="Created"
                  value={formatDateTime(correlations.payment.createdAt)}
                />
                <Field
                  label="Paid"
                  value={formatDateTime(correlations.payment.paidAt)}
                />
                <Field
                  label="Expires"
                  value={formatDateTime(correlations.payment.expiresAt)}
                />
              </div>
            ) : (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                The correlated payment record no longer exists.
              </p>
            )}
          </CorrelationCard>

          <CorrelationCard title="Report" id={correlationKeys.reportId}>
            {correlations.report ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Reporter ID"
                  value={
                    <span className="break-all font-mono text-xs">
                      {correlations.report.reporterId}
                    </span>
                  }
                />
                <Field
                  label="Target type"
                  value={correlations.report.targetType}
                />
                <Field
                  label="Target ID"
                  value={
                    <span className="break-all font-mono text-xs">
                      {correlations.report.targetId}
                    </span>
                  }
                />
                <Field label="Reason" value={correlations.report.reason} />
                <Field
                  label="Status"
                  value={<StatusBadge value={correlations.report.status} />}
                />
                <Field
                  label="Resolved by"
                  value={correlations.report.resolvedBy || "Not resolved"}
                />
                <Field
                  label="Created"
                  value={formatDateTime(correlations.report.createdAt)}
                />
                <Field
                  label="Updated"
                  value={formatDateTime(correlations.report.updatedAt)}
                />
              </div>
            ) : (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                The correlated report record no longer exists.
              </p>
            )}
          </CorrelationCard>

          <CorrelationCard title="Chat message" id={correlationKeys.messageId}>
            {correlations.message ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Field
                    label="Conversation ID"
                    value={
                      <span className="break-all font-mono text-xs">
                        {correlations.message.conversationId}
                      </span>
                    }
                  />
                  <Field
                    label="Sender ID"
                    value={
                      <span className="break-all font-mono text-xs">
                        {correlations.message.senderId}
                      </span>
                    }
                  />
                  <Field
                    label="Created"
                    value={formatDateTime(correlations.message.createdAt)}
                  />
                </div>
                <div className="rounded-lg bg-[#F4F8FF] p-4 dark:bg-[#16202E]">
                  <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6 text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {correlations.message.body}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                The correlated message record no longer exists.
              </p>
            )}
          </CorrelationCard>

          <CorrelationCard
            title="Conversation"
            id={correlationKeys.conversationId}
          >
            {correlations.conversation ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field
                  label="Job ID"
                  value={
                    <span className="break-all font-mono text-xs">
                      {correlations.conversation.jobId || "Not linked"}
                    </span>
                  }
                />
                <Field
                  label="Fixer ID"
                  value={
                    <span className="break-all font-mono text-xs">
                      {correlations.conversation.fixerId}
                    </span>
                  }
                />
                <Field
                  label="Status"
                  value={
                    <StatusBadge value={correlations.conversation.status} />
                  }
                />
                <Field
                  label="Active"
                  value={
                    <StatusBadge
                      value={
                        correlations.conversation.active ? "ACTIVE" : "INACTIVE"
                      }
                    />
                  }
                />
                <Field
                  label="Created"
                  value={formatDateTime(correlations.conversation.createdAt)}
                />
                <Field
                  label="Updated"
                  value={formatDateTime(correlations.conversation.updatedAt)}
                />
              </div>
            ) : (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                The correlated conversation record no longer exists.
              </p>
            )}
          </CorrelationCard>

          <CorrelationCard
            title="Target admin"
            id={correlationKeys.targetAdminId}
          >
            {correlations.targetAdmin ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Name" value={correlations.targetAdmin.fullName} />
                <Field label="Email" value={correlations.targetAdmin.email} />
                <Field label="Role" value={correlations.targetAdmin.role} />
                <Field
                  label="Status"
                  value={
                    <StatusBadge
                      value={
                        correlations.targetAdmin.isActive
                          ? "ACTIVE"
                          : "INACTIVE"
                      }
                    />
                  }
                />
                <Field
                  label="2FA"
                  value={
                    <StatusBadge
                      value={
                        correlations.targetAdmin.is2faEnabled
                          ? "ENABLED"
                          : "DISABLED"
                      }
                    />
                  }
                />
                <Field
                  label="Created"
                  value={formatDateTime(correlations.targetAdmin.createdAt)}
                />
                <Field
                  label="Updated"
                  value={formatDateTime(correlations.targetAdmin.updatedAt)}
                />
              </div>
            ) : (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                The correlated admin record no longer exists.
              </p>
            )}
          </CorrelationCard>
        </div>
      </Section>

      <Section title="Nearby audit events by the same actor">
        <p className="mb-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Events from the same admin within 30 minutes before or after this
          event.
        </p>
        {nearbyEvents.length === 0 ? (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No nearby audit events were found.
          </p>
        ) : (
          <div className="space-y-3">
            {nearbyEvents.map((event) => (
              <NearbyEvent key={event.id} event={event} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
