// Path: apps/web/src/app/admin/login/page.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { clearAdminSession, getAdminToken, getStoredAdminIdentity } from "@/lib/admin/session";
import { extractApiErrorMessage, useAdminLogin } from "@/lib/admin/queries";

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminLogin();

  const [mounted, setMounted] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [totp, setTotp] = React.useState("");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const existingToken = mounted ? getAdminToken() : null;
  const existingIdentity = mounted ? getStoredAdminIdentity() : null;


  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    login.mutate(
  {
    email: email.trim(),
    password,
    totp: totp.trim(),
  },
  {
    onSuccess: async () => {
      // Let React Query and localStorage finish updating.
      await Promise.resolve();

      router.replace("/admin");
      router.refresh();
    },
  }
);
  }

  function handleClearSession() {
    clearAdminSession();
    setEmail("");
    setPassword("");
    setTotp("");
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6 flex items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              FixAndEarn Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Admin sign in
            </h1>
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Uses the live admin login endpoint with email, password, and TOTP.
            </p>
          </div>

          {existingToken ? (
            <div className="mt-4 rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-4">
              <p className="text-sm font-medium text-[#2E7D32] dark:text-green-200">
                Admin session already exists.
              </p>
              {existingIdentity ? (
                <p className="mt-1 text-sm text-[#2E7D32] dark:text-green-200">
                  {existingIdentity.fullName} · {existingIdentity.role}
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => router.replace("/admin")}
                  className="flex-1 rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
                >
                  Go to dashboard
                </button>
                <button
                  type="button"
                  onClick={handleClearSession}
                  className="flex-1 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] px-4 py-3 text-sm font-medium text-[#6B7C99] dark:text-[#8FA0BC] transition hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] hover:text-[#1A2B4A] dark:hover:text-[#E8F0FA]"
                >
                  Clear session
                </button>
              </div>
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="admin-email" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="Enter password"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-totp" className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                TOTP code
              </label>
              <input
                id="admin-totp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={totp}
                onChange={(event) => setTotp(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="6-digit authenticator code"
                required
              />
              <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                This backend expects a TOTP value in the login request payload.
              </p>
            </div>

            {login.isError && (
              <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                {extractApiErrorMessage(login.error)}
              </div>
            )}

            <button
              type="submit"
              disabled={login.isPending || !email.trim() || !password || !totp.trim()}
              className={[
                "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                login.isPending || !email.trim() || !password || !totp.trim()
                  ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                  : "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]",
              ].join(" ")}
            >
              {login.isPending ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}