//path: apps/web/src/app/admin/reports/page.tsx
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import Link from "next/link";
import { useState } from "react";

function formatDateTime(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: reports, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "reports"],
    queryFn: () => adminApi.get("/admin/reports").then(res => res.data),
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => adminApi.post(`/admin/reports/${id}/resolve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => adminApi.post(`/admin/reports/${id}/dismiss`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "reports"] }),
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">User Reports</h1>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading reports...</p>
        </div>
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-24 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
            <div className="h-20 rounded bg-[#EAF0FB] dark:bg-[#16202E]" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">User Reports</h1>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Failed to load reports.</p>
        </div>
        <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-4 text-sm text-[#D9534F] dark:text-red-300 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          {error?.message || "Unknown error"}
        </div>
      </div>
    );
  }

  const pendingCount = reports?.filter((r: any) => r.status === "PENDING").length || 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Reports</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">User reports</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Investigate and resolve reports submitted by users against jobs or chat messages.
        </p>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] sm:p-6">
        <div className="flex flex-col gap-3 border-b border-[#C5D5EE] dark:border-[#2D3F55] pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Report queue</h3>
            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              {pendingCount} pending • {reports?.length || 0} total
            </p>
          </div>
        </div>

        {reports?.length === 0 ? (
          <div className="py-6 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No reports found.</div>
        ) : (
          <div className="mt-4 grid gap-4">
            {reports.map((report: any) => (
              <article key={report.id} className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#EAF0FB] dark:bg-[#16202E] px-3 py-1 text-xs font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {report.id.slice(0, 8)}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          report.status === "PENDING"
                            ? "border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 text-[#B45309] dark:text-amber-300"
                            : report.status === "RESOLVED"
                            ? "border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                            : "border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] text-[#6B7C99] dark:text-[#8FA0BC]"
                        }`}
                      >
                        {report.status}
                      </span>
                    </div>
                    <div className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                      {formatDateTime(report.createdAt)}
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                        Reporter
                      </span>
                      <span className="mt-1 block break-all">{report.reporter?.email || report.reporterId}</span>
                    </div>

                    <div>
                      <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                        Target Type
                      </span>
                      <span className="mt-1 block">{report.targetType}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                        Target ID
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <code className="break-all text-xs bg-white dark:bg-[#1E2A3A] border border-[#C5D5EE] dark:border-[#2D3F55] px-2 py-1 rounded text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {report.targetId}
                        </code>
                        <button
                          onClick={() => handleCopy(report.targetId, `target-${report.id}`)}
                          className="text-xs text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
                        >
                          {copiedId === `target-${report.id}` ? "Copied!" : "Copy"}
                        </button>
                    
                    
                        {report.targetType === "CHAT_MESSAGE" && report.jobId && report.fixerId && (
                          <Link
                            href={`/app/jobs/${report.jobId}/chats/${report.fixerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline flex items-center gap-1"
                          >
                            View Chat →
                          </Link>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                        Reason
                      </span>
                      <span className="mt-1 block">{report.reason}</span>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
                        Description
                      </span>
                      <p className="mt-1 text-sm">{report.description || "—"}</p>
                    </div>
                  </div>

                  {report.status === "PENDING" && (
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => resolveMutation.mutate(report.id)}
                        disabled={resolveMutation.isPending}
                        className="inline-flex items-center justify-center rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#2E7D32] dark:text-green-200 transition hover:bg-[#F0FAF0] dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resolveMutation.isPending ? "Resolving..." : "Resolve"}
                      </button>
                      <button
                        onClick={() => dismissMutation.mutate(report.id)}
                        disabled={dismissMutation.isPending}
                        className="inline-flex items-center justify-center rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#D9534F] dark:text-red-300 transition hover:bg-[#FFF4F3] dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {dismissMutation.isPending ? "Dismissing..." : "Dismiss"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}