"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPaymentStatus } from "@/lib/job-payments/api";

type State =
  | "VERIFYING"
  | "SUCCESS"
  | "FAILED"
  | "TIMEOUT";

export default function PaymentReturnPage() {
  const router = useRouter();
  const params = useSearchParams();

  const jobId = params.get("jobId");

  const [state, setState] =
    useState<State>("VERIFYING");

  useEffect(() => {
    if (!jobId) {
      setState("FAILED");
      return;
    }

    let cancelled = false;

    let attempts = 0;

    const maxAttempts = 30;

    const timer = setInterval(async () => {
      attempts++;

      try {
        const payment =
          await getPaymentStatus(jobId);

        if (cancelled) return;

        if (payment.status === "SUCCESS") {
          clearInterval(timer);

          setState("SUCCESS");

          setTimeout(() => {
            router.replace(`/jobs/${jobId}`);
          }, 1000);

          return;
        }

        if (payment.status === "FAILED") {
          clearInterval(timer);

          setState("FAILED");

          return;
        }
      } catch {}

      if (attempts >= maxAttempts) {
        clearInterval(timer);

        if (!cancelled) {
          setState("TIMEOUT");
        }
      }
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [jobId, router]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-6">
      <div className="w-full rounded-2xl border p-8 text-center">

        {state === "VERIFYING" && (
          <>
            <h1 className="text-2xl font-semibold">
              Verifying payment...
            </h1>

            <p className="mt-4 text-sm text-gray-500">
              Please wait while we confirm your payment.
              Do not close this page.
            </p>
          </>
        )}

        {state === "SUCCESS" && (
          <>
            <h1 className="text-2xl font-semibold text-green-600">
              Payment confirmed
            </h1>

            <p className="mt-4">
              Redirecting you back...
            </p>
          </>
        )}

        {state === "FAILED" && (
          <>
            <h1 className="text-2xl font-semibold text-red-600">
              Payment failed
            </h1>

            <p className="mt-4">
              Please return and try again.
            </p>
          </>
        )}

        {state === "TIMEOUT" && (
          <>
            <h1 className="text-2xl font-semibold">
              Still verifying...
            </h1>

            <p className="mt-4">
              Your payment may still be processing.
              You can safely close this page and
              return to your job later.
            </p>
          </>
        )}

      </div>
    </main>
  );
}