// Path: apps/web/src/app/admin/security/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import { useAdminSecurityOverview } from "@/lib/admin/security/queries";
import type {
  AdminSecurityAdminSummary,
  AdminSecurityLog,
  AdminSecurityRiskLevel,
} from "@/lib/admin/security/types";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatInteger(value: number | null | undefined) {
  return new Intl.NumberFormat("en-NG").format(Number(value ?? 0));
}

function KpiCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <article className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">{label}</p>
      <div className="mt-3 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{value}</div>
      {helper && <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{helper}</p>}
    </article>
  );
}

function getRiskClass(riskLevel: AdminSecurityRiskLevel) {
  switch (riskLevel) {
    case "HIGH":
      return "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300";
    case "MEDIUM":
      return "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300";
    case "LOW":
      return "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-blue-900/20 text-[#5B8FCC] dark:text-[#7AAEE0]";
    default:
      return "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200";
  }
}

function AdminRiskCard({ admin }: { admin: AdminSecurityAdminSummary }) {
  return (
    <article className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{admin.fullName}</h3>
            <span className={["rounded-full px-3 py-1 text-xs font-medium", getRiskClass(admin.riskLevel)].join(" ")}>
              {admin.riskLevel}
            </span>
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-medium",
                admin.isActive
                  ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                  : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
              ].join(" ")}
            >
              {admin.isActive ? "Active" : "Inactive"}
            </span>
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-medium",
                admin.is2faEnabled
                  ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                  : "border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
              ].join(" ")}
            >
              {admin.is2faEnabled ? "2FA enabled" : "2FA disabled"}
            </span>
          </div>

          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{admin.email}</p>

          <div className="mt-3 grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Role</span>
              <span className="mt-1 block">{admin.role}</span>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Successful logins</span>
              <span className="mt-1 block">{formatInteger(admin.successfulLogins)}</span>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Failed attempts</span>
              <span className="mt-1 block">{formatInteger(admin.totalFailedAttempts)}</span>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Last failed attempt</span>
              <span className="mt-1 block">{formatDateTime(admin.lastFailedLoginAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function SecurityLogCard({ log }: { log: AdminSecurityLog }) {
  return (
    <article className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-3 py-1 text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
              {log.action}
            </span>
            <span className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">{formatDateTime(log.createdAt)}</span>
          </div>

          <p className="mt-3 text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">{log.description}</p>

          <div className="mt-3 grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Actor</span>
              <span className="mt-1 block">{log.actor?.fullName ?? "Not available"}</span>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Actor email</span>
              <span className="mt-1 block break-all">{log.actor?.email ?? "Not available"}</span>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">IP</span>
              <span className="mt-1 block break-all">{log.ip ?? "Not available"}</span>
            </div>

            <div>
              <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">User agent</span>
              <span className="mt-1 block wrap-break-word">{log.userAgent ?? "Not available"}</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AdminSecurityPage() {
  const query = useAdminSecurityOverview({ take: 50 }, true);
  const data = query.data;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Security</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Security center</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Review recent admin auth activity, flagged admin accounts, and security-relevant audit actions using live backend data only.
        </p>
      </section>

      {query.isLoading ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading security overview...</p>
        </section>
      ) : query.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">Failed to load security overview</h3>
          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">{extractApiErrorMessage(query.error)}</p>
        </section>
      ) : !data ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No security data was returned.</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Total admins" value={formatInteger(data.counts.totalAdmins)} />
            <KpiCard label="Active admins" value={formatInteger(data.counts.activeAdmins)} />
            <KpiCard label="Flagged admins" value={formatInteger(data.counts.flaggedAdmins)} />
            <KpiCard label="Recent failed logins" value={formatInteger(data.counts.recentFailedLogins)} />
            <KpiCard label="2FA enabled" value={formatInteger(data.counts.adminsWith2faEnabled)} />
            <KpiCard label="2FA disabled" value={formatInteger(data.counts.adminsWithout2faEnabled)} />
            <KpiCard label="Recent successful logins" value={formatInteger(data.counts.recentSuccessfulLogins)} />
            <KpiCard label="Inactive admins" value={formatInteger(data.counts.inactiveAdmins)} />
          </section>

          <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Flagged admin accounts</h3>
                <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Accounts are flagged for repeated failed attempts, disabled 2FA, or inactive state.
                </p>
              </div>
            </div>

            {data.flaggedAdmins.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                No admin accounts are currently flagged.
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {data.flaggedAdmins.map((admin) => (
                  <AdminRiskCard key={admin.id} admin={admin} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">All admin auth summary</h3>
            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Last 7 days of tracked admin auth outcomes from current audit logging.
            </p>

            <div className="mt-4 grid gap-4">
              {data.adminAuthSummary.map((admin) => (
                <article key={admin.id} className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{admin.fullName}</h4>
                        <span className={["rounded-full px-3 py-1 text-xs font-medium", getRiskClass(admin.riskLevel)].join(" ")}>
                          {admin.riskLevel}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">{admin.email}</p>

                      <div className="mt-3 grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Role</span>
                          <span className="mt-1 block">{admin.role}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Successful</span>
                          <span className="mt-1 block">{formatInteger(admin.successfulLogins)}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Failed password</span>
                          <span className="mt-1 block">{formatInteger(admin.failedPasswordAttempts)}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Failed TOTP</span>
                          <span className="mt-1 block">{formatInteger(admin.failedTotpAttempts)}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Blocked inactive</span>
                          <span className="mt-1 block">{formatInteger(admin.blockedInactiveAttempts)}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">2FA</span>
                          <span className="mt-1 block">{admin.is2faEnabled ? "Enabled" : "Disabled"}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Last success</span>
                          <span className="mt-1 block">{formatDateTime(admin.lastSuccessfulLoginAt)}</span>
                        </div>

                        <div>
                          <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Last failure</span>
                          <span className="mt-1 block">{formatDateTime(admin.lastFailedLoginAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Recent security activity</h3>
                <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Security-relevant audit trail from live admin audit logs.
                </p>
              </div>

              <Link
                href="/admin/exports"
                className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
              >
                Open exports
              </Link>
            </div>

            {data.recentSecurityLogs.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                No security audit logs found.
              </div>
            ) : (
              <div className="mt-4 grid gap-4">
                {data.recentSecurityLogs.map((log) => (
                  <SecurityLogCard key={log.id} log={log} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}