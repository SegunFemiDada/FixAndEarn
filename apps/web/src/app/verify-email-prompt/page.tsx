//path: apps/web/src/app/verify-email-prompt/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { clearSession } from "@/lib/auth/session";

function Inner() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  useEffect(() => {
    // Clear any existing session to prevent confusion after registration
    clearSession();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6 flex items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              FixAndEarn
            </p>
            <h1 className="mt-1 text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Verify your email
            </h1>
          </div>

          <div className="space-y-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            <p>
              We&apos;ve sent a verification link to{" "}
              <span className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">{email || "your email"}</span>.
            </p>
            <p>
              Click the link in the email to verify your account. After verification,
              you can log in and start using FixAndEarn.
            </p>
            <p>
              Didn&apos;t receive the email?{" "}
              <Link
                href="/resend-verification"
                className="font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
              >
                Resend verification
              </Link>
            </p>
          </div>

          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2.5 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fallback() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6 flex items-center justify-center">
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPromptPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <Inner />
    </Suspense>
  );
}