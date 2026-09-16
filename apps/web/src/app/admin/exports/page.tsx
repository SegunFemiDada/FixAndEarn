// Path: apps/web/src/app/admin/exports/page.tsx
"use client";

import * as React from "react";
import { getAdminToken } from "@/lib/admin/session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const PANEL_CLASS =
  "rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.10)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]";

const SUBPANEL_CLASS =
  "rounded-xl border border-[#C5D5EE] bg-[#F8FAFD] dark:border-[#2D3F55] dark:bg-[#16202E]";

const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600";

export default function AdminExportsPage() {
  const [message, setMessage] = React.useState<string | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);

  async function handleDownload() {
    setMessage(null);

    const token = getAdminToken();

    if (!token) {
      setMessage(
        "Admin session is missing. Sign in again before exporting audit logs.",
      );
      return;
    }

    if (!API_BASE_URL) {
      setMessage("NEXT_PUBLIC_API_BASE_URL is not set.");
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/exports/audit-logs.csv`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        const text = await response.text();

        throw new Error(
          text || `Export failed with status ${response.status}`,
        );
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
      const text =
        error instanceof Error
          ? error.message
          : "Failed to download audit log export.";

      setMessage(text);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Exports
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Audit log export
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              Download the live audit log CSV from the existing admin
              export endpoint.
            </p>
          </div>

          <div className="hidden shrink-0 rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-right dark:border-[#2D3F55] dark:bg-[#16202E] xl:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
              Format
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              CSV
            </p>
          </div>
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <div className="max-w-4xl">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
                />
              </svg>
            </div>

            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Export audit logs
              </h3>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                Download the current audit-log CSV exposed by the
                backend. The export uses the live audit records and
                does not generate derived summaries.
              </p>
            </div>
          </div>

          <div className={`${SUBPANEL_CLASS} mt-6 p-5`}>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                  Export
                </p>

                <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  audit-logs.csv
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                  Source
                </p>

                <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Live admin audit-log endpoint
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-[#C5D5EE] pt-5 dark:border-[#2D3F55]">
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
                className={PRIMARY_BUTTON_CLASS}
              >
                {isDownloading
                  ? "Preparing download..."
                  : "Download audit-logs.csv"}
              </button>
            </div>
          </div>

          {message ? (
            <div
              role="status"
              className={[
                "mt-5 rounded-xl border px-4 py-3 text-sm",
                message.includes("successfully")
                  ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                  : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
              ].join(" ")}
            >
              {message}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}