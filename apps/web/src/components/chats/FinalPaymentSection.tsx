"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  role: "client" | "fixer";
  jobStatus: string | null | undefined;
  negotiationStatus: string | null | undefined;
  agreedAt: string | null | undefined;
  paymentPendingForClient: boolean;
  initializing: boolean;
  onContinuePayment: () => void | Promise<void>;
};

const PAYMENT_WINDOW_MS = 60 * 60 * 1000;

function formatRemaining(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
}

export default function FinalPaymentSection({
  role,
  jobStatus,
  negotiationStatus,
  agreedAt,
  paymentPendingForClient,
  initializing,
  onContinuePayment,
}: Props) {
  const expiryAt = useMemo(() => {
    if (!agreedAt) return null;

    const agreedTime = new Date(agreedAt).getTime();

    if (!Number.isFinite(agreedTime)) return null;

    return agreedTime + PAYMENT_WINDOW_MS;
  }, [agreedAt]);

  const [remainingMs, setRemainingMs] = useState(() => {
    if (!expiryAt) return 0;
    return Math.max(0, expiryAt - Date.now());
  });

  useEffect(() => {
    if (!expiryAt) {
      setRemainingMs(0);
      return;
    }

    const update = () => {
      setRemainingMs(Math.max(0, expiryAt - Date.now()));
    };

    update();

    const timer = window.setInterval(update, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [expiryAt]);

  const isAgreed =
    negotiationStatus === "AGREED";

  const isJobStillOpen =
    jobStatus === "OPEN";

  const hasTimeRemaining =
    remainingMs > 0;

  const showSection =
    isAgreed &&
    isJobStillOpen;

  if (!showSection) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        Price Agreed
      </div>

      <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        The agreed price is locked. The job will only move to IN PROGRESS
        after the client&apos;s payment is successfully confirmed.
      </p>

      {hasTimeRemaining ? (
        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wide text-[#6B7C99] dark:text-[#8FA0BC]">
            Payment window remaining
          </div>

          <div className="mt-1 text-2xl font-bold text-[#1A2B4A] dark:text-[#E8F0FA]">
            {formatRemaining(remainingMs)}
          </div>
        </div>
      ) : (
        <div className="mt-4 text-sm font-semibold text-red-600 dark:text-red-400">
          The 60-minute payment window has expired.
        </div>
      )}

      {role === "client" && paymentPendingForClient && (
        <Button
          type="button"
          disabled={
            initializing ||
            !hasTimeRemaining
          }
          onClick={onContinuePayment}
          className="mt-4 w-full"
        >
          {initializing
            ? "Opening Payment..."
            : "Continue to Payment"}
        </Button>
      )}

      {role === "fixer" && hasTimeRemaining && (
        <p className="mt-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Waiting for the client to complete payment.
        </p>
      )}
    </section>
  );
}