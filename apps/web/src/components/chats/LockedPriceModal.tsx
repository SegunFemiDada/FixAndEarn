"use client";

import { Button } from "@/components/ui/Button";

type Props = {
  lockedPrice: number | null;
  onAccept: () => void;
  onReject: () => void;
  busy: boolean;
};

function fmtFecFromMilli(milli?: number | null): string {
  if (typeof milli !== "number") return "—";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

export default function LockedPriceModal({
  lockedPrice,
  onAccept,
  onReject,
  busy,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm space-y-5 rounded-xl bg-white p-6 shadow-lg dark:bg-[#1E2A3A]">
        <div>
          <div className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Locked Price
          </div>

          <div className="mt-3 text-sm leading-6 text-[#516786] dark:text-[#AAB9D0]">
            The price has been locked at{" "}
            <strong className="text-[#1A2B4A] dark:text-[#E8F0FA]">
              {fmtFecFromMilli(lockedPrice)}
            </strong>
            .
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          <p className="font-semibold">
            Important: Workmanship price only
          </p>

          <p className="mt-1">
            The locked price is for workmanship/service ONLY. Materials,
            spare parts, equipment, and other physical items required for
            the job are not included in this amount.
          </p>

          <p className="mt-2">
            Please confirm that you understand and agree on any required
            materials separately before they are purchased.
          </p>
        </div>

        <div className="text-sm text-[#516786] dark:text-[#AAB9D0]">
          Do you accept or reject this locked price?
        </div>

        <div className="flex justify-between gap-4">
          <Button
            disabled={busy}
            onClick={onAccept}
            variant="success"
          >
            Accept
          </Button>

          <Button
            disabled={busy}
            onClick={onReject}
            variant="danger"
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}