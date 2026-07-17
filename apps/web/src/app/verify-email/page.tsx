//path: apps/web/src/app/verify-email/page.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

function Inner() {
  const params = useSearchParams();
  const router = useRouter();

  const token = params.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "invalid">("verifying");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    apiClient
      .post("/auth/verify-email", { token })
      .then(() => {
        setStatus("success");
        setTimeout(() => router.replace("/app/select-role"), 2000);
      })
      .catch(() => {
        setStatus("invalid");
      });
  }, [token, router]);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
          FixAndEarn
        </p>

        {status === "verifying" && (
          <>
            <h1 className="mt-2 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Verifying email
            </h1>
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Please wait...
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h1 className="mt-2 text-lg font-semibold text-[#2E7D32] dark:text-green-200">
              Email verified
            </h1>
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Redirecting to select role...
            </p>
          </>
        )}

        {status === "invalid" && (
          <>
            <h1 className="mt-2 text-lg font-semibold text-[#D9534F] dark:text-red-300">
              Invalid or expired link
            </h1>
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              This verification link is not valid or has expired.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Fallback() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] text-center">
        <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Loading...
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Fallback />}>
      <Inner />
    </Suspense>
  );
}