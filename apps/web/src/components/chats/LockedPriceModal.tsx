"use client";
import Button from "@/components/ui/Button";

type Props = {
  onAccept: () => void;
  onReject: () => void;
  busy: boolean;
  onClose: () => void;
};

export default function LockedPriceModal({ onAccept, onReject, busy, onClose }: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white dark:bg-[#1E2A3A] rounded-xl p-6 shadow-lg space-y-4">
        <div className="text-lg font-semibold">Locked Price</div>
        <div className="text-sm">Do you accept or reject the locked price?</div>
        <div className="flex gap-3">
          <Button disabled={busy} onClick={onAccept}>Accept</Button>
          <Button disabled={busy} onClick={onReject}>Reject</Button>
        </div>
        {/* ✅ Removed unsupported `variant` prop */}
        <Button onClick={onClose} className="mt-4 bg-gray-200 text-black dark:bg-gray-700 dark:text-white">
          Close
        </Button>
      </div>
    </div>
  );
}
