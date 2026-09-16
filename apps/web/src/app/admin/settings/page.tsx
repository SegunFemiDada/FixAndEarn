// Path: apps/web/src/app/admin/settings/page.tsx
"use client";

import * as React from "react";
import { extractApiErrorMessage } from "@/lib/admin/queries";
import {
  useAdminSettingsOverview,
  useUpdateAdminSettingsOverview,
} from "@/lib/admin/settings/queries";
import { formatFecFromMilli } from "@/lib/wallet/ui";

const PANEL_CLASS =
  "rounded-2xl border border-[#C5D5EE] bg-white p-6 shadow-[0_4px_24px_rgba(91,143,204,0.10)] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]";

const SUBPANEL_CLASS =
  "rounded-xl border border-[#C5D5EE] bg-[#F8FAFD] dark:border-[#2D3F55] dark:bg-[#16202E]";

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080] dark:focus:border-[#5B8FCC]";

const TEXTAREA_CLASS =
  "mt-1 w-full resize-y rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-sm text-[#1A2B4A] outline-none transition placeholder:text-[#9BAEC8] focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20 dark:border-[#2D3F55] dark:bg-[#16202E] dark:text-[#E8F0FA] dark:placeholder:text-[#4A6080] dark:focus:border-[#5B8FCC]";

const PRIMARY_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600";

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
        .filter(Boolean),
    ),
  );
}

function SettingToggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#C5D5EE] bg-white px-4 py-3 transition hover:border-[#9DB8DA] dark:border-[#2D3F55] dark:bg-[#1E2A3A] dark:hover:border-[#45617F]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C5D5EE] text-[#2563EB] focus:ring-[#5B8FCC] dark:border-[#45617F]"
      />

      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
          {description}
        </span>
      </span>
    </label>
  );
}

