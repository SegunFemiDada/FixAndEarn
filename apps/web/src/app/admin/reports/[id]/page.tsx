"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import { extractApiErrorMessage } from "@/lib/admin/queries";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatFec(milli: number | null | undefined) {
  if (typeof milli !== "number") return "Not available";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

function badgeClass(status: string | null | undefined) {
  const value = String(status ?? "").toUpperCase();
  if (["APPROVED", "RESOLVED", "COMPLETED", "PAID", "CLEAR", "ACTIVE"].includes(value)) {
    return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";
  }
  if (["PENDING", "OPEN", "APPLIED", "IN_PROGRESS", "FLAGGED"].includes(value)) {
    return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200";
  }
  if (["REJECTED", "DISMISSED", "CANCELLED", "FAILED", "SUSPENDED"].includes(value)) {
    return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";
  }
  return "border-[#C5D5EE] bg-[#F4F8FF] text-[#516786] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#AAB9D0]";
}

function StatusBadge({ value }: { value: string | null | undefined }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badgeClass(value)}`}>
      {value || "Not available"}
    </span>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#C5D5EE] bg-white shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
      <div className="flex flex-col gap-2 border-b border-[#D9E3F1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-[#2D3F55]">
        <h3 className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
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

function ListBlock({
  children,
  empty = "No records.",
}: {
  children: React.ReactNode;
  empty?: string;
}) {
  return <div className="space-y-3">{children || <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{empty}</p>}</div>;
}

export default function AdminReportInvestigationPage() {
  const params = useParams<{ id: string }>();
  const reportId = typeof params?.id === "string" ? params.id : "";

  const query = useQuery({
    queryKey: ["admin", "reports", "investigation", reportId],
    queryFn: () =>
      adminApi
        .get(`/admin/reports/${reportId}/investigation`)
        .then((res) => res.data),
    enabled: Boolean(reportId),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-[#C5D5EE] bg-white p-6 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading report investigation...</p>
        </section>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-700 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-200">Failed to load report</h2>
          <p className="mt-2 text-sm text-red-700 dark:text-red-200">
            {extractApiErrorMessage(query.error)}
          </p>
          <Link
            href="/admin/reports"
            className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#315F96] shadow-sm dark:bg-[#1E2A3A] dark:text-[#8FC1F2]"
          >
            Back to Reports
          </Link>
        </section>
      </div>
    );
  }

  const data = query.data;
  const report = data?.report;
  const reporter = report?.reporter;
  const resolvedByAdmin = data?.resolvedByAdmin;
  const targetType = data?.target?.type;
  const job = data?.target?.job;
  const message = data?.target?.message;
  const recentMessages = data?.target?.recentMessages ?? [];
  const relatedReports = data?.relatedReports ?? [];

  if (!report) {
    return (
      <div className="space-y-5">
        <section className="rounded-xl border border-[#C5D5EE] bg-white p-6 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Report record not found.</p>
          <Link
            href="/admin/reports"
            className="mt-4 inline-flex rounded-lg bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
          >
            Back to Reports
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#C5D5EE] bg-white p-5 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                Report Investigation
              </span>
              <StatusBadge value={report.status} />
              <StatusBadge value={report.targetType} />
            </div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#1A2B4A] dark:text-[#E8F0FA]">
              {report.reason}
            </h2>
            <p className="mt-1 break-all font-mono text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
              {report.id}
            </p>
          </div>

          <Link
            href="/admin/reports"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#C5D5EE] bg-white px-4 py-2 text-sm font-semibold text-[#315F96] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FC1F2]"
          >
            ← Back to Reports
          </Link>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Report details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Report ID" value={<span className="break-all font-mono text-xs">{report.id}</span>} />
            <Field label="Created" value={formatDateTime(report.createdAt)} />
            <Field label="Target type" value={report.targetType} />
            <Field label="Target ID" value={<span className="break-all font-mono text-xs">{report.targetId}</span>} />
            <Field label="Reason" value={report.reason} />
            <Field label="Description" value={report.description || "Not provided"} />
            <Field label="Status" value={<StatusBadge value={report.status} />} />
            <Field label="Resolved at" value={formatDateTime(report.resolvedAt)} />
          </div>
        </Section>

        <Section title="Reporter">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={reporter?.fullName} />
            <Field label="Email" value={reporter?.email} />
            <Field label="Phone" value={reporter?.phone} />
            <Field label="User ID" value={<span className="break-all font-mono text-xs">{report.reporterId}</span>} />
            <Field label="Account status" value={<StatusBadge value={reporter?.isActive ? "ACTIVE" : "SUSPENDED"} />} />
            <Field label="Joined" value={formatDateTime(reporter?.createdAt)} />
          </div>
        </Section>
      </div>

      {resolvedByAdmin && (
        <Section title="Resolution">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Admin" value={resolvedByAdmin.fullName} />
            <Field label="Email" value={resolvedByAdmin.email} />
            <Field label="Role" value={resolvedByAdmin.role} />
            <Field label="Resolved at" value={formatDateTime(report.resolvedAt)} />
          </div>
        </Section>
      )}

      {targetType === "JOB" && (
        <>
          <Section
            title="Reported job"
            action={
              job?.id ? (
                <Link
                  href={`/admin/jobs/${job.id}`}
                  className="text-xs font-semibold text-[#5B8FCC] hover:underline dark:text-[#7AAEE0]"
                >
                  Open Job →
                </Link>
              ) : undefined
            }
          >
            {!job ? (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">The reported job no longer exists.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Job ID" value={<span className="break-all font-mono text-xs">{job.id}</span>} />
                <Field label="Skill" value={job.skillCategory} />
                <Field label="Status" value={<StatusBadge value={job.status} />} />
                <Field label="Moderation" value={<StatusBadge value={job.moderationStatus} />} />
                <Field label="Client" value={`${job.client?.fullName || "Unknown"} (${job.client?.email || "No email"})`} />
                <Field label="Fixer" value={job.fixer ? `${job.fixer.fullName} (${job.fixer.email})` : "Not assigned"} />
                <Field label="Location" value={[job.area, job.lga, job.city, job.state].filter(Boolean).join(", ") || "Not available"} />
                <Field label="Price" value={formatFec(job.lockedPriceMilliFec ?? job.priceMilliFec)} />
                <Field label="Created" value={formatDateTime(job.createdAt)} />
                <Field label="Updated" value={formatDateTime(job.updatedAt)} />
                <Field label="Flag reason" value={job.flagReason || "None"} />
                <Field label="Posting type" value={job.postingType} />
              </div>
            )}
          </Section>

          <div className="grid gap-5 xl:grid-cols-2">
            <Section title={`Applications (${job?.applications?.length ?? 0} loaded)`}>
              <ListBlock>
                {job?.applications?.map((item: any) => (
                  <div key={item.id} className="rounded-lg border border-[#D9E3F1] p-3 dark:border-[#2D3F55]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">{item.fixer?.fullName || item.fixerId}</span>
                      <StatusBadge value={item.status} />
                    </div>
                    <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">{item.fixer?.email || "No email"} • {formatDateTime(item.createdAt)}</p>
                    {item.note && <p className="mt-2 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">{item.note}</p>}
                  </div>
                ))}
              </ListBlock>
            </Section>

            <Section title={`Conversations (${job?.conversations?.length ?? 0} loaded)`}>
              <ListBlock>
                {job?.conversations?.map((item: any) => (
                  <div key={item.id} className="rounded-lg border border-[#D9E3F1] p-3 dark:border-[#2D3F55]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">{item.fixer?.fullName || item.fixerId}</span>
                      <StatusBadge value={item.status} />
                    </div>
                    <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      {item.fixer?.email || "No email"} • {item._count?.messages ?? 0} messages • {formatDateTime(item.updatedAt)}
                    </p>
                    {item.negotiation && (
                      <p className="mt-2 text-xs text-[#516786] dark:text-[#AAB9D0]">
                        Negotiation: {item.negotiation.status} • Proposed {formatFec(item.negotiation.proposedPriceMilliFec)}
                      </p>
                    )}
                  </div>
                ))}
              </ListBlock>
            </Section>

            <Section title={`Payments (${job?.payments?.length ?? 0} loaded)`}>
              <ListBlock>
                {job?.payments?.map((item: any) => (
                  <div key={item.id} className="rounded-lg border border-[#D9E3F1] p-3 dark:border-[#2D3F55]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">{item.type}</span>
                      <StatusBadge value={item.status} />
                    </div>
                    <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">{formatFec(item.amountMilliFec)}</p>
                    <p className="mt-1 break-all text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      {item.paymentReference || item.id} • {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                ))}
              </ListBlock>
            </Section>

            <Section title="Dispute">
              {!job?.dispute ? (
                <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No dispute attached to this job.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Status" value={<StatusBadge value={job.dispute.status} />} />
                  <Field label="Opened" value={formatDateTime(job.dispute.createdAt)} />
                  <Field label="Opened by" value={job.dispute.openedBy?.fullName || job.dispute.openedByUserId} />
                  <Field label="Reason" value={job.dispute.reason} />
                  <Field label="Resolved at" value={formatDateTime(job.dispute.resolvedAt)} />
                  <Field label="Resolved by" value={job.dispute.resolvedByAdmin?.fullName || job.dispute.resolvedByAdminId || "Not resolved"} />
                  <div className="sm:col-span-2">
                    <Field label="Evidence" value={<pre className="max-h-48 overflow-auto whitespace-pre-wrap wrap-break-word rounded-lg bg-[#F4F8FF] p-3 text-xs dark:bg-[#16202E]">{typeof job.dispute.evidence === "string" ? job.dispute.evidence : JSON.stringify(job.dispute.evidence, null, 2)}</pre>} />
                  </div>
                </div>
              )}
            </Section>
          </div>

          <Section title="Financial and completion context">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Earnings" value={job?.earnings ? `${formatFec(job.earnings.amountMilliFec)} (${job.earnings.status})` : "None"} />
              <Field label="Available earnings" value={job?.earnings ? formatFec(job.earnings.availableMilliFec) : "None"} />
              <Field label="Platform gross" value={job?.PlatformRevenue ? formatFec(job.PlatformRevenue.grossMilliFec) : "None"} />
              <Field label="Platform fee" value={job?.PlatformRevenue ? formatFec(job.PlatformRevenue.platformFeeMilliFec) : "None"} />
              <Field label="Completion requested" value={formatDateTime(job?.completedRequestedAt)} />
              <Field label="Completion approved" value={formatDateTime(job?.completedApprovedAt)} />
              <Field label="Review rating" value={job?.review ? `${job.review.rating}/5` : "No review"} />
              <Field label="Review comment" value={job?.review?.comment || "No comment"} />
            </div>
          </Section>
        </>
      )}

      {targetType === "CHAT_MESSAGE" && (
        <>
          <Section
            title="Reported message"
            action={
              message?.conversation?.job?.id ? (
                <Link
                  href={`/admin/jobs/${message.conversation.job.id}`}
                  className="text-xs font-semibold text-[#5B8FCC] hover:underline dark:text-[#7AAEE0]"
                >
                  Open Job →
                </Link>
              ) : undefined
            }
          >
            {!message ? (
              <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">The reported message no longer exists.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-[#D9E3F1] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {message.sender?.fullName || message.senderId}
                    </span>
                    <span className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">{formatDateTime(message.createdAt)}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap wrap-break-word text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">{message.body}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Message ID" value={<span className="break-all font-mono text-xs">{message.id}</span>} />
                  <Field label="Conversation ID" value={<span className="break-all font-mono text-xs">{message.conversationId}</span>} />
                  <Field label="Sender email" value={message.sender?.email} />
                  <Field label="Sender status" value={<StatusBadge value={message.sender?.isActive ? "ACTIVE" : "SUSPENDED"} />} />
                  <Field label="Job ID" value={<span className="break-all font-mono text-xs">{message.conversation?.jobId}</span>} />
                  <Field label="Conversation status" value={<StatusBadge value={message.conversation?.status} />} />
                  <Field label="Client" value={message.conversation?.job?.client?.fullName} />
                  <Field label="Fixer" value={message.conversation?.fixer?.fullName} />
                </div>
              </div>
            )}
          </Section>

          <Section title={`Recent conversation messages (${recentMessages.length} loaded)`}>
            <ListBlock empty="No recent messages found.">
              {recentMessages.map((item: any) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-3 ${
                    item.id === message?.id
                      ? "border-[#5B8FCC] bg-[#F4F8FF] dark:border-[#7AAEE0] dark:bg-[#16202E]"
                      : "border-[#D9E3F1] dark:border-[#2D3F55]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">{item.sender?.fullName || item.senderId}</span>
                    <span className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">{formatDateTime(item.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">{item.body}</p>
                </div>
              ))}
            </ListBlock>
          </Section>
        </>
      )}

      <Section title={`Related reports (${relatedReports.length} loaded)`}>
        <ListBlock empty="No other reports target the same record.">
          {relatedReports.map((item: any) => (
            <div key={item.id} className="rounded-lg border border-[#D9E3F1] p-3 dark:border-[#2D3F55]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/admin/reports/${item.id}`}
                  className="font-mono text-xs font-semibold text-[#315F96] hover:underline dark:text-[#8FC1F2]"
                >
                  {item.id}
                </Link>
                <StatusBadge value={item.status} />
              </div>
              <p className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">{item.reason}</p>
              <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                Reporter ID: {item.reporterId} • {formatDateTime(item.createdAt)}
              </p>
            </div>
          ))}
        </ListBlock>
      </Section>
    </div>
  );
}
