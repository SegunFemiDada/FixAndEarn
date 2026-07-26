"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";

type PaymentStatusResponse = {
  paid: boolean;
  status: string | null;
  type: string | null;
  jobId: string;
};

type ViewState = "VERIFYING" | "SUCCESS" | "FAILED" | "TIMEOUT";

export default function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const jobId = searchParams.get("jobId")?.trim() ?? "";
  const paymentType = searchParams.get("type")?.trim() ?? "";

  const [state, setState] = useState<ViewState>("VERIFYING");
  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (!jobId) {
      setState("FAILED");
      return;
    }

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 30;
    let timeoutId: number | null = null;

    const poll = async () => {
      if (cancelled) return;

      attempts += 1;

      try {
        const { data } = await apiClient.get<PaymentStatusResponse>(
          `/job-payments/status/${jobId}`,
        );

        if (cancelled) return;

        if (data.status === "SUCCESS") {
          setState("SUCCESS");

          if (!didRedirectRef.current) {
            didRedirectRef.current = true;

            window.setTimeout(() => {
              router.replace(`/app/jobs/${jobId}`);
            }, 1000);
          }

          return;
        }

        if (data.status === "FAILED") {
          setState("FAILED");
          return;
        }
      } catch {
        // keep polling unless we hit timeout
      }

      if (attempts >= maxAttempts) {
        setState("TIMEOUT");
        return;
      }

      timeoutId = window.setTimeout(poll, 2000);
    };

    timeoutId = window.setTimeout(poll, 0);

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [jobId, router]);

  return (
    <main className="min-h-screen bg-[#F4F8FF] px-4 py-10 dark:bg-[#0F172A]">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          {state === "VERIFYING" && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Verifying payment...
                </h1>
                <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                  Please wait while we confirm your {paymentType ? paymentType.toLowerCase() : ""} payment.
                  Do not close this page.
                </p>
              </div>
            </>
          )}

          {state === "SUCCESS" && (
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-green-600 dark:text-green-400">
                Payment confirmed
              </h1>
              <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Your job is now active. Redirecting you back...
              </p>
            </div>
          )}

          {state === "FAILED" && (
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-red-600 dark:text-red-400">
                Payment failed
              </h1>
              <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                We could not confirm this payment. Please return and try again.
              </p>
            </div>
          )}

          {state === "TIMEOUT" && (
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Still verifying...
              </h1>
              <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Payment confirmation is taking longer than expected. You can safely return later.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}