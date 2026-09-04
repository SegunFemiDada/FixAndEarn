"use client";

import {
  useEffect,
  useState,
} from "react";

import { Button } from "@/components/ui/Button";
import LockedPriceModal from "@/components/chats/LockedPriceModal";

import type { Negotiation } from "@/lib/chat/types";

type Props = {
  negotiation: Negotiation | null;

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

  onPropose: () => void | Promise<void>;

  onLock: () => void | Promise<void>;

  onRespond: (
    accept: boolean
  ) => void | Promise<void>;

  myUserId?: string | null;

  role: "client" | "fixer";

  jobStatus: string | null;

  continuingToPayment: boolean;

  onContinueToPayment: () =>
    | void
    | Promise<void>;
};

const PAYMENT_WINDOW_MS =
  60 * 60 * 1000;

function fmtFecFromMilli(
  milli?: number | null
): string {
  if (typeof milli !== "number") {
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

  const n = Number(trimmed);

  if (
    !Number.isFinite(n) ||
    n <= 0
  ) {
    return null;
  }

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
  const [
    showModal,
    setShowModal,
  ] = useState(false);

  const [
,
    setRemainingMs,
  ] = useState(0);

  const status =
    negotiation?.status ??
    "OPEN";

  const canSubmitPropose =
    parseMilliFromInput(
      proposeFec
    ) !== null;

  const canSubmitLock =
    parseMilliFromInput(
      lockFec
    ) !== null;

  const showOpenActions =
    status === "OPEN" ||
    status === "REJECTED";

  const showLockedActions =
    status === "LOCKED";

  const showAgreedState =
    status === "AGREED";

  const lockedByMe =
    negotiation?.lockedByUserId ===
    myUserId;

  const agreedAt =
    negotiation?.agreedAt
      ? new Date(
          negotiation.agreedAt
        ).getTime()
      : null;

  const paymentExpiresAt =
    agreedAt !== null
      ? agreedAt +
        PAYMENT_WINDOW_MS
      : null;

  useEffect(() => {
    if (
      !showLockedActions ||
      lockedByMe
    ) {
      setShowModal(false);
      return;
    }

    setShowModal(true);
  }, [
    showLockedActions,
    lockedByMe,
  ]);

  useEffect(() => {
    if (
      !showAgreedState ||
      paymentExpiresAt === null
    ) {
      setRemainingMs(0);
      return;
    }

    const updateTimer = () => {
      setRemainingMs(
        Math.max(
          0,
          paymentExpiresAt -
            Date.now()
        )
      );
    };

    updateTimer();

    const interval =
      window.setInterval(
        updateTimer,
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, [
    showAgreedState,
    paymentExpiresAt,
  ]);

  return (
    <div className="space-y-4 rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">

      <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        Negotiation
      </div>

      <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
        Status: {status}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] p-3">

          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#516786] dark:text-[#AAB9D0]">
            Proposed offer
          </div>

          <div className="mt-2 inline-flex rounded-lg border border-fuchsia-300 bg-linear-to-r from-fuchsia-600 to-violet-600 px-3 py-1.5 text-base font-extrabold tracking-tight text-white shadow-[0_5px_14px_rgba(192,38,211,0.35)] dark:border-fuchsia-400 dark:from-fuchsia-500 dark:to-violet-500">
            {fmtFecFromMilli(
              negotiation?.proposedPriceMilliFec
            )}
          </div>

        </div>

        <div className="rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] p-3">

          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#516786] dark:text-[#AAB9D0]">
            Locked price
          </div>

          <div className="mt-2 inline-flex rounded-lg border border-emerald-300 bg-linear-to-r from-emerald-500 to-cyan-500 px-3 py-1.5 text-base font-extrabold tracking-tight text-white shadow-[0_5px_14px_rgba(16,185,129,0.35)] dark:border-emerald-400 dark:from-emerald-400 dark:to-cyan-400 dark:text-[#062E2B]">
            {fmtFecFromMilli(
              negotiation?.lockedPriceMilliFec
            )}
          </div>

        </div>

      </div>

      {showOpenActions && (
        <>
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
              onClick={onPropose}
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
              onClick={onLock}
            >
              {lockingPrice
                ? "Locking..."
                : "Lock"}
            </Button>

          </div>
        </>
      )}

      {showModal &&
        !lockedByMe && (
          <LockedPriceModal
            lockedPrice={
              negotiation?.lockedPriceMilliFec ??
              null
            }
            busy={
              respondingToLockedPrice
            }
            onAccept={() => {
              onRespond(true);
              setShowModal(false);
            }}
            onReject={() => {
              onRespond(false);
              setShowModal(false);
            }}
          />
        )}

      

    </div>
  );
}
