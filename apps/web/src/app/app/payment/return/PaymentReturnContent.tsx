"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import apiClient from "@/lib/apiClient";

type PaymentVerificationResponse = {
  paid: boolean;
  status: string | null;
  type: string | null;
  jobId: string;
};

type PaymentStatusResponse = {
  paid: boolean;
  status: string | null;
  type: string | null;
  jobId: string;
};

type ViewState =
  | "VERIFYING"
  | "SUCCESS"
  | "FAILED"
  | "TIMEOUT";

export default function PaymentReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentReference =
    searchParams.get("paymentReference")?.trim() ??
    searchParams.get("paymentreference")?.trim() ??
    "";

  const [state, setState] =
    useState<ViewState>("VERIFYING");

  const [resolvedJobId, setResolvedJobId] =
    useState("");

  const [resolvedPaymentType, setResolvedPaymentType] =
    useState("");

  const resolvedJobIdRef = useRef("");

  const didRedirectRef = useRef(false);

  useEffect(() => {
    if (!paymentReference) {
      setState("FAILED");
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const maxAttempts = 60;

    let timeoutId: number | null = null;

    const redirectToJob = (jobId: string) => {
      if (didRedirectRef.current || !jobId) {
        return;
      }

      didRedirectRef.current = true;

      window.setTimeout(() => {
        router.replace(`/app/jobs/${jobId}`);
      }, 1000);
    };

    const poll = async () => {
      if (cancelled) {
        return;
      }

      attempts += 1;

      try {
        /*
         * Verify directly with Monnify through our backend
         * on the first attempt and then every 10 seconds.
         *
         * The browser never decides whether payment succeeded.
         */
        if (attempts === 1 || attempts % 5 === 0) {
          const { data } =
            await apiClient.post<PaymentVerificationResponse>(
              "/job-payments/verify",
              {
                paymentReference,
              },
            );

          if (cancelled) {
            return;
          }

          /*
           * The backend resolves the job and payment type
           * from the paymentReference.
           */
          if (data.jobId) {
            resolvedJobIdRef.current = data.jobId;
            setResolvedJobId(data.jobId);
          }

          if (data.type) {
            setResolvedPaymentType(data.type);
          }

          if (data.status === "SUCCESS") {
            setState("SUCCESS");
            redirectToJob(data.jobId);
            return;
          }

          if (
            data.status === "FAILED" ||
            data.status === "EXPIRED" ||
            data.status === "REVERSED"
          ) {
            setState("FAILED");
            return;
          }
        } else {
          /*
           * Between direct Monnify verification attempts,
           * check our own database.
           *
           * This is only possible after the first successful
           * backend verification has resolved the jobId.
           */
          const jobId = resolvedJobIdRef.current;

          if (jobId) {
            const { data } =
              await apiClient.get<PaymentStatusResponse>(
                `/job-payments/status/${jobId}`,
              );

            if (cancelled) {
              return;
            }

            if (data.type) {
              setResolvedPaymentType(data.type);
            }

            if (data.status === "SUCCESS") {
              setState("SUCCESS");
              redirectToJob(data.jobId || jobId);
              return;
            }

            if (
              data.status === "FAILED" ||
              data.status === "EXPIRED"
            ) {
              setState("FAILED");
              return;
            }
          }
        }
      } catch {
        /*
         * A temporary API/provider failure should not
         * immediately declare the payment failed.
         *
         * Continue polling until the timeout.
         */
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

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [paymentReference, router]);

  return (
    <main className="min-h-screen bg-[#F4F8FF] px-4 py-10 dark:bg-[#0F172A]">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-sm dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
          {state === "VERIFYING" && (
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Verifying payment...
              </h1>

              <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Please wait while we confirm your{" "}
                {resolvedPaymentType
                  ? resolvedPaymentType.toLowerCase()
                  : "payment"}
                . Do not close this page.
              </p>
            </div>
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
                We could not confirm this payment. Please return
                and try again.
              </p>
            </div>
          )}

          {state === "TIMEOUT" && (
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Still verifying...
              </h1>

              <p className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Payment confirmation is taking longer than
                expected. You can safely return later.
              </p>

              {resolvedJobId && (
                <button
                  type="button"
                  onClick={() =>
                    router.replace(`/app/jobs/${resolvedJobId}`)
                  }
                  className="mt-5 rounded-xl bg-[#1A2B4A] px-5 py-3 text-sm font-semibold text-white"
                >
                  Return to job
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}