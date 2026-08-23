// Path: apps/web/src/components/jobs/UrgentHireModal.tsx

"use client";

import { useEffect, useState } from "react";
import { useUrgentDirectHire } from "@/lib/jobs/queries";
import { FixerItem, extractErrorMessage } from "@/types/fixer";
import Link from "next/link";

type Props = {
  fixer: FixerItem | null;
  open: boolean;
  onClose: () => void;
};

type UrgentHireFormState = {
  skillCategory: string;
  state: string;
  city: string;
  lga: string;
  area: string;
};

function getInitialFormState(fixer: FixerItem | null): UrgentHireFormState {
  return {
    skillCategory: fixer?.verification?.skills?.trim() || "General",
    state: "",
    city: "",
    lga: "",
    area: "",
  };
}

export default function UrgentHireModal({ fixer, open, onClose }: Props) {
  const urgentHire = useUrgentDirectHire();

  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"summary" | "form">("summary");

  const [acknowledgements, setAcknowledgements] = useState({
  profileReviewed: false,
  selectionUnderstood: false,
  feeUnderstood: false,
});
  const [form, setForm] = useState<UrgentHireFormState>(
    getInitialFormState(fixer),
  );

  useEffect(() => {
    if (!open || !fixer) {
      setStep("summary");
      setError(null);
      return;
    }

  setStep("summary");
  setError(null);

  setAcknowledgements({
    profileReviewed: false,
    selectionUnderstood: false,
    feeUnderstood: false,
  });

  setForm(getInitialFormState(fixer));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixer?.id]);

  if (!open || !fixer) {
    return null;
  }

  const selectedFixer = fixer;

  function handleOpenForm() {
    setError(null);
    setStep("form");
  }

  function handleChange(
    field: keyof UrgentHireFormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleContinueToPayment() {
    if (urgentHire.isPending) {
      return;
    }

    const skillCategory = form.skillCategory.trim();
    const state = form.state.trim();
    const city = form.city.trim();
    const lga = form.lga.trim();
    const area = form.area.trim();

    if (!skillCategory) {
      setError("Skill category is required.");
      return;
    }

    if (!state) {
      setError("State is required.");
      return;
    }

    if (!city) {
      setError("City is required.");
      return;
    }

    setError(null);

    urgentHire.mutate(
      {
        fixerId: selectedFixer.id,
        skillCategory,
        state,
        city,
        lga: lga || undefined,
        area: area || undefined,
      },
      {
        onSuccess: (response) => {
          const checkoutUrl =
            typeof response?.checkoutUrl === "string"
              ? response.checkoutUrl.trim()
              : "";

          if (!checkoutUrl) {
            setError(
              "Payment link could not be created. Please try again.",
            );
            return;
          }

          window.location.assign(checkoutUrl);
        },
        onError: (err) => {
          setError(
            extractErrorMessage(
              err,
              "Failed to start urgent hire.",
            ),
          );
        },
      },
    );
  }
  const allAcknowledgementsAccepted =
  acknowledgements.profileReviewed &&
  acknowledgements.selectionUnderstood &&
  acknowledgements.feeUnderstood;

  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-4 dark:bg-black/70">
    <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#C5D5EE] bg-white shadow-[0_8px_32px_rgba(91,143,204,0.16)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">

      {/* Header */}
      <div className="shrink-0 border-b border-[#C5D5EE] px-6 py-4 dark:border-[#2D3F55]">
        <h2 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {step === "summary"
            ? "Confirm urgent connection"
            : "Complete job details"}
        </h2>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
        {step === "summary" ? (
          <>
            <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              You are about to request an urgent connection with{" "}
              <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {selectedFixer.fullName}
              </span>
              .
            </p>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                <p className="font-semibold">
                  Before you continue
                </p>

                <p className="mt-2">
                  Please review the fixer&apos;s public profile and confirm
                  that you understand the terms of the urgent connection
                  before proceeding.
                </p>

                <Link
                  href={`/app/fixers/${selectedFixer.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center font-semibold text-blue-700 underline hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  View {selectedFixer.fullName}&apos;s public profile
                </Link>
              </div>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={acknowledgements.profileReviewed}
                    onChange={(e) =>
                      setAcknowledgements((current) => ({
                        ...current,
                        profileReviewed: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                  />

                  <span className="text-sm leading-6 text-gray-700 dark:text-gray-200">
                    I have reviewed this fixer&apos;s public profile and
                    understand the fixer&apos;s profile information before
                    proceeding.
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={acknowledgements.selectionUnderstood}
                    onChange={(e) =>
                      setAcknowledgements((current) => ({
                        ...current,
                        selectionUnderstood: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                  />

                  <span className="text-sm leading-6 text-gray-700 dark:text-gray-200">
                    I am satisfied with my selection and understand that
                    this payment connects me with this fixer for direct
                    negotiation.
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={acknowledgements.feeUnderstood}
                    onChange={(e) =>
                      setAcknowledgements((current) => ({
                        ...current,
                        feeUnderstood: e.target.checked,
                      }))
                    }
                    className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                  />

                  <span className="text-sm leading-6 text-gray-700 dark:text-gray-200">
                    I understand that the 2 FEC (₦2,000) urgent connection
                    fee does not guarantee that I will reach an agreement
                    with the fixer, does not guarantee acceptance of my
                    proposed price, and is not a payment for the fixer&apos;s
                    work.
                  </span>
                </label>
              </div>

              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                <p className="font-bold">
                  Important
                </p>

                <p className="mt-2 leading-6">
                  FixAndEarn does not determine or guarantee the price agreed
                  between the client and fixer. Both parties are free to
                  negotiate. The urgent connection fee is not refundable
                  because the parties fail to agree on a price or because the
                  client chooses not to proceed.
                </p>
              </div>

              <div className="rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] p-4 text-sm text-[#1A2B4A] dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]">
                <p className="font-semibold">
                  Final payment timing
                </p>

                <p className="mt-2 leading-6">
                  After you and the fixer agree on a final price, the price
                  will be locked and you will have 60 minutes to complete the
                  final job payment. If payment is not successfully completed
                  within 60 minutes, the locked price and payment opportunity
                  will expire and the job will not proceed.
                </p>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                <p className="font-medium">
                  Urgent connection fee
                </p>

                <p className="mt-1 leading-6">
                  A 2 FEC (₦2,000) urgent connection fee is required to
                  connect you directly with this fixer. This fee is for the
                  FixAndEarn platform service that connects you directly with
                  your selected fixer. It is separate from the job payment.
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Fill in the job details before continuing to payment.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Skill category
                </label>
                <input
                  value={form.skillCategory}
                  onChange={(e) =>
                    handleChange("skillCategory", e.target.value)
                  }
                  placeholder="e.g. Plumbing"
                  className="w-full rounded-xl border border-[#C5D5EE] bg-white px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  State
                </label>
                <input
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  placeholder="e.g. Lagos"
                  className="w-full rounded-xl border border-[#C5D5EE] bg-white px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  City
                </label>
                <input
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="e.g. Ikeja"
                  className="w-full rounded-xl border border-[#C5D5EE] bg-white px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  LGA <span className="font-normal">(optional)</span>
                </label>
                <input
                  value={form.lga}
                  onChange={(e) => handleChange("lga", e.target.value)}
                  placeholder="e.g. Ikeja"
                  className="w-full rounded-xl border border-[#C5D5EE] bg-white px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Area <span className="font-normal">(optional)</span>
                </label>
                <input
                  value={form.area}
                  onChange={(e) => handleChange("area", e.target.value)}
                  placeholder="e.g. Allen Avenue"
                  className="w-full rounded-xl border border-[#C5D5EE] bg-white px-4 py-3 text-sm text-[#1A2B4A] outline-none dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA]"
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-[#F2C0BC] bg-[#FFF4F3] p-3 text-sm text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="shrink-0 border-t border-[#C5D5EE] bg-white px-6 py-4 dark:border-[#2D3F55] dark:bg-[#1E2A3A]">
        {step === "summary" ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={urgentHire.isPending}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleOpenForm}
              disabled={
                urgentHire.isPending || !allAcknowledgementsAccepted
              }
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-blue-900"
            >
              Pay ₦2,000 & Connect
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep("summary")}
              disabled={urgentHire.isPending}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleContinueToPayment}
              disabled={urgentHire.isPending}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-blue-900"
            >
              {urgentHire.isPending
                ? "Preparing payment..."
                : "Continue to payment"}
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);
}