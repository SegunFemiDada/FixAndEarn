// Path: apps/web/src/app/admin/settings/page.tsx
"use client";

import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useAdminSettingsOverview,
  useUpdateAdminSettingsOverview,
} from "@/lib/admin/settings/queries";
import { formatFecFromMilli } from "@/lib/wallet/ui";

function toInteger(value: string) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function joinLines(items: string[]) {
  return items.join("\n");
}

function parseLines(value: string) {
  return Array.from(
    new Set(
      value
        .split("\n")
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    )
  );
}

export default function AdminSettingsPage() {
  const query = useAdminSettingsOverview(true);
  const updateMutation = useUpdateAdminSettingsOverview();

  const [commissionRate, setCommissionRate] = React.useState("0.1");
  const [fecRateNaira, setFecRateNaira] = React.useState("1000");
  const [jobPostingFeeMilliFec, setJobPostingFeeMilliFec] = React.useState("1000");
  const [firstDepositMinMilliFec, setFirstDepositMinMilliFec] = React.useState("1000");
  const [firstDepositMaxMilliFec, setFirstDepositMaxMilliFec] = React.useState("2000");
  const [generalDepositMinMilliFec, setGeneralDepositMinMilliFec] = React.useState("1000");
  const [withdrawalMinMilliFec, setWithdrawalMinMilliFec] = React.useState("1000");
  const [withdrawalMaxMilliFec, setWithdrawalMaxMilliFec] = React.useState("100000000");
  const [allowedWithdrawalRolesText, setAllowedWithdrawalRolesText] = React.useState("FIXER");

  const [requireNin, setRequireNin] = React.useState(true);
  const [requireBvnForFixerBankDetails, setRequireBvnForFixerBankDetails] = React.useState(true);
  const [requireUtilityBill, setRequireUtilityBill] = React.useState(true);
  const [requireLiveSelfie, setRequireLiveSelfie] = React.useState(true);
  const [forceVerificationBeforePosting, setForceVerificationBeforePosting] = React.useState(true);
  const [forceVerificationBeforeApplying, setForceVerificationBeforeApplying] = React.useState(true);

  const [moderationEnablePhoneNumberFlag, setModerationEnablePhoneNumberFlag] = React.useState(true);
  const [moderationEnableWhatsappFlag, setModerationEnableWhatsappFlag] = React.useState(true);
  const [moderationEnableOffPlatformPaymentFlag, setModerationEnableOffPlatformPaymentFlag] = React.useState(true);
  const [moderationAutoActionStrikeThreshold, setModerationAutoActionStrikeThreshold] = React.useState("3");
  const [moderationAutoSuspendEnabled, setModerationAutoSuspendEnabled] = React.useState(false);

  const [message, setMessage] = React.useState<{ type: "ok" | "err"; text: string } | null>(null);

  React.useEffect(() => {
    if (!query.data) return;

    setCommissionRate(String(query.data.finance.commissionRate));
    setFecRateNaira(String(query.data.finance.fecRateNaira));
    setJobPostingFeeMilliFec(String(query.data.finance.jobPostingFeeMilliFec));
    setFirstDepositMinMilliFec(String(query.data.finance.firstDepositMinMilliFec));
    setFirstDepositMaxMilliFec(String(query.data.finance.firstDepositMaxMilliFec));
    setGeneralDepositMinMilliFec(String(query.data.finance.generalDepositMinMilliFec));
    setWithdrawalMinMilliFec(String(query.data.finance.withdrawalMinMilliFec));
    setWithdrawalMaxMilliFec(String(query.data.finance.withdrawalMaxMilliFec));
    setAllowedWithdrawalRolesText(joinLines(query.data.finance.allowedWithdrawalRoles ?? ["FIXER"]));

    setRequireNin(query.data.verification.requireNin);
    setRequireBvnForFixerBankDetails(query.data.verification.requireBvnForFixerBankDetails);
    setRequireUtilityBill(query.data.verification.requireUtilityBill);
    setRequireLiveSelfie(query.data.verification.requireLiveSelfie);
    setForceVerificationBeforePosting(query.data.verification.forceVerificationBeforePosting);
    setForceVerificationBeforeApplying(query.data.verification.forceVerificationBeforeApplying);

    setModerationEnablePhoneNumberFlag(query.data.moderation.moderationEnablePhoneNumberFlag);
    setModerationEnableWhatsappFlag(query.data.moderation.moderationEnableWhatsappFlag);
    setModerationEnableOffPlatformPaymentFlag(query.data.moderation.moderationEnableOffPlatformPaymentFlag);
    setModerationAutoActionStrikeThreshold(String(query.data.moderation.moderationAutoActionStrikeThreshold));
    setModerationAutoSuspendEnabled(query.data.moderation.moderationAutoSuspendEnabled);
  }, [query.data]);

  function handleSave() {
    setMessage(null);

    updateMutation.mutate(
      {
        commissionRate: toNumber(commissionRate),
        fecRateNaira: toInteger(fecRateNaira),
        jobPostingFeeMilliFec: toInteger(jobPostingFeeMilliFec),
        firstDepositMinMilliFec: toInteger(firstDepositMinMilliFec),
        firstDepositMaxMilliFec: toInteger(firstDepositMaxMilliFec),
        generalDepositMinMilliFec: toInteger(generalDepositMinMilliFec),
        withdrawalMinMilliFec: toInteger(withdrawalMinMilliFec),
        withdrawalMaxMilliFec: toInteger(withdrawalMaxMilliFec),
        allowedWithdrawalRoles: parseLines(allowedWithdrawalRolesText),

        requireNin,
        requireBvnForFixerBankDetails,
        requireUtilityBill,
        requireLiveSelfie,
        forceVerificationBeforePosting,
        forceVerificationBeforeApplying,

        moderationEnablePhoneNumberFlag,
        moderationEnableWhatsappFlag,
        moderationEnableOffPlatformPaymentFlag,
        moderationAutoActionStrikeThreshold: toInteger(moderationAutoActionStrikeThreshold),
        moderationAutoSuspendEnabled,
      },
      {
        onSuccess: () => {
          setMessage({ type: "ok", text: "Settings updated successfully." });
        },
        onError: (error) => {
          setMessage({ type: "err", text: extractApiErrorMessage(error) });
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">Settings</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Platform settings</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
          Manage platform-wide finance, verification, and moderation settings using live backend persistence.
        </p>
      </section>

      {query.isLoading ? (
        <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading settings...</p>
        </section>
      ) : query.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">Failed to load settings</h3>
          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">{extractApiErrorMessage(query.error)}</p>
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Finance settings</h3>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Commission rate</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={commissionRate}
                    onChange={(event) => setCommissionRate(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">FEC rate in naira</label>
                  <input
                    type="number"
                    value={fecRateNaira}
                    onChange={(event) => setFecRateNaira(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Job posting fee (milliFEC)</label>
                  <input
                    type="number"
                    value={jobPostingFeeMilliFec}
                    onChange={(event) => setJobPostingFeeMilliFec(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                  <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Current: {formatFecFromMilli(toInteger(jobPostingFeeMilliFec))}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">First deposit min (milliFEC)</label>
                  <input
                    type="number"
                    value={firstDepositMinMilliFec}
                    onChange={(event) => setFirstDepositMinMilliFec(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                  <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Current: {formatFecFromMilli(toInteger(firstDepositMinMilliFec))}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">First deposit max (milliFEC)</label>
                  <input
                    type="number"
                    value={firstDepositMaxMilliFec}
                    onChange={(event) => setFirstDepositMaxMilliFec(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                  <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Current: {formatFecFromMilli(toInteger(firstDepositMaxMilliFec))}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">General deposit min (milliFEC)</label>
                  <input
                    type="number"
                    value={generalDepositMinMilliFec}
                    onChange={(event) => setGeneralDepositMinMilliFec(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                  <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Current: {formatFecFromMilli(toInteger(generalDepositMinMilliFec))}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Withdrawal min (milliFEC)</label>
                  <input
                    type="number"
                    value={withdrawalMinMilliFec}
                    onChange={(event) => setWithdrawalMinMilliFec(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                  <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Current: {formatFecFromMilli(toInteger(withdrawalMinMilliFec))}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Withdrawal max (milliFEC)</label>
                  <input
                    type="number"
                    value={withdrawalMaxMilliFec}
                    onChange={(event) => setWithdrawalMaxMilliFec(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  />
                  <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                    Current: {formatFecFromMilli(toInteger(withdrawalMaxMilliFec))}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Allowed withdrawal roles
                </label>
                <textarea
                  value={allowedWithdrawalRolesText}
                  onChange={(event) => setAllowedWithdrawalRolesText(event.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                />
                <p className="mt-1 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">One role per line. Example: FIXER</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Verification settings</h3>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    <input
                      type="checkbox"
                      checked={requireNin}
                      onChange={(e) => setRequireNin(e.target.checked)}
                      className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
                    />
                    Require NIN
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    <input
                      type="checkbox"
                      checked={requireBvnForFixerBankDetails}
                      onChange={(e) => setRequireBvnForFixerBankDetails(e.target.checked)}
                      className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
                    />
                    Require BVN for fixer bank details
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    <input
                      type="checkbox"
                      checked={requireUtilityBill}
                      onChange={(e) => setRequireUtilityBill(e.target.checked)}
                      className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
                    />
                    Require utility bill
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    <input
                      type="checkbox"
                      checked={requireLiveSelfie}
                      onChange={(e) => setRequireLiveSelfie(e.target.checked)}
                      className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
                    />
                    Require live selfie
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    <input
                      type="checkbox"
                      checked={forceVerificationBeforePosting}
                      onChange={(e) => setForceVerificationBeforePosting(e.target.checked)}
                      className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
                    />
                    Force verification before posting jobs
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    <input
                      type="checkbox"
                      checked={forceVerificationBeforeApplying}
                      onChange={(e) => setForceVerificationBeforeApplying(e.target.checked)}
                      className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
                    />
                    Force verification before applying to jobs
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
                <h3 className="text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Moderation settings</h3>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    <input
                      type="checkbox"
                      checked={moderationEnablePhoneNumberFlag}
                      onChange={(e) => setModerationEnablePhoneNumberFlag(e.target.checked)}
                      className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
                    />
                    Enable phone number flag
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    <input
                      type="checkbox"
                      checked={moderationEnableWhatsappFlag}
                      onChange={(e) => setModerationEnableWhatsappFlag(e.target.checked)}
                      className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
                    />
                    Enable WhatsApp flag
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    <input
                      type="checkbox"
                      checked={moderationEnableOffPlatformPaymentFlag}
                      onChange={(e) => setModerationEnableOffPlatformPaymentFlag(e.target.checked)}
                      className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
                    />
                    Enable off-platform payment flag
                  </label>

                  <label className="flex items-center gap-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA]">
                    <input
                      type="checkbox"
                      checked={moderationAutoSuspendEnabled}
                      onChange={(e) => setModerationAutoSuspendEnabled(e.target.checked)}
                      className="rounded border-[#C5D5EE] text-[#5B8FCC] focus:ring-[#5B8FCC]"
                    />
                    Enable auto suspend
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                      Auto action strike threshold
                    </label>
                    <input
                      type="number"
                      value={moderationAutoActionStrikeThreshold}
                      onChange={(event) => setModerationAutoActionStrikeThreshold(event.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            {message && (
              <div
                className={[
                  "rounded-2xl border p-3 text-sm",
                  message.type === "ok"
                    ? "border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 text-[#2E7D32] dark:text-green-200"
                    : "border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 text-[#D9534F] dark:text-red-300",
                ].join(" ")}
              >
                {message.text}
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="inline-flex items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-3 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? "Saving..." : "Save settings"}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}