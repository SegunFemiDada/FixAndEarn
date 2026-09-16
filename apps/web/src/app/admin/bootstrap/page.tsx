// Path: apps/web/src/app/admin/bootstrap/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  useBootstrapStatus,
  useBootstrapSuperAdmin,
} from "@/lib/admin/setup/queries";
import { extractApiErrorMessage } from "@/lib/admin/queries";

const PANEL_CLASS =
  "rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.10)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]";

const SUBPANEL_CLASS =
  "rounded-xl border border-[#C5D5EE] bg-[#F8FAFD] dark:border-[#2D3F55] dark:bg-[#16202E]";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080] dark:focus:border-[#5B8FCC]";

const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600";

const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] bg-white px-4 py-2 text-sm font-medium text-[#6B7C99] transition hover:bg-[#F4F8FF] hover:text-[#1A2B4A] focus:outline-none focus:ring-2 focus:ring-[#5B8FCC]/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FA0BC] dark:hover:bg-[#16202E] dark:hover:text-[#E8F0FA]";

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
      className={SECONDARY_BUTTON_CLASS}
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

function StatusCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "success" | "warning" | "neutral";
}) {
  return (
    <section className={PANEL_CLASS}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
        {label}
      </p>

      <div className="mt-3">
        <StatusValue value={value} tone={tone} />
      </div>
    </section>
  );
}

function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
        {label}
      </p>

      <div className="mt-1 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
        {children}
      </div>
    </div>
  );
}

