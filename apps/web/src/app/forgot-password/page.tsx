// path: apps/web/src/app/forgot-password/page.tsx
"use client";

import Link from "next/link";
import * as React from "react";
import { extractAuthErrorMessage, useForgotPassword } from "@/lib/auth/queries";

export default function ForgotPasswordPage() {
  const mutation = useForgotPassword();

  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [debugResetUrl, setDebugResetUrl] = React.useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage(null);
    setDebugResetUrl(null);

    mutation.mutate(
      {
        email: email.trim(),
      },
      {
        onSuccess: (response) => {
          setMessage(response.message);
          setDebugResetUrl(response.resetUrl ?? null);
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6 flex items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              FixAndEarn
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Forgot password
            </h1>
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Enter your email to reset your password.
            </p>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="forgot-password-email"
                className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]"
              >
                Email
              </label>
              <input
                id="forgot-password-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                placeholder="you@example.com"
                required
              />
            </div>

            {mutation.isError && (
              <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                {extractAuthErrorMessage(mutation.error) ??
                  "Something went wrong. Try again."}
              </div>
            )}

            {message && (
              <div className="rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
                {message}
              </div>
            )}

            {/* DEV ONLY: hide in production UI */}
            {false && debugResetUrl && (
              <div className="rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-3 text-sm text-[#B45309] dark:text-amber-300">
                <div className="font-medium">Development reset link</div>
                <a
                  href={debugResetUrl ?? undefined}
                  className="mt-2 block break-all underline"
                >
                  {debugResetUrl}
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending || !email.trim()}
              className={[
                "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                mutation.isPending || !email.trim()
                  ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                  : "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]",
              ].join(" ")}
            >
              {mutation.isPending ? "Submitting..." : "Continue"}
            </button>
          </form>

          <div className="mt-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Remembered your password?{" "}
            <Link
              className="font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
              href="/login"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}