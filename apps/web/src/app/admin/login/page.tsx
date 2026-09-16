// Path: apps/web/src/app/admin/login/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  clearAdminSession,
  getAdminToken,
  getStoredAdminIdentity,
} from "@/lib/admin/session";
import { extractApiErrorMessage, useAdminLogin } from "@/lib/admin/queries";

const PANEL_CLASS =
  "rounded-3xl border border-[#C5D5EE] bg-white p-7 shadow-[0_8px_32px_rgba(91,143,204,0.14)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_8px_32px_rgba(0,0,0,0.40)]";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080] dark:focus:border-[#5B8FCC]";

const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600";

const SECONDARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl border border-[#C5D5EE] bg-white px-4 py-3 text-sm font-medium text-[#6B7C99] transition hover:bg-[#F4F8FF] hover:text-[#1A2B4A] focus:outline-none focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:text-[#8FA0BC] dark:hover:bg-[#16202E] dark:hover:text-[#E8F0FA]";

function StatusBadge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
      {children}
    </span>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminLogin();

  const [mounted, setMounted] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [totp, setTotp] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const existingToken = mounted ? getAdminToken() : null;
  const existingIdentity = mounted ? getStoredAdminIdentity() : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    login.mutate(
      {
        email: email.trim(),
        password,
        totp: totp.trim(),
      },
      {
        onSuccess: async () => {
          router.replace("/admin");
          router.refresh();
        },
      },
    );
  }

  function handleClearSession() {
    clearAdminSession();
    setEmail("");
    setPassword("");
    setTotp("");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] via-[#D6E4F7] to-[#E8F0FA] px-4 py-8 dark:bg-[#111827] dark:bg-none">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="hidden rounded-3xl border border-[#C5D5EE] bg-[#1A2B4A] p-8 shadow-[0_8px_32px_rgba(26,43,74,0.18)] lg:flex lg:flex-col lg:justify-between dark:border-[#2D3F55] dark:bg-[#16202E] dark:shadow-[0_8px_32px_rgba(0,0,0,0.40)]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9FC1EA]">
                FixAndEarn
              </p>

              <h2 className="mt-3 text-3xl font-semibold leading-tight text-white">
                Admin control centre
              </h2>

              <p className="mt-4 max-w-md text-sm leading-6 text-[#C5D5EE]">
                Secure access to platform operations, user management,
                payments, verification, moderation, analytics, and system
                settings.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9FC1EA]">
                  Authentication
                </p>

                <p className="mt-2 text-sm leading-6 text-[#D9E5F5]">
                  Admin access requires your email, password, and current
                  authenticator code.
                </p>
              </div>

              <p className="text-xs leading-5 text-[#AFC2DB]">
                Keep your authenticator device available before signing in.
              </p>
            </div>
          </section>

          <section className={PANEL_CLASS}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                FixAndEarn Admin
              </p>

              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Admin sign in
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                    Sign in using your admin credentials and current TOTP
                    authenticator code.
                  </p>
                </div>

                <span className="inline-flex shrink-0 rounded-full border border-[#C5D5EE] bg-[#F4F8FF] px-2.5 py-1 text-xs font-semibold text-[#6B7C99] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#8FA0BC]">
                  Secure access
                </span>
              </div>
            </div>

            {existingToken ? (
              <section className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-green-700 dark:text-green-300">
                      Existing session
                    </p>

                    <div className="mt-2">
                      <StatusBadge>Admin session already exists</StatusBadge>
                    </div>

                    {existingIdentity ? (
                      <p className="mt-3 text-sm text-green-700 dark:text-green-200">
                        {existingIdentity.fullName} ·{" "}
                        {existingIdentity.role}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => router.replace("/admin")}
                    className={PRIMARY_BUTTON_CLASS}
                  >
                    Go to dashboard
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSession}
                    className={SECONDARY_BUTTON_CLASS}
                  >
                    Clear session
                  </button>
                </div>
              </section>
            ) : null}

            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                >
                  Email
                </label>

                <input
                  id="admin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="admin@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                >
                  Password
                </label>

                <div className="relative mt-1">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={`${INPUT_CLASS} pr-12`}
                    placeholder="Enter password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center px-4 text-[#6B7C99] transition hover:text-[#5B8FCC] dark:text-[#8FA0BC] dark:hover:text-[#7AAEE0]"
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
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573 3.007-9.963 7.178z"
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
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1 4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 1-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="admin-totp"
                    className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
                  >
                    TOTP code
                  </label>

                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6B7C99] dark:text-[#8FA0BC]">
                    Authenticator
                  </span>
                </div>

                <input
                  id="admin-totp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={totp}
                  onChange={(event) => setTotp(event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="6-digit authenticator code"
                  required
                />

                <p className="mt-2 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Enter the current code generated by your authenticator app.
                </p>
              </div>

              {login.isError ? (
                <div className="rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] p-4 dark:border-red-700 dark:bg-red-900/20">
                  <p className="text-sm font-medium text-[#D9534F] dark:text-red-300">
                    {extractApiErrorMessage(login.error)}
                  </p>
                </div>
              ) : null}

              <div className="border-t border-[#E3EBF6] pt-5 dark:border-[#2D3F55]">
                <button
                  type="submit"
                  disabled={
                    login.isPending ||
                    !email.trim() ||
                    !password ||
                    !totp.trim()
                  }
                  className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_2px_12px_rgba(37,99,235,0.25)] transition hover:bg-blue-700 hover:shadow-[0_4px_16px_rgba(37,99,235,0.30)] focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {login.isPending ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}