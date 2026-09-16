"use client";

import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useAdminOwn2faRotate,
  useAdminOwn2faStatus,
  useAdminOwn2faVerify,
} from "@/lib/admin/twofa/queries";

const PANEL_CLASS =
  "rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.10)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]";

const SUBPANEL_CLASS =
  "rounded-xl border border-[#C5D5EE] bg-[#F8FAFD] dark:border-[#2D3F55] dark:bg-[#16202E]";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080] dark:focus:border-[#5B8FCC]";

const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600";

const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:focus:ring-gray-500";

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
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] bg-white px-3 py-2 text-sm font-medium text-[#6B7C99] transition hover:bg-[#F4F8FF] hover:text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FA0BC] dark:hover:bg-[#16202E] dark:hover:text-[#E8F0FA]"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function StatusValue({
  value,
  tone = "neutral",
}: {
  value: string;
  tone?: "success" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "success"
      ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        : "border-[#C5D5EE] bg-[#F4F8FF] text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}
    >
      {value}
    </span>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
        {label}
      </p>
      <div className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
        {value}
      </div>
    </div>
  );
}

export default function Admin2faPage() {
  const statusQuery = useAdminOwn2faStatus(true);
  const verifyMutation = useAdminOwn2faVerify();
  const rotateMutation = useAdminOwn2faRotate();

  const [totp, setTotp] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [message, setMessage] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

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
          setMessage({
            type: "ok",
            text: "TOTP verified successfully.",
          });
          setTotp("");
        },
        onError: (error) => {
          setMessage({
            type: "err",
            text: extractApiErrorMessage(error),
          });
        },
      },
    );
  }

  function handleRotate() {
    setMessage(null);

    const confirmed = window.confirm(
      "Rotate your current TOTP secret? You must save the new secret immediately or you may lock yourself out.",
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

          setMessage({
            type: "ok",
            text: "TOTP rotated successfully. Save the new setup details now.",
          });
        },
        onError: (error) => {
          setMessage({
            type: "err",
            text: extractApiErrorMessage(error),
          });
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Security
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Admin two-factor authentication
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              Review your current 2FA status, verify your authenticator code,
              and rotate your TOTP secret when necessary.
            </p>
          </div>

          {statusQuery.data ? (
            <div className="shrink-0">
              <StatusValue
                value={
                  statusQuery.data.admin.is2faEnabled
                    ? "2FA Enabled"
                    : "2FA Not Enabled"
                }
                tone={
                  statusQuery.data.admin.is2faEnabled
                    ? "success"
                    : "warning"
                }
              />
            </div>
          ) : null}
        </div>
      </section>

      {statusQuery.isLoading ? (
        <section className={PANEL_CLASS}>
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading 2FA status...
          </p>
        </section>
      ) : statusQuery.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] bg-[#FFF4F3] p-6 dark:border-red-700 dark:bg-red-900/20">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">
            Failed to load 2FA status
          </h3>

          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(statusQuery.error)}
          </p>
        </section>
      ) : !statusQuery.data ? null : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className={PANEL_CLASS}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                2FA enabled
              </p>

              <div className="mt-3">
                <StatusValue
                  value={statusQuery.data.admin.is2faEnabled ? "Yes" : "No"}
                  tone={
                    statusQuery.data.admin.is2faEnabled
                      ? "success"
                      : "warning"
                  }
                />
              </div>
            </div>

            <div className={PANEL_CLASS}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                Policy enforced
              </p>

              <div className="mt-3">
                <StatusValue
                  value={statusQuery.data.policy.enforced ? "Yes" : "No"}
                  tone={
                    statusQuery.data.policy.enforced
                      ? "success"
                      : "warning"
                  }
                />
              </div>
            </div>

            <div className={PANEL_CLASS}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                Backup codes
              </p>

              <div className="mt-3">
                <StatusValue
                  value={
                    statusQuery.data.policy.backupCodesSupported
                      ? "Supported"
                      : "Not enabled"
                  }
                  tone={
                    statusQuery.data.policy.backupCodesSupported
                      ? "success"
                      : "neutral"
                  }
                />
              </div>
            </div>

            <div className={PANEL_CLASS}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                Role
              </p>

              <p className="mt-3 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {statusQuery.data.admin.role}
              </p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className={PANEL_CLASS}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                    Verification
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Verify current authenticator
                  </h3>
                </div>

                <span className="rounded-lg border border-[#C5D5EE] bg-[#F4F8FF] px-2.5 py-1 text-xs font-semibold text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]">
                  TOTP
                </span>
              </div>

              <div className={`${SUBPANEL_CLASS} mt-5 p-5`}>
                <label
                  htmlFor="admin-2fa-code"
                  className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                >
                  Current authenticator code
                </label>

                <input
                  id="admin-2fa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={totp}
                  onChange={(event) => setTotp(event.target.value)}
                  placeholder="Enter current authenticator code"
                  className={INPUT_CLASS}
                  disabled={verifyMutation.isPending}
                />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={verifyMutation.isPending || !totp.trim()}
                    className={PRIMARY_BUTTON_CLASS}
                  >
                    {verifyMutation.isPending
                      ? "Verifying..."
                      : "Verify TOTP"}
                  </button>

                  <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Use the current code from your authenticator app.
                  </p>
                </div>
              </div>
            </section>

            <section className={PANEL_CLASS}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                  Credential management
                </p>

                <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Rotate TOTP secret
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Rotating invalidates the previous authenticator setup. Save
                  the new secret immediately after rotation.
                </p>
              </div>

              <div className={`${SUBPANEL_CLASS} mt-5 p-5`}>
                <label
                  htmlFor="admin-2fa-reason"
                  className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                >
                  Rotation reason
                </label>

                <textarea
                  id="admin-2fa-reason"
                  rows={4}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Optional reason for rotating your 2FA secret."
                  className={`${INPUT_CLASS} max-h-36 resize-y overflow-y-auto`}
                  disabled={rotateMutation.isPending}
                />

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRotate}
                    disabled={rotateMutation.isPending}
                    className={SECONDARY_BUTTON_CLASS}
                  >
                    {rotateMutation.isPending
                      ? "Rotating..."
                      : "Rotate TOTP"}
                  </button>

                  <p className="text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Rotation requires confirmation before the existing secret
                    is replaced.
                  </p>
                </div>
              </div>
            </section>
          </section>

          <section className={PANEL_CLASS}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                  Admin account
                </p>

                <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Current security identity
                </h3>
              </div>

              <StatusValue
                value={statusQuery.data.admin.isActive ? "Active" : "Inactive"}
                tone={
                  statusQuery.data.admin.isActive ? "success" : "warning"
                }
              />
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <DetailField
                label="Admin"
                value={statusQuery.data.admin.fullName}
              />

              <DetailField
                label="Email"
                value={
                  <span className="break-all">
                    {statusQuery.data.admin.email}
                  </span>
                }
              />

              <DetailField
                label="Created"
                value={formatDateTime(statusQuery.data.admin.createdAt)}
              />

              <DetailField
                label="Updated"
                value={formatDateTime(statusQuery.data.admin.updatedAt)}
              />
            </div>
          </section>

          {message ? (
            <section
              role="status"
              className={[
                "rounded-2xl border p-4 text-sm",
                message.type === "ok"
                  ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                  : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
              ].join(" ")}
            >
              {message.text}
            </section>
          ) : null}

          {latestSetup ? (
            <section className={PANEL_CLASS}>
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                  New credentials
                </p>

                <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  New TOTP setup
                </h3>

                <p className="text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  This information is shown after rotation. Save the new setup
                  details now and update your authenticator application.
                </p>
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className={`${SUBPANEL_CLASS} p-5`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                    TOTP secret
                  </p>

                  <p className="mt-2 break-all rounded-lg border border-[#C5D5EE] bg-white px-3 py-3 font-mono text-sm font-semibold text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA]">
                    {latestSetup.totpSecret}
                  </p>

                  <div className="mt-3">
                    <CopyButton value={latestSetup.totpSecret} />
                  </div>
                </div>

                <div className={`${SUBPANEL_CLASS} p-5`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                    Provisioning URI
                  </p>

                  <p className="mt-2 max-h-36 overflow-y-auto break-all rounded-lg border border-[#C5D5EE] bg-white px-3 py-3 font-mono text-xs leading-5 text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#E8F0FA]">
                    {latestSetup.totpProvisioningUri}
                  </p>

                  <div className="mt-3">
                    <CopyButton value={latestSetup.totpProvisioningUri} />
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                Save these setup details before leaving this page. The previous
                TOTP secret has already been invalidated by the rotation.
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}