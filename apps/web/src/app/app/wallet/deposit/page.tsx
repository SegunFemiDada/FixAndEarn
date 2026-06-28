//path: apps/web/src/app/app/wallet/deposit/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useMyVerification } from "@/lib/verification/queries";
import { useInitiateDeposit, useSimulateDepositWebhook, useWalletBalance } from "@/lib/wallet/queries";
import { backendMessage, formatFecFromMilli } from "@/lib/wallet/ui";
import { getActiveRole, getToken } from "@/lib/auth/session";

const depositSchema = z.object({
  amountFec: z.coerce.number().finite().min(0.01, "Minimum is 0.01 FEC").max(1_000_000, "Amount too large"),
});

type DepositForm = z.input<typeof depositSchema>;
type DepositData = z.output<typeof depositSchema>;

function toMilliFec(amountFec: number) {
  return Math.round(amountFec * 1000);
}

export default function WalletDepositPage() {
  const [mounted, setMounted] = React.useState(false);
  const [showBalance, setShowBalance] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const token = mounted ? getToken() : null;
  const activeRole = mounted ? getActiveRole() : null;
  const isClientMode = activeRole === "CLIENT";

  const verification = useMyVerification();
  const balance = useWalletBalance();
  const deposit = useInitiateDeposit();
  const simulate = useSimulateDepositWebhook();

  const verificationStatus = (verification.data as { status?: string } | undefined)?.status;
  const isVerifiedApproved = verificationStatus === "APPROVED";
  const gateOk = !!token && isVerifiedApproved && isClientMode;

  const [success, setSuccess] = React.useState<string | null>(null);
  const [lastInit, setLastInit] = React.useState<{
    authorizationUrl?: string;
    paystackRef?: string;
    amountMilliFec?: number;
  } | null>(null);

  const form = useForm<DepositForm>({
    resolver: zodResolver(depositSchema),
    defaultValues: { amountFec: 1 },
    mode: "onTouched",
  });

  async function onSubmit(values: DepositForm) {
    setSuccess(null);
    setLastInit(null);

    const data: DepositData = depositSchema.parse(values);

    const res = await deposit.mutateAsync({
      amountMilliFec: toMilliFec(data.amountFec),
    });

    if (res?.error) throw new Error(String(res.error));

    setLastInit({
      authorizationUrl: res?.authorizationUrl,
      paystackRef: res?.paystackRef,
      amountMilliFec: res?.amountMilliFec,
    });

    setSuccess("Deposit initiated. Open the Paystack link to complete payment.");
  }

  async function simulateSuccess() {
    if (!lastInit?.paystackRef) return;

    setSuccess(null);
    const res = await simulate.mutateAsync({
      paystackRef: lastInit.paystackRef,
      status: "success",
    });

    if (res?.error) throw new Error(String(res.error));

    setSuccess("Deposit simulated as SUCCESS. Balance updated.");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-5">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <Link href="/app/wallet" className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline">
              Back
            </Link>
            <Link href="/app/wallet/deposit/history" className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline">
              View history
            </Link>
          </div>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Deposits are available in CLIENT mode only.
          </p>
        </div>

        {!token ? (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">You are not logged in</div>
            <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Sign in to continue.</div>
            <div className="mt-3">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
              >
                Go to Login
              </Link>
            </div>
          </div>
        ) : null}

        {!verification.isLoading && token && !isVerifiedApproved ? (
          <div className="rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="text-sm font-medium text-[#B45309] dark:text-amber-300">Verification required</div>
            <div className="mt-1 text-sm text-[#B45309] dark:text-amber-300/80">
              Deposits are available only after verification is approved.
              {verificationStatus ? (
                <span className="ml-1">
                  Current status: <span className="font-semibold">{verificationStatus}</span>.
                </span>
              ) : null}
            </div>
            <div className="mt-3">
              <Link
                href="/app/verification"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
              >
                Go to Verification
              </Link>
            </div>
          </div>
        ) : null}

        {token && isVerifiedApproved && !isClientMode ? (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Client mode required</div>
            <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              This page is for CLIENT wallet actions. Switch your active role to CLIENT.
            </div>
            <div className="mt-3">
              <Link
                href="/app/profile"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#5B8FCC] hover:bg-[#4A7DBB] dark:bg-[#5B8FCC] dark:hover:bg-[#4A7DBB] px-4 py-2 text-sm font-medium text-white transition shadow-[0_2px_12px_rgba(91,143,204,0.35)] hover:shadow-[0_4px_16px_rgba(91,143,204,0.45)]"
              >
                Go to Profile
              </Link>
            </div>
          </div>
        ) : null}

        {/* ONLY show main functionality when allowed */}
        {gateOk && (
          <>
            <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
              <div className="flex items-start justify-between">
                <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Current balance</div>
                <button
                  onClick={() => setShowBalance((v) => !v)}
                  className="rounded-full p-2 text-[#6B7C99] dark:text-[#8FA0BC] hover:bg-[#F4F8FF] dark:hover:bg-[#16202E] transition"
                  aria-label={showBalance ? "Hide balance" : "Show balance"}
                >
                  {showBalance ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="mt-1 text-lg font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {showBalance ? (
                  balance.isLoading ? (
                    <span className="text-[#6B7C99] dark:text-[#8FA0BC]">Loading…</span>
                  ) : balance.isError ? (
                    <span className="text-[#D9534F] dark:text-red-300">Unable to load balance</span>
                  ) : (
                    formatFecFromMilli(balance.data?.balanceMilliFec ?? 0)
                  )
                ) : (
                  "•••••"
                )}
              </div>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
            >
              <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Initiate deposit</div>
              <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Enter amount in FEC.
              </p>

              <div className="mt-3">
                <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Amount (FEC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  {...form.register("amountFec")}
                  disabled={deposit.isPending}
                />
              </div>

              {success && (
                <div className="mt-3 rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
                  {success}
                </div>
              )}

              {lastInit?.authorizationUrl && (
                <div className="mt-3 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] p-3 text-sm">
                  <a
                    href={lastInit.authorizationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300"
                  >
                    Open Paystack checkout
                  </a>
                </div>
              )}

              <button
  type="submit"
  disabled={deposit.isPending}
  className={`mt-3 inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors
    ${deposit.isPending
      ? "cursor-not-allowed bg-blue-200 text-blue-400 dark:bg-blue-900 dark:text-blue-500 opacity-50"
      : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md hover:shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300"}
  `}
>
  {deposit.isPending ? "Submitting…" : "Initiate deposit"}
</button>

            </form>
          </>
        )}
      </div>
    </div>
  );
}