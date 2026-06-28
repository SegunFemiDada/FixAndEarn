// Path: apps/web/src/app/app/wallet/withdraw/history/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useMyVerification } from "@/lib/verification/queries";
import { getActiveRole, getToken } from "@/lib/auth/session";
import { useWithdrawalHistory } from "@/lib/wallet/queries";
import { backendMessage, formatFecFromMilli } from "@/lib/wallet/ui";
import type { WithdrawalHistoryItem } from "@/lib/wallet/api";

export default function WithdrawalHistoryPage() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const token = mounted ? getToken() : null;
  const activeRole = mounted ? getActiveRole() : null;
  const isFixerMode = activeRole === "FIXER";

  const verification = useMyVerification();
  const verificationStatus = (verification.data as { status?: string } | undefined)?.status;
  const isVerifiedApproved = verificationStatus === "APPROVED";

  const gateOk = !!token && isVerifiedApproved && isFixerMode;
  const withdrawals = useWithdrawalHistory(50, gateOk);

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-5">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Withdrawal history
            </h1>
            <Link
              href="/app/wallet/withdraw"
              className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
            >
              Back
            </Link>
          </div>
          <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
            Your last 50 fixer withdrawal requests.
          </p>
        </div>

        {/* Only show history when allowed */}
        {gateOk ? (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            {withdrawals.isLoading ? (
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Loading…</div>
            ) : withdrawals.isError ? (
              <div className="text-sm text-[#D9534F] dark:text-red-300">
                {backendMessage(withdrawals.error) ?? "Failed to load withdrawals."}
              </div>
            ) : (withdrawals.data?.items?.length ?? 0) === 0 ? (
              <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">No withdrawals yet.</div>
            ) : (
              <div className="space-y-2">
                {withdrawals.data!.items.map((w: WithdrawalHistoryItem) => (
                  <div
                    key={w.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                        #{String(w.id).slice(0, 8)}
                      </div>
                      <div className="mt-0.5 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        {w.createdAt ? new Date(w.createdAt).toLocaleString() : "—"}
                      </div>
                      <div className="mt-0.5 text-xs text-[#6B7C99] dark:text-[#8FA0BC]">
                        Status: {String(w.status ?? "—")}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                        {formatFecFromMilli(Number(w.amountMilliFec ?? 0))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Show guidance card when not authorized
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              {!token ? (
                <>
                  You need to be logged in to view withdrawal history.{" "}
                  <Link
                    href="/login"
                    className="underline text-[#5B8FCC] dark:text-[#7AAEE0]"
                  >
                    Go to Login
                  </Link>
                </>
              ) : !isFixerMode ? (
                <>
                  Withdrawal history is only available in FIXER mode.{" "}
                  <Link
                    href="/app/profile"
                    className="underline text-[#5B8FCC] dark:text-[#7AAEE0]"
                  >
                    Switch your active role
                  </Link>{" "}
                  to FIXER.
                </>
              ) : verification.isLoading ? (
                "Loading verification status…"
              ) : !isVerifiedApproved ? (
                <>
                  Your account must be verified to access withdrawals.{" "}
                  <Link
                    href="/app/verification"
                    className="underline text-[#5B8FCC] dark:text-[#7AAEE0]"
                  >
                    Go to Verification
                  </Link>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}