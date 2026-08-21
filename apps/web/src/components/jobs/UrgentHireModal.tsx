// Path: apps/web/src/components/jobs/UrgentHireModal.tsx

"use client";

import { useEffect, useState } from "react";
import { useUrgentDirectHire } from "@/lib/jobs/queries";
import { FixerItem, extractErrorMessage } from "@/types/fixer";

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 dark:bg-black/70">
      <div className="w-full max-w-md rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_8px_32px_rgba(91,143,204,0.16)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <h2 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {step === "summary" ? "Confirm urgent connection" : "Complete job details"}
        </h2>

        {step === "summary" ? (
          <>
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              You are about to request an urgent connection with{" "}
              <span className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {selectedFixer.fullName}
              </span>
              .
            </p>

            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
              <p className="font-medium">Urgent connection fee</p>

              <p className="mt-1">
                A 2 FEC (₦2,000) urgent connection fee is required to connect you directly with this fixer.
                This fee is for the FixAndEarn platform service that connects you directly with your selected fixer. It is separate from the job payment.
              </p>

              <p className="mt-2 text-xs">
                You will be redirected to secure payment. Fixer only get payment when you approve job completion.
              </p>
            </div>

            <div className="mt-6 flex gap-3">
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
                disabled={urgentHire.isPending}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-blue-900"
              >
                Pay ₦2,000 & Connect
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
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

            <div className="mt-6 flex gap-3">
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
          </>
        )}
      </div>
    </div>
  );
}