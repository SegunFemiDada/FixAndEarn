// Path: apps/web/src/app/admin/exports/page.tsx
"use client";

import * as React from "react";
import { getAdminToken } from "@/lib/admin/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export default function AdminExportsPage() {
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleDownload() {
    setMessage(null);

    const token = getAdminToken();
    if (!token) {
      setMessage("Admin session is missing. Sign in again before exporting audit logs.");
      return;
    }

    if (!API_BASE_URL) {
      setMessage("NEXT_PUBLIC_API_BASE_URL is not set.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/exports/audit-logs.csv`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "audit-logs.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);

      setMessage("Audit log export downloaded successfully.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to download audit log export.";
      setMessage(text);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Exports</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Audit log export</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Download the live audit log CSV from the existing admin export endpoint. This page stays intentionally simple.
        </p>
      </section>

      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="max-w-2xl">
          <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Export audit logs</h3>
          <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            This downloads the current CSV export exposed by the backend. It does not generate fake reports or derived
            summaries.
          </p>

         <button
  type="button"
  onClick={handleDownload}
  className="
    mt-4 inline-flex items-center justify-center
    rounded-lg px-4 py-3 font-semibold
    bg-blue-600 text-white
    hover:bg-blue-700 focus:ring-2 focus:ring-blue-400
    transition-colors shadow-md
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-blue-500 dark:text-white
    dark:hover:bg-blue-600 dark:focus:ring-blue-300
  "
>
  Download audit-logs.csv
</button>


          {message && (
            <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
              {message}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}