export default function AdminBootstrapPage() {
  const statusQuery = useBootstrapStatus(true);
  const mutation = useBootstrapSuperAdmin();

  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    mutation.mutate({
      email: email.trim(),
      fullName: fullName.trim(),
      password,
    });
  }

  const status = statusQuery.data;

  return (
    <div className="space-y-6">
      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Bootstrap
            </p>

            <h1 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Super-admin initial setup
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              Use this page only for first-time super-admin bootstrap when
              local bootstrap is enabled and no super-admin exists yet.
            </p>
          </div>

          <Link href="/admin/login" className={SECONDARY_BUTTON_CLASS}>
            Go to admin login
          </Link>
        </div>
      </section>

      {statusQuery.isLoading ? (
        <section className={PANEL_CLASS}>
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />

            <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Checking bootstrap status...
            </p>
          </div>
        </section>
      ) : statusQuery.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] bg-[#FFF4F3] p-6 dark:border-red-700 dark:bg-red-900/20">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#D9534F] dark:text-red-300">
            Bootstrap status
          </p>

          <h2 className="mt-1 text-lg font-semibold text-[#D9534F] dark:text-red-300">
            Failed to load bootstrap status
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(statusQuery.error)}
          </p>
        </section>
      ) : !status ? null : (
        <>
          <section>
            <div className="mb-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                Environment status
              </p>

              <h2 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Bootstrap readiness
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatusCard
                label="Bootstrap enabled"
                value={status.enabled ? "Yes" : "No"}
                tone={status.enabled ? "success" : "warning"}
              />

              <StatusCard
                label="Total admins"
                value={String(status.totalAdmins)}
              />

              <StatusCard
                label="Has super-admin"
                value={status.hasSuperAdmin ? "Yes" : "No"}
                tone={status.hasSuperAdmin ? "success" : "warning"}
              />

              <StatusCard
                label="Bootstrap allowed"
                value={status.allowBootstrap ? "Yes" : "No"}
                tone={status.allowBootstrap ? "success" : "warning"}
              />
            </div>
          </section>

          {!status.allowBootstrap ? (
            <section className="rounded-2xl border border-[#F5A623] bg-[#FEF8E7] p-6 dark:border-amber-700 dark:bg-amber-900/20">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#B45309] dark:text-amber-300">
                    Bootstrap unavailable
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-[#B45309] dark:text-amber-300">
                    Bootstrap is not available
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#B45309] dark:text-amber-300/80">
                    Either bootstrap is disabled by environment config or a
                    super-admin already exists. Use the normal admin login
                    flow.
                  </p>
                </div>

                <Link
                  href="/admin/login"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#B45309] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#92400E] focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  Go to admin login
                </Link>
              </div>
            </section>
          ) : (
            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
              <section className={PANEL_CLASS}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                    Account creation
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Create first super-admin
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                    Create the initial privileged administrator account. This
                    flow is available only while bootstrap is allowed.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="bootstrap-full-name"
                        className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                      >
                        Full name
                      </label>

                      <input
                        id="bootstrap-full-name"
                        type="text"
                        value={fullName}
                        onChange={(event) =>
                          setFullName(event.target.value)
                        }
                        className={INPUT_CLASS}
                        placeholder="Super Admin"
                        disabled={mutation.isPending}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="bootstrap-email"
                        className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                      >
                        Email
                      </label>

                      <input
                        id="bootstrap-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={INPUT_CLASS}
                        placeholder="admin@example.com"
                        disabled={mutation.isPending}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="bootstrap-password"
                      className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                    >
                      Password
                    </label>

                    <div className="relative mt-1">
                      <input
                        id="bootstrap-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        className={`${INPUT_CLASS} pr-12`}
                        placeholder="Minimum 10 characters"
                        disabled={mutation.isPending}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#6B7C99] transition hover:text-[#5B8FCC] dark:text-[#8FA0BC] dark:hover:text-[#7AAEE0]"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                            />

                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {mutation.isError ? (
                    <div className="rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] p-4 dark:border-red-700 dark:bg-red-900/20">
                      <p className="text-sm font-medium text-[#D9534F] dark:text-red-300">
                        {extractApiErrorMessage(mutation.error)}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E3EBF6] pt-5 dark:border-[#2D3F55]">
                    <p className="max-w-xl text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                      After creation, save the TOTP secret immediately and
                      configure it in your authenticator app.
                    </p>

                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className={PRIMARY_BUTTON_CLASS}
                    >
                      {mutation.isPending
                        ? "Creating..."
                        : "Create super-admin"}
                    </button>
                  </div>
                </form>
              </section>

              <section className={PANEL_CLASS}>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                    Post-creation
                  </p>

                  <h2 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    What happens next
                  </h2>
                </div>

                <div className={`${SUBPANEL_CLASS} mt-5 p-5`}>
                  <ol className="space-y-4">
                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        1
                      </span>

                      <p className="text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                        Create the first super-admin account.
                      </p>
                    </li>

                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        2
                      </span>

                      <p className="text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                        Save the TOTP secret immediately.
                      </p>
                    </li>

                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        3
                      </span>

                      <p className="text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                        Add the secret to your authenticator app.
                      </p>
                    </li>

                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        4
                      </span>

                      <p className="text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                        Go to admin login and sign in with email, password,
                        and TOTP code.
                      </p>
                    </li>

                    <li className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        5
                      </span>

                      <p className="text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                        Use Admin management to create other admins.
                      </p>
                    </li>
                  </ol>
                </div>

                {mutation.data ? (
                  <div className="mt-5 space-y-4 rounded-xl border border-[#B8D9B8] bg-[#F0FAF0] p-5 dark:border-green-700 dark:bg-green-900/20">
                    <div>
                      <p className="text-sm font-semibold text-[#2E7D32] dark:text-green-200">
                        Super-admin created successfully
                      </p>

                      <p className="mt-1 text-sm leading-6 text-[#2E7D32] dark:text-green-200">
                        Save these setup details now. The secret is shown only
                        at creation time.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className={`${SUBPANEL_CLASS} bg-white p-4 dark:bg-[#1E2A3A]`}>
                        <DetailField label="TOTP secret">
                          <p className="break-all font-semibold">
                            {mutation.data.totpSecret}
                          </p>
                        </DetailField>

                        <div className="mt-3">
                          <CopyButton value={mutation.data.totpSecret} />
                        </div>
                      </div>

                      <div className={`${SUBPANEL_CLASS} bg-white p-4 dark:bg-[#1E2A3A]`}>
                        <DetailField label="Provisioning URI">
                          <p className="break-all">
                            {mutation.data.totpProvisioningUri}
                          </p>
                        </DetailField>

                        <div className="mt-3">
                          <CopyButton
                            value={mutation.data.totpProvisioningUri}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        href="/admin/login"
                        className={PRIMARY_BUTTON_CLASS}
                      >
                        Continue to admin login
                      </Link>
                    </div>
                  </div>
                ) : null}
              </section>
            </section>
          )}
        </>
      )}
    </div>
  );
}