function FinanceField({
  label,
  value,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helper?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
        {label}
      </label>

      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={INPUT_CLASS}
      />

      {helper ? (
        <p className="mt-1.5 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

export default function AdminSettingsPage() {
  const query = useAdminSettingsOverview(true);
  const updateMutation = useUpdateAdminSettingsOverview();

  const [commissionRate, setCommissionRate] = React.useState("0.1");
  const [fecRateNaira, setFecRateNaira] = React.useState("1000");
  const [jobPostingFeeMilliFec, setJobPostingFeeMilliFec] =
    React.useState("1000");
  const [firstDepositMinMilliFec, setFirstDepositMinMilliFec] =
    React.useState("1000");
  const [firstDepositMaxMilliFec, setFirstDepositMaxMilliFec] =
    React.useState("2000");
  const [generalDepositMinMilliFec, setGeneralDepositMinMilliFec] =
    React.useState("1000");
  const [withdrawalMinMilliFec, setWithdrawalMinMilliFec] =
    React.useState("1000");
  const [withdrawalMaxMilliFec, setWithdrawalMaxMilliFec] =
    React.useState("100000000");
  const [allowedWithdrawalRolesText, setAllowedWithdrawalRolesText] =
    React.useState("FIXER");

  const [requireNin, setRequireNin] = React.useState(true);
  const [requireUtilityBill, setRequireUtilityBill] = React.useState(true);
  const [requireLiveSelfie, setRequireLiveSelfie] = React.useState(true);
  const [forceVerificationBeforePosting, setForceVerificationBeforePosting] =
    React.useState(true);
  const [forceVerificationBeforeApplying, setForceVerificationBeforeApplying] =
    React.useState(true);

  const [moderationEnablePhoneNumberFlag, setModerationEnablePhoneNumberFlag] =
    React.useState(true);
  const [moderationEnableWhatsappFlag, setModerationEnableWhatsappFlag] =
    React.useState(true);
  const [
    moderationEnableOffPlatformPaymentFlag,
    setModerationEnableOffPlatformPaymentFlag,
  ] = React.useState(true);
  const [
    moderationAutoActionStrikeThreshold,
    setModerationAutoActionStrikeThreshold,
  ] = React.useState("3");
  const [moderationAutoSuspendEnabled, setModerationAutoSuspendEnabled] =
    React.useState(false);

  const [message, setMessage] = React.useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (!query.data) return;

    setCommissionRate(String(query.data.finance.commissionRate));
    setFecRateNaira(String(query.data.finance.fecRateNaira));
    setJobPostingFeeMilliFec(
      String(query.data.finance.jobPostingFeeMilliFec),
    );
    setFirstDepositMinMilliFec(
      String(query.data.finance.firstDepositMinMilliFec),
    );
    setFirstDepositMaxMilliFec(
      String(query.data.finance.firstDepositMaxMilliFec),
    );
    setGeneralDepositMinMilliFec(
      String(query.data.finance.generalDepositMinMilliFec),
    );
    setWithdrawalMinMilliFec(
      String(query.data.finance.withdrawalMinMilliFec),
    );
    setWithdrawalMaxMilliFec(
      String(query.data.finance.withdrawalMaxMilliFec),
    );
    setAllowedWithdrawalRolesText(
      joinLines(query.data.finance.allowedWithdrawalRoles ?? ["FIXER"]),
    );

    setRequireNin(query.data.verification.requireNin);
    setRequireUtilityBill(query.data.verification.requireUtilityBill);
    setRequireLiveSelfie(query.data.verification.requireLiveSelfie);
    setForceVerificationBeforePosting(
      query.data.verification.forceVerificationBeforePosting,
    );
    setForceVerificationBeforeApplying(
      query.data.verification.forceVerificationBeforeApplying,
    );

    setModerationEnablePhoneNumberFlag(
      query.data.moderation.moderationEnablePhoneNumberFlag,
    );
    setModerationEnableWhatsappFlag(
      query.data.moderation.moderationEnableWhatsappFlag,
    );
    setModerationEnableOffPlatformPaymentFlag(
      query.data.moderation.moderationEnableOffPlatformPaymentFlag,
    );
    setModerationAutoActionStrikeThreshold(
      String(query.data.moderation.moderationAutoActionStrikeThreshold),
    );
    setModerationAutoSuspendEnabled(
      query.data.moderation.moderationAutoSuspendEnabled,
    );
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
        requireUtilityBill,
        requireLiveSelfie,
        forceVerificationBeforePosting,
        forceVerificationBeforeApplying,

        moderationEnablePhoneNumberFlag,
        moderationEnableWhatsappFlag,
        moderationEnableOffPlatformPaymentFlag,
        moderationAutoActionStrikeThreshold: toInteger(
          moderationAutoActionStrikeThreshold,
        ),
        moderationAutoSuspendEnabled,
      },
      {
        onSuccess: () => {
          setMessage({
            type: "ok",
            text: "Settings updated successfully.",
          });
        },
        onError: (error) => {
          setMessage({
            type: "err",
            text: extractApiErrorMessage(error),
          });
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <section className={PANEL_CLASS}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#5B8FCC] dark:text-[#7AAEE0]">
              Settings
            </p>

            <h2 className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Platform settings
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
              Manage platform-wide finance, verification, and moderation
              controls using the live backend settings configuration.
            </p>
          </div>

          <div className="hidden shrink-0 rounded-xl border border-[#C5D5EE] bg-[#F4F8FF] px-4 py-3 text-right dark:border-[#2D3F55] dark:bg-[#16202E] xl:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
              Configuration
            </p>

            <p className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Live settings
            </p>
          </div>
        </div>
      </section>

      {query.isLoading ? (
        <section className={PANEL_CLASS}>
          <p className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Loading settings...
          </p>
        </section>
      ) : query.isError ? (
        <section className="rounded-2xl border border-[#F2C0BC] bg-[#FFF4F3] p-6 shadow-[0_4px_24px_rgba(91,143,204,0.10)] dark:border-red-700 dark:bg-red-900/20 dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
          <h3 className="text-lg font-semibold text-[#D9534F] dark:text-red-300">
            Failed to load settings
          </h3>

          <p className="mt-2 text-sm text-[#D9534F] dark:text-red-300">
            {extractApiErrorMessage(query.error)}
          </p>
        </section>
      ) : (
        <>
          <section className={PANEL_CLASS}>
            <div className="flex flex-col gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                  Finance
                </p>

                <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Finance & wallet rules
                </h3>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Configure commission, FEC conversion, job posting fees,
                  deposit limits, and withdrawal boundaries.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <FinanceField
                label="Commission rate"
                value={commissionRate}
                onChange={setCommissionRate}
              />

              <FinanceField
                label="FEC rate in naira"
                value={fecRateNaira}
                onChange={setFecRateNaira}
              />

              <FinanceField
                label="Job posting fee (milliFEC)"
                value={jobPostingFeeMilliFec}
                onChange={setJobPostingFeeMilliFec}
                helper={`Current: ${formatFecFromMilli(
                  toInteger(jobPostingFeeMilliFec),
                )}`}
              />

              <FinanceField
                label="General deposit min (milliFEC)"
                value={generalDepositMinMilliFec}
                onChange={setGeneralDepositMinMilliFec}
                helper={`Current: ${formatFecFromMilli(
                  toInteger(generalDepositMinMilliFec),
                )}`}
              />

              <FinanceField
                label="First deposit min (milliFEC)"
                value={firstDepositMinMilliFec}
                onChange={setFirstDepositMinMilliFec}
                helper={`Current: ${formatFecFromMilli(
                  toInteger(firstDepositMinMilliFec),
                )}`}
              />

              <FinanceField
                label="First deposit max (milliFEC)"
                value={firstDepositMaxMilliFec}
                onChange={setFirstDepositMaxMilliFec}
                helper={`Current: ${formatFecFromMilli(
                  toInteger(firstDepositMaxMilliFec),
                )}`}
              />

              <FinanceField
                label="Withdrawal min (milliFEC)"
                value={withdrawalMinMilliFec}
                onChange={setWithdrawalMinMilliFec}
                helper={`Current: ${formatFecFromMilli(
                  toInteger(withdrawalMinMilliFec),
                )}`}
              />

              <FinanceField
                label="Withdrawal max (milliFEC)"
                value={withdrawalMaxMilliFec}
                onChange={setWithdrawalMaxMilliFec}
                helper={`Current: ${formatFecFromMilli(
                  toInteger(withdrawalMaxMilliFec),
                )}`}
              />
            </div>

            <div className={`${SUBPANEL_CLASS} mt-6 p-5`}>
              <div className="grid gap-5 xl:grid-cols-[1fr_2fr] xl:items-start">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                    Withdrawal access
                  </p>

                  <h4 className="mt-1 text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Allowed withdrawal roles
                  </h4>

                  <p className="mt-1 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                    One role per line. Values are normalized to uppercase
                    before saving.
                  </p>
                </div>

                <textarea
                  value={allowedWithdrawalRolesText}
                  onChange={(event) =>
                    setAllowedWithdrawalRolesText(event.target.value)
                  }
                  rows={3}
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <section className={PANEL_CLASS}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                  Verification
                </p>

                <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Verification requirements
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Control identity evidence requirements and when verified
                  accounts are required for marketplace actions.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <SettingToggle
                  checked={requireNin}
                  onChange={setRequireNin}
                  title="Require NIN"
                  description="Require NIN verification as part of the verification process."
                />

                <SettingToggle
                  checked={requireUtilityBill}
                  onChange={setRequireUtilityBill}
                  title="Require utility bill"
                  description="Require a utility bill as verification evidence."
                />

                <SettingToggle
                  checked={requireLiveSelfie}
                  onChange={setRequireLiveSelfie}
                  title="Require live selfie"
                  description="Require a live selfie during identity verification."
                />

                <SettingToggle
                  checked={forceVerificationBeforePosting}
                  onChange={setForceVerificationBeforePosting}
                  title="Require verification before posting jobs"
                  description="Prevent users from posting jobs until verification requirements are satisfied."
                />

                <SettingToggle
                  checked={forceVerificationBeforeApplying}
                  onChange={setForceVerificationBeforeApplying}
                  title="Require verification before applying"
                  description="Prevent users from applying to jobs until verification requirements are satisfied."
                />
              </div>
            </section>

            <section className={PANEL_CLASS}>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5B8FCC] dark:text-[#7AAEE0]">
                  Moderation
                </p>

                <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Moderation controls
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Control automated detection flags and the threshold used for
                  moderation actions.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                <SettingToggle
                  checked={moderationEnablePhoneNumberFlag}
                  onChange={setModerationEnablePhoneNumberFlag}
                  title="Enable phone number flag"
                  description="Flag phone number sharing for moderation review."
                />

                <SettingToggle
                  checked={moderationEnableWhatsappFlag}
                  onChange={setModerationEnableWhatsappFlag}
                  title="Enable WhatsApp flag"
                  description="Flag WhatsApp references for moderation review."
                />

                <SettingToggle
                  checked={moderationEnableOffPlatformPaymentFlag}
                  onChange={setModerationEnableOffPlatformPaymentFlag}
                  title="Enable off-platform payment flag"
                  description="Flag references to payments outside the platform."
                />

                <SettingToggle
                  checked={moderationAutoSuspendEnabled}
                  onChange={setModerationAutoSuspendEnabled}
                  title="Enable auto suspend"
                  description="Allow the configured moderation threshold to trigger automatic suspension."
                />

                <div className={`${SUBPANEL_CLASS} mt-4 p-4`}>
                  <label className="block text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Auto action strike threshold
                  </label>

                  <p className="mt-1 text-xs leading-5 text-[#6B7C99] dark:text-[#8FA0BC]">
                    Number of strikes used by the moderation auto-action
                    configuration.
                  </p>

                  <input
                    type="number"
                    value={moderationAutoActionStrikeThreshold}
                    onChange={(event) =>
                      setModerationAutoActionStrikeThreshold(
                        event.target.value,
                      )
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </section>
          </section>

          <section className={PANEL_CLASS}>
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6B7C99] dark:text-[#8FA0BC]">
                  Configuration
                </p>

                <h3 className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Save platform settings
                </h3>

                <p className="mt-1 text-sm leading-6 text-[#6B7C99] dark:text-[#8FA0BC]">
                  Save the current finance, verification, and moderation
                  configuration to the backend.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className={PRIMARY_BUTTON_CLASS}
              >
                {updateMutation.isPending ? "Saving..." : "Save settings"}
              </button>
            </div>

            {message ? (
              <div
                role="status"
                className={[
                  "mt-5 rounded-xl border px-4 py-3 text-sm",
                  message.type === "ok"
                    ? "border-[#B8D9B8] bg-[#F0FAF0] text-[#2E7D32] dark:border-green-700 dark:bg-green-900/20 dark:text-green-200"
                    : "border-[#F2C0BC] bg-[#FFF4F3] text-[#D9534F] dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
                ].join(" ")}
              >
                {message.text}
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}