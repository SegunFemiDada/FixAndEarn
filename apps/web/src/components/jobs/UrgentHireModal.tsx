// Path: apps/web/src/components/jobs/UrgentHireModal.tsx

"use client";

import { useState } from "react";
import { useUrgentDirectHire } from "@/lib/jobs/queries";
import {
  FixerItem,
  extractErrorMessage,
} from "@/types/fixer";

type Props = {
  fixer: FixerItem | null;

  open: boolean;

  onClose: () => void;
};

export default function UrgentHireModal({
  fixer,
  open,
  onClose,
}: Props) {
  const urgentHire =
    useUrgentDirectHire();

  const [error, setError] = useState<
    string | null
  >(null);

  if (!open || !fixer) {
    return null;
  }
  const selectedFixer = fixer;

  async function handleConfirm() {
    if (urgentHire.isPending) {
      return;
    }

    setError(null);

    urgentHire.mutate(
      {
        fixerId: selectedFixer.id,

skillCategory:
  selectedFixer.verification?.skills?.trim() ||
  "General",

state:
  selectedFixer.verification?.state?.trim() ||
  "Unknown",

city:
  selectedFixer.verification?.city?.trim() ||
  "Unknown",

lga:
  selectedFixer.verification?.lga?.trim() ||
  undefined,
      },
      {
        onSuccess: (response) => {
          const checkoutUrl =
          typeof response?.checkoutUrl === "string"
            ? response.checkoutUrl.trim()
            : "";

          if (!checkoutUrl) {
            setError(
              "Payment link could not be created. Please try again."
            );
            return;
          }

          window.location.assign(
            checkoutUrl
          );
        },

        onError: (err) => {
          setError(
            extractErrorMessage(
              err,
              "Failed to start urgent hire."
            )
          );
        },
      }
    );
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        px-4
        dark:bg-black/70
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-[#C5D5EE]
          dark:border-[#2D3F55]
          bg-white
          dark:bg-[#1E2A3A]
          p-6
          shadow-[0_8px_32px_rgba(91,143,204,0.16)]
          dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
        "
      >
        <h2
          className="
            text-xl
            font-semibold
            text-[#1A2B4A]
            dark:text-[#E8F0FA]
          "
        >
          Confirm urgent hire
        </h2>

        <p
          className="
            mt-2
            text-sm
            text-[#6B7C99]
            dark:text-[#8FA0BC]
          "
        >
          You are about to hire{" "}
          <span
            className="
              font-semibold
              text-[#1A2B4A]
              dark:text-[#E8F0FA]
            "
          >
            {selectedFixer.fullName}
          </span>
          .
        </p>

        <div
          className="
            mt-4
            rounded-xl
            border
            border-blue-200
            bg-blue-50
            p-4
            text-sm
            text-blue-900
            dark:border-blue-800
            dark:bg-blue-900/20
            dark:text-blue-200
          "
        >
          <p className="font-medium">
            Urgent hire fee
          </p>

          <p className="mt-1">
            A 2 FEC (₦2000) platform service fee
            payment is required before the
            fixer can be assigned.
          </p>

          <p className="mt-2 text-xs">
            You will be redirected to secure
            payment. Your account balance will
            not be deducted.
          </p>
        </div>

        {error && (
          <div
            className="
              mt-4
              rounded-xl
              border
              border-[#F2C0BC]
              bg-[#FFF4F3]
              p-3
              text-sm
              text-[#D9534F]
              dark:border-red-700
              dark:bg-red-900/20
              dark:text-red-300
            "
          >
            {error}
          </div>
        )}

        <div
          className="
            mt-6
            flex
            gap-3
          "
        >
          <button
            type="button"
            onClick={onClose}
            disabled={
              urgentHire.isPending
            }
            className="
              flex-1
              rounded-lg
              border
              border-gray-300
              bg-white
              px-4
              py-3
              text-sm
              font-semibold
              text-gray-700
              transition-colors
              hover:bg-gray-100
              dark:border-gray-700
              dark:bg-gray-800
              dark:text-gray-200
              dark:hover:bg-gray-700
            "
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              urgentHire.isPending
            }
            className={`
              flex-1
              rounded-lg
              px-4
              py-3
              text-sm
              font-semibold
              text-white
              transition-colors
              ${
                urgentHire.isPending
                  ? `
                    cursor-not-allowed
                    bg-blue-300
                    dark:bg-blue-900
                  `
                  : `
                    bg-blue-600
                    hover:bg-blue-700
                    dark:bg-blue-500
                    dark:hover:bg-blue-600
                  `
              }
            `}
          >
            {urgentHire.isPending
              ? "Preparing payment..."
              : "Continue to payment"}
          </button>
        </div>
      </div>
    </div>
  );
}