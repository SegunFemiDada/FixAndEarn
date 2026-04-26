// Path: apps/web/src/app/admin/bootstrap/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useBootstrapStatus, useBootstrapSuperAdmin } from "@/lib/admin/setup/queries";
import { extractApiErrorMessage } from "@/lib/admin/queries";

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

export default function AdminBootstrapPage() {
  const statusQuery = useBootstrapStatus(true);
  const mutation = useBootstrapSuperAdmin();

  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [password, setPassword] = React.useState("");

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
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Bootstrap</p>
          <h1 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Super-admin initial setup</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Use this page only for first-time super-admin bootstrap when local bootstrap is enabled and no super-admin exists yet.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-2 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
            >
              Go to admin login
            </Link>
          </div>
        </section>

        {statusQuery.isLoading ? (
          <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Checking bootstrap status...</p>
          </section>
        ) : statusQuery.isError ? (
          <section className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <h2 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">Failed to load bootstrap status</h2>
            <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">{extractApiErrorMessage(statusQuery.error)}</p>
          </section>
        ) : !status ? null : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Bootstrap enabled</p>
                <div className="mt-3 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{status.enabled ? "Yes" : "No"}</div>
              </div>

              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Total admins</p>
                <div className="mt-3 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{status.totalAdmins}</div>
              </div>

              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Has super-admin</p>
                <div className="mt-3 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{status.hasSuperAdmin ? "Yes" : "No"}</div>
              </div>

              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-5 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <p className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Bootstrap allowed</p>
                <div className="mt-3 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">{status.allowBootstrap ? "Yes" : "No"}</div>
              </div>
            </section>

            {!status.allowBootstrap ? (
              <section className="rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <h2 className="text-lg font-semibold text-[#B45309] dark:text-amber-300">Bootstrap is not available</h2>
                <p className="mt-2 text-sm text-[#B45309] dark:text-amber-300/80">
                  Either bootstrap is disabled by environment config or a super-admin already exists. Use the normal admin login flow.
                </p>
              </section>
            ) : (
              <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                  <h2 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Create first super-admin</h2>

                  <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="bootstrap-full-name" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                        Full name
                      </label>
                      <input
                        id="bootstrap-full-name"
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                        placeholder="Super Admin"
                        disabled={mutation.isPending}
                      />
                    </div>

                    <div>
                      <label htmlFor="bootstrap-email" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                        Email
                      </label>
                      <input
                        id="bootstrap-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                        placeholder="admin@example.com"
                        disabled={mutation.isPending}
                      />
                    </div>

                    <div>
                      <label htmlFor="bootstrap-password" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                        Password
                      </label>
                      <input
                        id="bootstrap-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                        placeholder="Minimum 10 characters"
                        disabled={mutation.isPending}
                      />
                    </div>

                    {mutation.isError && (
                      <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                        {extractApiErrorMessage(mutation.error)}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={mutation.isPending}
                      className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {mutation.isPending ? "Creating..." : "Create super-admin"}
                    </button>
                  </form>
                </div>

                <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                  <h2 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">What happens next</h2>

                  <div className="mt-4 space-y-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                    <p>1. Create the first super-admin account.</p>
                    <p>2. Save the TOTP secret immediately.</p>
                    <p>3. Add the secret to your authenticator app.</p>
                    <p>4. Go to admin login and sign in with email, password, and TOTP code.</p>
                    <p>5. Use Admin management to create other admins.</p>
                  </div>

                  {mutation.data && (
                    <div className="mt-6 space-y-4 rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-4">
                      <div>
                        <p className="text-sm font-semibold text-[#2E7D32] dark:text-green-200">Super-admin created successfully</p>
                        <p className="mt-1 text-sm text-[#2E7D32] dark:text-green-200">
                          Save these setup details now. The secret is shown only at creation time.
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">TOTP secret</div>
                        <div className="mt-2 break-all text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {mutation.data.totpSecret}
                        </div>
                        <div className="mt-3">
                          <CopyButton value={mutation.data.totpSecret} />
                        </div>
                      </div>

                      <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-3">
                        <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">Provisioning URI</div>
                        <div className="mt-2 break-all text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                          {mutation.data.totpProvisioningUri}
                        </div>
                        <div className="mt-3">
                          <CopyButton value={mutation.data.totpProvisioningUri} />
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link
                          href="/admin/login"
                          className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
                        >
                          Continue to admin login
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}