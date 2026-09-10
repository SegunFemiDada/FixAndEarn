"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import * as React from "react";
import { useAdminPaymentDetail } from "@/lib/admin/payments/queries";
import type {
  AdminPaymentStatus,
  AdminPaymentType,
} from "@/lib/admin/payments/types";

function formatFec(milli: number | null | undefined) {
  if (typeof milli !== "number") {
    return "—";
  }

  return `${(milli / 1000).toFixed(2)} FEC`;
}

function formatNaira(milli: number | null | undefined) {
  if (typeof milli !== "number") {
    return "—";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(milli);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusClass(status: AdminPaymentStatus) {
  switch (status) {
    case "SUCCESS":
      return "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200";

    case "PENDING":
      return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200";

    case "FAILED":
      return "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200";

    case "EXPIRED":
      return "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200";

    default:
      return "border-gray-300 bg-gray-50 text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200";
  }
}

function typeClass(type: AdminPaymentType) {
  switch (type) {
    case "POSTING":
      return "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-200";

    case "URGENT":
      return "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-700 dark:bg-orange-900/20 dark:text-orange-200";

    case "FINAL":
      return "border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-200";

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
    <section className="rounded-2xl border border-[#C5D5EE] bg-white p-5 shadow-[0_4px_24px_rgba(91,143,204,0.08)] dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
      <h2 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        {title}
      </h2>

      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
        {label}
      </p>

      <p
        className={[
          "mt-1 wrap-break-word text-sm text-[#1A2B4A] dark:text-[#E8F0FA]",
          mono ? "font-mono text-xs" : "",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

function statusLabel(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return value.replaceAll("_", " ");
}

export default function AdminPaymentDetailPage() {
  const params = useParams<{ id: string }>();

  const paymentId =
    typeof params?.id === "string" ? params.id : "";

  const query = useAdminPaymentDetail(paymentId);

  if (!paymentId) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
        Payment ID is missing.
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-[#C5D5EE] bg-white p-6 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading payment investigation...
          </p>
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/payments"
          className="inline-flex items-center text-sm font-medium text-[#5B8FCC] hover:underline dark:text-[#7AAEE0]"
        >
          ← Back to Payment Operations
        </Link>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-700 dark:bg-red-900/20">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-200">
            Payment not found
          </h2>

          <p className="mt-2 text-sm text-red-600 dark:text-red-300">
            The payment record could not be loaded. It may not exist or
            you may not have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  const payment = query.data;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/payments"
          className="inline-flex items-center text-sm font-medium text-[#5B8FCC] hover:underline dark:text-[#7AAEE0]"
        >
          ← Back to Payment Operations
        </Link>
      </div>

      <section className="rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Payment Investigation
            </p>

            <h1 className="mt-1 break-all text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {payment.paymentReference}
            </h1>

            <p className="mt-2 break-all font-mono text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
              {payment.id}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${typeClass(
                payment.type as AdminPaymentType,
              )}`}
            >
              {payment.type}
            </span>

            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass(
                payment.status as AdminPaymentStatus,
              )}`}
            >
              {payment.status}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
            <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Amount
            </p>

            <p className="mt-1 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {formatFec(payment.amountMilliFec)}
            </p>

            <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
              {formatNaira(payment.amountMilliFec)}
            </p>
          </div>

          <div className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
            <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Payment Fee
            </p>

            <p className="mt-1 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              {formatNaira(payment.paymentFeeMilliFec)}
            </p>
          </div>

          <div className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
            <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Paid At
            </p>

            <p className="mt-1 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              {formatDate(payment.paidAt)}
            </p>
          </div>

          <div className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]">
            <p className="text-xs uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
              Expires At
            </p>

            <p className="mt-1 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              {formatDate(payment.expiresAt)}
            </p>
          </div>
        </div>
      </section>

      <Section title="Payment Details">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Payment ID"
            value={payment.id}
            mono
          />

          <Field
            label="Payment Reference"
            value={payment.paymentReference}
            mono
          />

          <Field
            label="Payment Type"
            value={payment.type}
          />

          <Field
            label="Status"
            value={statusLabel(payment.status)}
          />

          <Field
            label="Amount"
            value={
              <>
                {formatFec(payment.amountMilliFec)}{" "}
                <span className="text-[#6B7C99] dark:text-[#8FA0BC]">
                  ({formatNaira(payment.amountMilliFec)})
                </span>
              </>
            }
          />

          <Field
            label="Payment Fee"
            value={formatNaira(payment.paymentFeeMilliFec)}
          />

          <Field
            label="Conversation ID"
            value={payment.conversationId ?? "—"}
            mono
          />

          <Field
            label="Fixer ID on Payment"
            value={payment.fixerId ?? "—"}
            mono
          />

          <Field
            label="Locked Price"
            value={
              payment.lockedPriceMilliFec !== null &&
              payment.lockedPriceMilliFec !== undefined
                ? `${formatFec(payment.lockedPriceMilliFec)} (${formatNaira(
                    payment.lockedPriceMilliFec,
                  )})`
                : "—"
            }
          />

          <Field
            label="Created At"
            value={formatDate(payment.createdAt)}
          />

          <Field
            label="Updated At"
            value={formatDate(payment.updatedAt)}
          />

          <Field
            label="Paid At"
            value={formatDate(payment.paidAt)}
          />
        </div>
      </Section>

      <Section title="Related Job">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Job ID"
            value={
              <Link
                href={`/admin/jobs/${payment.job.id}`}
                className="font-medium text-[#5B8FCC] hover:underline dark:text-[#7AAEE0]"
              >
                {payment.job.id}
              </Link>
            }
            mono
          />

          <Field
            label="Skill Category"
            value={payment.job.skillCategory}
          />

          <Field
            label="Job Status"
            value={statusLabel(payment.job.status)}
          />

          <Field
            label="Posting Type"
            value={payment.job.postingType}
          />

          <Field
            label="Location"
            value={`${payment.job.city}${
              payment.job.state
                ? `, ${payment.job.state}`
                : ""
            }`}
          />

          <Field
            label="Created At"
            value={formatDate(payment.job.createdAt)}
          />

          <Field
            label="Price"
            value={
              <>
                {formatFec(payment.job.priceMilliFec)}{" "}
                <span className="text-[#6B7C99] dark:text-[#8FA0BC]">
                  ({formatNaira(payment.job.priceMilliFec)})
                </span>
              </>
            }
          />

          <Field
            label="Locked Price"
            value={
              payment.job.lockedPriceMilliFec !== null &&
              payment.job.lockedPriceMilliFec !== undefined
                ? `${formatFec(payment.job.lockedPriceMilliFec)} (${formatNaira(
                    payment.job.lockedPriceMilliFec,
                  )})`
                : "—"
            }
          />
        </div>
      </Section>

      <Section title="Client">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Name"
            value={payment.job.client.fullName}
          />

          <Field
            label="Email"
            value={payment.job.client.email}
          />

          <Field
            label="Phone"
            value={payment.job.client.phone ?? "—"}
          />

          <Field
            label="Client ID"
            value={payment.job.client.id}
            mono
          />

          <Field
            label="Account Status"
            value={
              payment.job.client.isActive
                ? "Active"
                : "Inactive"
            }
          />
        </div>
      </Section>

      <Section title="Fixer">
        {payment.job.fixer ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Name"
              value={payment.job.fixer.fullName}
            />

            <Field
              label="Email"
              value={payment.job.fixer.email}
            />

            <Field
              label="Phone"
              value={payment.job.fixer.phone ?? "—"}
            />

            <Field
              label="Fixer ID"
              value={payment.job.fixer.id}
              mono
            />

            <Field
              label="Account Status"
              value={
                payment.job.fixer.isActive
                  ? "Active"
                  : "Inactive"
              }
            />
          </div>
        ) : (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No fixer is currently assigned to this job.
          </p>
        )}
      </Section>

      <Section title="Payment Context">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            label="Selected Conversation"
            value={
              payment.job.selectedConversationId ?? "—"
            }
            mono
          />

          <Field
            label="Completion Requested At"
            value={formatDate(
              payment.job.completedRequestedAt,
            )}
          />

          <Field
            label="Completion Approved At"
            value={formatDate(
              payment.job.completedApprovedAt,
            )}
          />

          <Field
            label="Payment Created"
            value={formatDate(payment.createdAt)}
          />

          <Field
            label="Payment Updated"
            value={formatDate(payment.updatedAt)}
          />

          <Field
            label="Payment Expiry"
            value={formatDate(payment.expiresAt)}
          />
        </div>
      </Section>

      <Section title="Completion">
        {payment.completionRequest ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Completion Request ID"
              value={payment.completionRequest.id}
              mono
            />

            <Field
              label="Status"
              value={statusLabel(
                payment.completionRequest.status,
              )}
            />

            <Field
              label="Fixer ID"
              value={payment.completionRequest.fixerId}
              mono
            />

            <Field
              label="Requested At"
              value={formatDate(
                payment.completionRequest.requestedAt,
              )}
            />

            <Field
              label="Reviewed At"
              value={formatDate(
                payment.completionRequest.reviewedAt,
              )}
            />

            <Field
              label="Reviewed By Client"
              value={
                payment.completionRequest.reviewedByClientId ??
                "—"
              }
              mono
            />

            <Field
              label="Review Note"
              value={
                payment.completionRequest.reviewNote ?? "—"
              }
            />
          </div>
        ) : (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No completion request is associated with this job.
          </p>
        )}
      </Section>

      <Section title="Dispute">
        {payment.dispute ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Dispute ID"
              value={payment.dispute.id}
              mono
            />

            <Field
              label="Status"
              value={statusLabel(payment.dispute.status)}
            />

            <Field
              label="Reason"
              value={payment.dispute.reason}
            />

            <Field
              label="Opened By"
              value={payment.dispute.openedBy.fullName}
            />

            <Field
              label="Opened By Email"
              value={payment.dispute.openedBy.email}
            />

            <Field
              label="Opened At"
              value={formatDate(
                payment.dispute.createdAt,
              )}
            />

            <Field
              label="Resolved At"
              value={formatDate(
                payment.dispute.resolvedAt,
              )}
            />

            <Field
              label="Resolved By"
              value={
                payment.dispute.resolvedByAdmin
                  ? payment.dispute.resolvedByAdmin.fullName
                  : "—"
              }
            />
          </div>
        ) : (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No dispute is associated with this payment/job.
          </p>
        )}
      </Section>

      <Section title="Earnings">
        {payment.earnings ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Earnings ID"
              value={payment.earnings.id}
              mono
            />

            <Field
              label="Fixer ID"
              value={payment.earnings.fixerId}
              mono
            />

            <Field
              label="Amount"
              value={`${formatFec(
                payment.earnings.amountMilliFec,
              )} (${formatNaira(
                payment.earnings.amountMilliFec,
              )})`}
            />

            <Field
              label="Available Amount"
              value={`${formatFec(
                payment.earnings.availableMilliFec,
              )} (${formatNaira(
                payment.earnings.availableMilliFec,
              )})`}
            />

            <Field
              label="Status"
              value={statusLabel(
                payment.earnings.status,
              )}
            />

            <Field
              label="Paid At"
              value={formatDate(
                payment.earnings.paidAt,
              )}
            />

            <Field
              label="Created At"
              value={formatDate(
                payment.earnings.createdAt,
              )}
            />

            <Field
              label="Updated At"
              value={formatDate(
                payment.earnings.updatedAt,
              )}
            />
          </div>
        ) : (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No earnings record is associated with this payment.
          </p>
        )}
      </Section>

      <Section title="Platform Revenue">
        {payment.PlatformRevenue ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Revenue Record ID"
              value={payment.PlatformRevenue.id}
              mono
            />

            <Field
              label="Gross Amount"
              value={`${formatFec(
                payment.PlatformRevenue.grossMilliFec,
              )} (${formatNaira(
                payment.PlatformRevenue.grossMilliFec,
              )})`}
            />

            <Field
              label="Platform Fee"
              value={`${formatFec(
                payment.PlatformRevenue.platformFeeMilliFec,
              )} (${formatNaira(
                payment.PlatformRevenue.platformFeeMilliFec,
              )})`}
            />

            <Field
              label="Created At"
              value={formatDate(
                payment.PlatformRevenue.createdAt,
              )}
            />
          </div>
        ) : (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No platform revenue record is associated with
            this payment.
          </p>
        )}
      </Section>

      <Section title="Related Conversations">
        {payment.conversations?.length ? (
          <div className="space-y-4">
            {payment.conversations.map((conversation) => (
              <div
                key={conversation.id}
                className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 dark:border-[#2D3F55] dark:bg-[#16202E]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      {conversation.fixer.fullName}
                    </p>

                    <p className="mt-1 break-all font-mono text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      {conversation.id}
                    </p>
                  </div>

                  <span className="rounded-full border border-[#C5D5EE] bg-white px-2 py-1 text-xs font-medium text-[#516786] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#AAB9D0]">
                    {conversation.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field
                    label="Active"
                    value={
                      conversation.active
                        ? "Yes"
                        : "No"
                    }
                  />

                  <Field
                    label="Messages"
                    value={
                      conversation._count.messages
                    }
                  />

                  <Field
                    label="Agreements"
                    value={
                      conversation._count.agreements
                    }
                  />

                  <Field
                    label="Updated At"
                    value={formatDate(
                      conversation.updatedAt,
                    )}
                  />
                </div>

                {conversation.negotiation ? (
                  <div className="mt-4 rounded-xl border border-[#C5D5EE] bg-white p-4 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
                    <p className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                      Negotiation
                    </p>

                    <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <Field
                        label="Status"
                        value={
                          conversation.negotiation
                            .status
                        }
                      />

                      <Field
                        label="Proposed Price"
                        value={
                          conversation.negotiation
                            .proposedPriceMilliFec !==
                          null
                            ? formatFec(
                                conversation
                                  .negotiation
                                  .proposedPriceMilliFec,
                              )
                            : "—"
                        }
                      />

                      <Field
                        label="Locked Price"
                        value={
                          conversation.negotiation
                            .lockedPriceMilliFec !==
                          null
                            ? formatFec(
                                conversation
                                  .negotiation
                                  .lockedPriceMilliFec,
                              )
                            : "—"
                        }
                      />

                      <Field
                        label="Locked By"
                        value={
                          conversation.negotiation
                            .lockedByUserId ?? "—"
                        }
                        mono
                      />

                      <Field
                        label="Client Accepted"
                        value={formatDate(
                          conversation.negotiation
                            .clientAcceptedAt,
                        )}
                      />

                      <Field
                        label="Fixer Accepted"
                        value={formatDate(
                          conversation.negotiation
                            .fixerAcceptedAt,
                        )}
                      />

                      <Field
                        label="Agreed At"
                        value={formatDate(
                          conversation.negotiation
                            .agreedAt,
                        )}
                      />

                      <Field
                        label="Rejected At"
                        value={formatDate(
                          conversation.negotiation
                            .rejectedAt,
                        )}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                    No negotiation record is associated
                    with this conversation.
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            No related conversations were returned.
          </p>
        )}
      </Section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-900/20">
        <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          Investigation Only
        </h2>

        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          This payment record is being displayed for
          investigation and reconciliation. No payment custody,
          manual client refund, fixer payout, or payment mutation
          action is performed from this screen.
        </p>
      </section>
    </div>
  );
}