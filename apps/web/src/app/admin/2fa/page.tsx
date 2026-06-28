// Path: apps/web/src/app/admin/2fa/page.tsx
"use client";

import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useAdminOwn2faRotate,
  useAdminOwn2faStatus,
  useAdminOwn2faVerify,
} from "@/lib/admin/twofa/queries";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-3 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export default function Admin2faPage() {
  const statusQuery = useAdminOwn2faStatus(true);
  const verifyMutation = useAdminOwn2faVerify();
  const rotateMutation = useAdminOwn2faRotate();

  const [totp, setTotp] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [latestSetup, setLatestSetup] = React.useState<{
    totpSecret: string;
    totpProvisioningUri: string;
  } | null>(null);

  function handleVerify() {
    setMessage(null);

    verifyMutation.mutate(
      { totp: totp.trim() },
      {
        onSuccess: () => {
          setMessage({ type: "ok", text: "TOTP verified successfully." });
          setTotp("");
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  function handleRotate() {
    setMessage(null);

    const confirmed = window.confirm(
      "Rotate your current TOTP secret? You must save the new secret immediately or you may lock yourself out."
    );
    if (!confirmed) return;

    rotateMutation.mutate(
      { reason: reason.trim() || undefined },
      {
        onSuccess: (response) => {
          setLatestSetup({
            totpSecret: response.totpSecret,
            totpProvisioningUri: response.totpProvisioningUri,
          });
          setMessage({ type: "ok", text: "TOTP rotated successfully. Save the new setup details now." });
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">2FA</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Admin two-factor authentication</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Review your current 2FA status, test your current TOTP code, and rotate your TOTP secret safely.
        </p>
      </section>

      {statusQuery.isLoading ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading 2FA status...</p>
        </section>
      ) : statusQuery.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">Failed to load 2FA status</h3>
          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">{extractApiErrorMessage(statusQuery.error)}</p>
        </section>
      ) : !statusQuery.data ? null : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">2FA enabled</p>
              <div className="mt-3 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {statusQuery.data.admin.is2faEnabled ? "Yes" : "No"}
              </div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Policy enforced</p>
              <div className="mt-3 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {statusQuery.data.policy.enforced ? "Yes" : "No"}
              </div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Backup codes</p>
              <div className="mt-3 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {statusQuery.data.policy.backupCodesSupported ? "Supported" : "Not enabled"}
              </div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Role</p>
              <div className="mt-3 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {statusQuery.data.admin.role}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Current 2FA status</h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Admin</span>
                  <span className="mt-1 block text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {statusQuery.data.admin.fullName}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Email</span>
                  <span className="mt-1 block break-all text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {statusQuery.data.admin.email}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Created</span>
                  <span className="mt-1 block text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {formatDateTime(statusQuery.data.admin.createdAt)}
                  </span>
                </div>

                <div>
                  <span className="block text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Updated</span>
                  <span className="mt-1 block text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {formatDateTime(statusQuery.data.admin.updatedAt)}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <label htmlFor="admin-2fa-code" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Verify current TOTP code
                </label>
                <input
                  id="admin-2fa-code"
                  type="text"
                  inputMode="numeric"
                  value={totp}
                  onChange={(event) => setTotp(event.target.value)}
                  placeholder="Enter current authenticator code"
                  className="mt-2 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  disabled={verifyMutation.isPending}
                />

                <button
  type="button"
  onClick={handleVerify}
  disabled={verifyMutation.isPending || !totp.trim()}
  className="
    mt-3 inline-flex items-center justify-center
    rounded-lg px-4 py-3 font-semibold
    bg-blue-600 text-white
    hover:bg-blue-700 focus:ring-2 focus:ring-blue-400
    transition-colors shadow-md
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-blue-500 dark:text-white
    dark:hover:bg-blue-600 dark:focus:ring-blue-300
  "
>
  {verifyMutation.isPending ? "Verifying..." : "Verify TOTP"}
</button>

              </div>
            </div>

            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Rotate TOTP secret</h3>
              <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Rotating invalidates the previous authenticator setup. Save the new secret immediately.
              </p>

              <div className="mt-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                <label htmlFor="admin-2fa-reason" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Rotation reason
                </label>
                <textarea
                  id="admin-2fa-reason"
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Optional reason for rotating your 2FA secret."
                  className="mt-2 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  disabled={rotateMutation.isPending}
                />

                <button
  type="button"
  onClick={handleRotate}
  disabled={rotateMutation.isPending}
  className="
    mt-3 inline-flex items-center justify-center
    rounded-lg px-4 py-3 font-semibold
    bg-gray-200 text-gray-700
    hover:bg-gray-300 focus:ring-2 focus:ring-gray-400
    transition-colors
    disabled:opacity-50 disabled:cursor-not-allowed
    dark:bg-gray-700 dark:text-gray-200
    dark:hover:bg-gray-600 dark:focus:ring-gray-500
  "
>
  {rotateMutation.isPending ? "Rotating..." : "Rotate TOTP"}
</button>

              </div>
            </div>
          </section>

          {message && (
            <section
              className={[
                "rounded-2xl border p-4 text-sm shadow-sm",
                message.type === "ok"
                  ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                  : "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
              ].join(" ")}
            >
              {message.text}
            </section>
          )}

          {latestSetup && (
            <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">New TOTP setup</h3>
              <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                This is shown after rotation. Save it now.
              </p>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">TOTP secret</div>
                  <div className="mt-2 break-all text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {latestSetup.totpSecret}
                  </div>
                  <div className="mt-3">
                    <CopyButton value={latestSetup.totpSecret} />
                  </div>
                </div>

                <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Provisioning URI</div>
                  <div className="mt-2 break-all text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    {latestSetup.totpProvisioningUri}
                  </div>
                  <div className="mt-3">
                    <CopyButton value={latestSetup.totpProvisioningUri} />
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}