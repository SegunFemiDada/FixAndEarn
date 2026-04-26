// path: apps/web/src/app/resend-verification/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useResendVerification, extractAuthErrorMessage } from "@/lib/auth/queries";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const resend = useResendVerification();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    resend.mutate(
      { email: email.trim() },
      {
        onSuccess: () => {
          setMsg("Verification email sent. Check your inbox.");
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6 flex items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              FixAndEarn
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Resend verification
            </h1>
            <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Enter your email to receive a new verification link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {resend.isError && (
              <div className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                {extractAuthErrorMessage(resend.error) ??
                  "Something went wrong. Try again."}
              </div>
            )}

            {msg && (
              <div className="rounded-2xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
                {msg}
              </div>
            )}

            <button
              type="submit"
              disabled={resend.isPending || !email.trim()}
              className={[
                "inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                resend.isPending || !email.trim()
                  ? "cursor-not-allowed bg-[#EAF0FB] dark:bg-[#1E2A3A] text-[#9BAEC8] dark:text-[#4A6080] border border-[#C5D5EE] dark:border-[#2D3F55]"
                  : "bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] text-white shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]",
              ].join(" ")}
            >
              {resend.isPending ? "Sending..." : "Resend verification"}
            </button>
          </form>

          <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Back to{" "}
            <Link
              href="/login"
              className="font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
            >
              login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}