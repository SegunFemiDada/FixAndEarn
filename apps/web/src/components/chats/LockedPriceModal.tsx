"use client";
import {Button} from "@/components/ui/Button";

type Props = {
  lockedPrice: number | null;   // ✅ show locked price value
  onAccept: () => void;
  onReject: () => void;
  busy: boolean;
};

function fmtFecFromMilli(milli?: number | null): string {
  if (typeof milli !== "number") return "—";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

export default function LockedPriceModal({ lockedPrice, onAccept, onReject, busy }: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-[#1E2A3A] rounded-xl p-6 shadow-lg space-y-4 max-w-sm w-full">
        <div className="text-lg font-semibold">Locked Price</div>
        <div className="text-sm">
          The price has been locked at <strong>{fmtFecFromMilli(lockedPrice)}</strong>.  
          Do you accept or reject this locked price?
        </div>
        <div className="flex justify-between gap-4">
          <Button
            disabled={busy}
            onClick={onAccept}
            variant="primary"
          >
            Accept
          </Button>
          <Button
            disabled={busy}
            onClick={onReject}
            variant="secondary"
          >
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
