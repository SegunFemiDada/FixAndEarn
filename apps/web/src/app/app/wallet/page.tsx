//path: apps/web/src/app/app/wallet/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useMyVerification } from "@/lib/verification/queries";
import { useWalletBalance } from "@/lib/wallet/queries";
import { getToken, getStoredRoles, getActiveRole, type Role } from "@/lib/auth/session";

function formatFecFromMilli(milli: number): string {
  return `${(milli / 1000).toFixed(2)} FEC`;
}

function backendMessage(err: unknown): string | null {
  const e = err as { response?: { data?: { message?: unknown } } };
  const msg = e?.response?.data?.message;
  if (!msg) return null;
  if (Array.isArray(msg)) return msg.join(", ");
  return String(msg);
}

function roleForUi(roles: Role[], active: Role | null): Role | null {
  if (active) return active;
  if (roles.length === 1) return roles[0];
  return null;
}

export default function WalletPage() {
  const [mounted, setMounted] = React.useState(false);
  const [showBalance, setShowBalance] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const token = mounted ? getToken() : null;
  const roles = mounted ? getStoredRoles() : [];
  const active = mounted ? getActiveRole() : null;
  const uiRole = roleForUi(roles, active);

  const verification = useMyVerification();
  const balance = useWalletBalance(uiRole ?? undefined);

  const verificationStatus = verification.data?.status;
  const isVerifiedApproved = verificationStatus === "APPROVED";

  // const canDeposit = uiRole === "CLIENT" && isVerifiedApproved;
  const canWithdraw = uiRole === "FIXER" && isVerifiedApproved;

  const needsRoleChoice = mounted && (roles.length === 0 || (roles.length > 0 && !active));
  React.useEffect(() => {
  if (mounted && uiRole === "CLIENT") {
    window.location.replace("/app/dashboard");
  }
}, [mounted, uiRole]);

if (mounted && uiRole === "CLIENT") {
  return null;
}

  if (!mounted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-5">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 text-sm text-[#6B7C99] dark:text-[#8FA0BC] shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            Loading…
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-5">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
           My Earnings
          </h1>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            { uiRole === "FIXER"
                ? "View your earnings and withdraw them to your bank account."
                : "Your in-app balance and wallet payout."}
          </p>
        </div>

        {!token && (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">You are not logged in</div>
            <div className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Sign in to continue.</div>
            <div className="mt-3">
             <Link
  href="/login"
  className={`inline-flex w-full justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors
    bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md hover:shadow-lg
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300`}
>
  Go to Login
</Link>

            </div>
          </div>
        )}

        {needsRoleChoice && (
          <div className="rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="text-sm font-medium text-[#B45309] dark:text-amber-300">Role selection required</div>
            <div className="mt-1 text-sm text-[#B45309] dark:text-amber-300/80">
              Choose the role you want to use before accessing wallet actions.
            </div>
            <div className="mt-3">
              <Link href="/app/profile" className={`inline-flex w-full justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors
    bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md hover:shadow-lg
    dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300`}>
                Go to Profile
              </Link>
            </div>
          </div>
        )}

        {!verification.isLoading && !isVerifiedApproved && (
          <div className="rounded-2xl border border-[#F5A623] dark:border-amber-700 bg-[#FEF8E7] dark:bg-amber-900/20 p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="text-sm font-medium text-[#B45309] dark:text-amber-300">Verification required</div>
            <div className="mt-1 text-sm text-[#B45309] dark:text-amber-300/80">
              Wallet actions are available only after verification is approved.
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                Available earnings
              </div>
              <div className="mt-1 text-2xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                {showBalance
                  ? balance.isLoading
                    ? "Loading…"
                    : balance.isError
                      ? "Error"
                      : typeof balance.data?.balanceMilliFec === "number"
                        ? formatFecFromMilli(balance.data.balanceMilliFec)
                        : "—"
                  : "•••••"}
              </div>
            </div>

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

          {balance.isError && (
            <div className="mt-3 rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
              {backendMessage(balance.error) ?? "Balance request failed."}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">Payout</div>

          {/* <div className="mt-3 space-y-2">
            {canDeposit && (
              <Link href="/app/wallet/deposit" className={`block w-full rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300`}>
                Deposit
              </Link>
            )} */}

            {canWithdraw && (
              <Link href="/app/wallet/withdraw" className={`block w-full rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-300`}>
                Withdraw
              </Link>
            )}
          </div>
        </div>
      </div>
  );
}