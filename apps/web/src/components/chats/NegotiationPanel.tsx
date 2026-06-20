"use client";
import { useState } from "react";
import Button from "@/components/ui/Button";
import LockedPriceModal from "@/components/chats/LockedPriceModal";
import type { Negotiation } from "@/lib/chat/types";

type Props = {
  negotiation: Negotiation | null;
  proposeFec: string;
  lockFec: string;
  proposingPrice: boolean;
  lockingPrice: boolean;
  respondingToLockedPrice: boolean;
  onChangeProposeFec: (value: string) => void;
  onChangeLockFec: (value: string) => void;
  onPropose: (milli: number) => void | Promise<void>;
  onLock: (milli: number) => void | Promise<void>;
  onRespond: (accept: boolean) => void | Promise<void>;
  myUserId?: string | null; // current user ID
};

function fmtFecFromMilli(milli?: number | null): string {
  if (typeof milli !== "number") return "—";
  return `${(milli / 1000).toFixed(2)} FEC`;
}

function parseMilliFromInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 1000);
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
  myUserId,
}: Props) {
  const [showModal, setShowModal] = useState(false);

  const status = negotiation?.status ?? "OPEN";
  const canSubmitPropose = parseMilliFromInput(proposeFec) !== null;
  const canSubmitLock = parseMilliFromInput(lockFec) !== null;

  const showOpenActions = status === "OPEN" || status === "REJECTED";
  const showLockedActions = status === "LOCKED";
  const showAgreedState = status === "AGREED";

  const lockedByMe = negotiation?.lockedByUserId === myUserId;

  // Trigger modal only for counterparty
  if (showLockedActions && !lockedByMe && !showModal) {
    setShowModal(true);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow">
      <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Negotiation</div>
      <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Status: {status}</div>

      {/* Proposed & Locked summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border p-3">
          <div className="text-sm font-semibold">Proposed</div>
          <div className="mt-1 text-sm">{fmtFecFromMilli(negotiation?.proposedPriceMilliFec)}</div>
        </div>
        <div className="rounded-xl border p-3">
          <div className="text-sm font-semibold">Locked</div>
          <div className="mt-1 text-sm">{fmtFecFromMilli(negotiation?.lockedPriceMilliFec)}</div>
        </div>
      </div>

      {/* Open actions */}
      {showOpenActions && (
        <>
          <div className="space-y-2">
            <input
              value={proposeFec}
              onChange={(e) => onChangeProposeFec(e.target.value)}
              placeholder="Propose price"
              inputMode="decimal"
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
            />
            <Button
              disabled={proposingPrice || !canSubmitPropose}
              onClick={() => {
                const milli = parseMilliFromInput(proposeFec);
                if (milli !== null) onPropose(milli);
              }}
            >
              {proposingPrice ? "Submitting..." : "Propose"}
            </Button>
          </div>

          <div className="space-y-2">
            <input
              value={lockFec}
              onChange={(e) => onChangeLockFec(e.target.value)}
              placeholder="Lock price"
              inputMode="decimal"
              className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none"
            />
            <Button
              disabled={lockingPrice || !canSubmitLock}
              onClick={() => {
                const milli = parseMilliFromInput(lockFec);
                if (milli !== null) onLock(milli);
              }}
            >
              {lockingPrice ? "Locking..." : "Lock"}
            </Button>
          </div>
        </>
      )}

      {/* Locked actions — modal for counterparty */}
      {showModal && !lockedByMe && (
  <LockedPriceModal
    lockedPrice={negotiation?.lockedPriceMilliFec ?? null}
    busy={respondingToLockedPrice}
    onAccept={() => {
      onRespond(true);
      setShowModal(false);   // ✅ auto-close
    }}
    onReject={() => {
      onRespond(false);
      setShowModal(false);   // ✅ auto-close
    }}
  />
)}


      {/* Agreed state */}
      {showAgreedState && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm">
          Price agreed, Job <i>IN PROGRESS</i>.
        </div>
      )}
    </div>
  );
}
