"use client";

import Button from "@/components/ui/Button";

type Props = {
  canChat: boolean;

  agreementLabel: string;

  busy?: boolean;

  onAccept?: () => void;
};

export default function AgreementPanel({
  canChat,
  agreementLabel,
  busy = false,
  onAccept,
}: Props) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        Agreement
      </div>

      <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        Status:{" "}
        {agreementLabel}
      </div>

      {canChat ? (
        <div className="text-sm text-[#2E7D32] dark:text-green-200">
          Agreement accepted.
          You can chat and
          negotiate.
        </div>
      ) : (
        <>
          <div className="text-sm text-[#D9534F] dark:text-red-300">
            Agreement required
            before chat becomes
            available.
          </div>

          {onAccept && (
            <Button
              disabled={busy}
              onClick={
                onAccept
              }
            >
              {busy
                ? "Submitting..."
                : "Accept agreement"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}