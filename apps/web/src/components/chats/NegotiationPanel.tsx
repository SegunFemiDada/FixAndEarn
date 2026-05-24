// Path: apps/web/src/components/chats/NegotiationPanel.tsx
"use client";

import Button from "@/components/ui/Button";

import type {
  Negotiation,
} from "@/lib/chat/types";

type Props = {
  negotiation:
    | Negotiation
    | null;

  proposeFec: string;

  lockFec: string;

  proposingPrice: boolean;

  lockingPrice: boolean;

  respondingToLockedPrice: boolean;

  onChangeProposeFec: (
    value: string
  ) => void;

  onChangeLockFec: (
    value: string
  ) => void;

  onPropose: (
    milli: number
  ) => void | Promise<void>;

  onLock: (
    milli: number
  ) => void | Promise<void>;

  onRespond: (
    accept: boolean
  ) => void | Promise<void>;
};

function fmtFecFromMilli(
  milli?: number | null
): string {
  if (
    typeof milli !==
    "number"
  ) {
    return "—";
  }

  return `${(
    milli / 1000
  ).toFixed(2)} FEC`;
}

function parseMilliFromInput(
  value: string
): number | null {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  const n =
    Number(trimmed);

  if (
    !Number.isFinite(n) ||
    n <= 0
  ) {
    return null;
  }

  return Math.round(
    n * 1000
  );
}

export default function NegotiationPanel({
  negotiation,
  proposeFec,
  lockFec,
  proposingPrice,
  lockingPrice,
  respondingToLockedPrice,
  onChangeProposeFec,
  onChangeLockFec,
  onPropose,
  onLock,
  onRespond,
}: Props) {
  const canSubmitPropose =
    parseMilliFromInput(
      proposeFec
    ) !== null;

  const canSubmitLock =
    parseMilliFromInput(
      lockFec
    ) !== null;

  return (
    <div className="space-y-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
      <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        Negotiation
      </div>

      <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        Status:{" "}
        {String(
          negotiation?.status ??
            "—"
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] p-3">
          <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Proposed
          </div>

          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {fmtFecFromMilli(
              negotiation?.proposedPriceMilliFec
            )}
          </div>
        </div>

        <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] p-3">
          <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
            Locked
          </div>

          <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            {fmtFecFromMilli(
              negotiation?.lockedPriceMilliFec
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <input
          value={proposeFec}
          onChange={(e) =>
            onChangeProposeFec(
              e.target.value
            )
          }
          placeholder="Propose price"
          inputMode="decimal"
          className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2.5 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none"
        />

        <Button
          disabled={
            proposingPrice ||
            !canSubmitPropose
          }
          onClick={() => {
            const milli =
              parseMilliFromInput(
                proposeFec
              );

            if (
              milli === null
            ) {
              return;
            }

            onPropose(
              milli
            );
          }}
        >
          {proposingPrice
            ? "Submitting..."
            : "Propose"}
        </Button>
      </div>

      <div className="space-y-2">
        <input
          value={lockFec}
          onChange={(e) =>
            onChangeLockFec(
              e.target.value
            )
          }
          placeholder="Lock price"
          inputMode="decimal"
          className="w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-2.5 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none"
        />

        <Button
          disabled={
            lockingPrice ||
            !canSubmitLock
          }
          onClick={() => {
            const milli =
              parseMilliFromInput(
                lockFec
              );

            if (
              milli === null
            ) {
              return;
            }

            onLock(
              milli
            );
          }}
        >
          {lockingPrice
            ? "Locking..."
            : "Lock"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          disabled={
            respondingToLockedPrice
          }
          onClick={() =>
            onRespond(true)
          }
        >
          Accept locked price
        </Button>

        <Button
          disabled={
            respondingToLockedPrice
          }
          onClick={() =>
            onRespond(false)
          }
        >
          Reject locked price
        </Button>
      </div>
    </div>
  );
}