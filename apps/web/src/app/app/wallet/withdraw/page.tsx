//path: apps/web/src/app/app/wallet/withdraw/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useMyVerification } from "@/lib/verification/queries";
import {
  useRequestWithdrawal,
  useSaveBankDetails,
  useWalletBalance,
  useBankDetails,
  useWithdrawalHistory,
} from "@/lib/wallet/queries";
import { backendMessage, formatFecFromMilli } from "@/lib/wallet/ui";
import { getActiveRole, getToken } from "@/lib/auth/session";
import { useState } from "react";

// Bank list and mapping
const BANKS_LIST = [
  "Access Bank", "Zenith Bank", "United Bank for Africa (UBA)", "First Bank of Nigeria (FBN)",
  "Guaranty Trust Bank (GTB)", "Fidelity Bank", "Union Bank of Nigeria (UBN)", "Stanbic IBTC Bank",
  "Wema Bank", "FCMB (First City Monument Bank)", "Sterling Bank", "Keystone Bank", "Moniepoint",
  "Opay", "PalmPay", "Kuda Bank", "Flutterwave", "Paga", "PiggyVest", "FairMoney",
  "Carbon (formerly Paylater)", "ALAT by Wema", "V Bank (VFD Group)", "LemFi",
  "MoMo Payment Service Bank (MoMo PSB)", "Interswitch"
];

function getBankCode(bankName: string): string {
  const mapping: Record<string, string> = {
    "Access Bank": "044",
    "Zenith Bank": "057",
    "United Bank for Africa (UBA)": "033",
    "First Bank of Nigeria (FBN)": "011",
    "Guaranty Trust Bank (GTB)": "058",
    "Fidelity Bank": "070",
    "Union Bank of Nigeria (UBN)": "032",
    "Stanbic IBTC Bank": "221",
    "Wema Bank": "035",
    "FCMB (First City Monument Bank)": "214",
    "Sterling Bank": "232",
    "Keystone Bank": "082",
  };
  return mapping[bankName] || "000000"; // dummy code for fintech banks
}

const bankSchema = z.object({
  bankName: z.string().min(2, "Bank name is required"),
  accountName: z.string().min(2, "Account name is required"),
  accountNumber: z.string().length(10, "Account number must be 10 digits").regex(/^\d+$/, "Digits only"),
  bvn: z.string().length(11, "BVN must be 11 digits").regex(/^\d+$/, "Digits only"),
});

type BankForm = z.input<typeof bankSchema>;
type BankData = z.output<typeof bankSchema>;

const withdrawSchema = z.object({
  amountFec: z.coerce.number().finite().min(1, "Minimum is 1 FEC"),
});

type WithdrawForm = z.input<typeof withdrawSchema>;

function toMilliFec(amountFec: number) {
  return Math.round(amountFec * 1000);
}

export default function WalletWithdrawPage() {
  const [mounted, setMounted] = React.useState(false);
  const [showBalance, setShowBalance] = React.useState(true);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pendingAmount, setPendingAmount] = useState<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const token = mounted ? getToken() : null;
  const activeRole = mounted ? getActiveRole() : null;
  const isFixerMode = activeRole === "FIXER";

  const verification = useMyVerification();
  const balance = useWalletBalance("FIXER");

  const saveBank = useSaveBankDetails();
  const withdraw = useRequestWithdrawal();

  const verificationStatus = (verification.data as any)?.status as string | undefined;
  const isVerifiedApproved = verificationStatus === "APPROVED";

  const gateOk = !!token && isVerifiedApproved && isFixerMode;
  const canLoad = !!token && isFixerMode;

  const bankDetails = useBankDetails(canLoad);
  const withdrawals = useWithdrawalHistory(50, canLoad);
  const [bankSavedLocal, setBankSavedLocal] = React.useState(false);

  const hasBank =
    Boolean(bankSavedLocal) ||
    Boolean(
      bankDetails.data &&
        (bankDetails.data.hasBankDetails === true ||
          !!bankDetails.data.accountNumber ||
          !!bankDetails.data.bankName)
    );

  const [editBank, setEditBank] = React.useState(false);
  const [bankSuccess, setBankSuccess] = React.useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = React.useState<string | null>(null);

  const bankForm = useForm<BankForm>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      bvn: "",
    },
    mode: "onTouched",
  });

  const withdrawForm = useForm<WithdrawForm>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { amountFec: 0 },
    mode: "onTouched",
  });

  async function onSubmitBank(values: BankForm) {
    setBankSuccess(null);
    setWithdrawSuccess(null);

    const data: BankData = bankSchema.parse(values);
    const bankCode = getBankCode(data.bankName);
    const payload = { ...data, bankCode };

    await saveBank.mutateAsync(payload);

    setBankSavedLocal(true);
    await bankDetails.refetch();
    setEditBank(false);

    bankForm.reset({
      bankName: "",
      accountName: "",
      accountNumber: "",
      bvn: "",
    });

    setBankSuccess("Bank details saved.");
  }

  async function onAmountSubmit(values: WithdrawForm) {
    const amountFec = Number(values.amountFec);
    if (isNaN(amountFec)) return;
    const amountMilliFec = toMilliFec(amountFec);
    setPendingAmount(amountMilliFec);
    setPinModalOpen(true);
  }

  async function submitWithdrawalWithPin() {
    if (!pendingAmount) return;
    setWithdrawSuccess(null);
    setBankSuccess(null);

    try {
      await withdraw.mutateAsync({ amountMilliFec: pendingAmount, pin });
      setWithdrawSuccess("Withdrawal request submitted.");
      withdrawForm.reset({ amountFec: 0 });
      await withdrawals.refetch();
      setPinModalOpen(false);
      setPin("");
      setPendingAmount(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Error is already displayed by the mutation error handling
    }
  }

  const verificationLoading = verification.isLoading;

  return (
    <div className="min-h-screen bg-linear-to-br from-[#C8DCF0] to-[#D6E4F7] dark:bg-none dark:bg-[#111827] px-4 py-5">
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <Link
              href="/app/wallet"
              className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
            >
              Back
            </Link>
            <Link
              href="/app/wallet/withdraw/history"
              className="text-sm font-medium text-[#5B8FCC] dark:text-[#7AAEE0] hover:underline"
            >
              View history
            </Link>
          </div>
        </div>

        {/* Balance card */}
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-start justify-between">
            <div className="text-sm text-[#6B7C99] dark:text-[#8FA0BC]">Withdrawable earnings</div>
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

        {/* Bank details section */}
        <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Bank details
            </div>
            {gateOk && hasBank && !editBank && (
              <button
  type="button"
  onClick={() => setEditBank(true)}
  className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
>
  Edit
</button>

            )}
          </div>

          {bankDetails.isLoading ? (
            <div className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              Loading bank details…
            </div>
          ) : bankDetails.isError ? (
            <div className="mt-3 rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
              {backendMessage(bankDetails.error) ?? "Failed to load bank details."}
            </div>
          ) : hasBank && !editBank ? (
            <div className="mt-3 space-y-1 text-sm">
              <div>
                <span className="text-[#6B7C99] dark:text-[#8FA0BC]">Bank:</span>{" "}
                <span className="text-[#1A2B4A] dark:text-[#E8F0FA]">{bankDetails.data?.bankName}</span>
              </div>
              <div>
                <span className="text-[#6B7C99] dark:text-[#8FA0BC]">Account name:</span>{" "}
                <span className="text-[#1A2B4A] dark:text-[#E8F0FA]">{bankDetails.data?.accountName}</span>
              </div>
              <div>
                <span className="text-[#6B7C99] dark:text-[#8FA0BC]">Account number:</span>{" "}
                <span className="text-[#1A2B4A] dark:text-[#E8F0FA]">{bankDetails.data?.accountNumber}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={bankForm.handleSubmit(onSubmitBank)} className="mt-3">
              <p className="text-xs text-[#B45309] dark:text-amber-300 text-center mb-3">
                Please double-check all account details before submitting. FixAndEarn is not responsible for errors or losses due to incorrect information provided by users.
              </p>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Account name
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                    placeholder="e.g. John Doe"
                    {...bankForm.register("accountName")}
                    disabled={!gateOk || saveBank.isPending}
                  />
                  {bankForm.formState.errors.accountName && (
                    <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">
                      {String(bankForm.formState.errors.accountName.message)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">Bank</label>
                  <input
                    list="banks-list"
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                    placeholder="Select your bank"
                    {...bankForm.register("bankName")}
                  />
                  <datalist id="banks-list">
                    {BANKS_LIST.map((bank) => (
                      <option key={bank} value={bank} />
                    ))}
                  </datalist>
                  {bankForm.formState.errors.bankName && (
                    <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">
                      {String(bankForm.formState.errors.bankName.message)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                    Account number
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                    placeholder="10-digit NUBAN"
                    inputMode="numeric"
                    {...bankForm.register("accountNumber")}
                    disabled={!gateOk || saveBank.isPending}
                  />
                  {bankForm.formState.errors.accountNumber && (
                    <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">
                      {String(bankForm.formState.errors.accountNumber.message)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                    BVN
                  </label>
                  <input
                    className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                    placeholder="11-digit BVN"
                    inputMode="numeric"
                    {...bankForm.register("bvn")}
                    disabled={!gateOk || saveBank.isPending}
                  />
                  {bankForm.formState.errors.bvn && (
                    <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">
                      {String(bankForm.formState.errors.bvn.message)}
                    </p>
                  )}
                </div>
              </div>

              {saveBank.isError && (
                <div className="mt-3 rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                  {backendMessage(saveBank.error) ?? "Bank details submission failed. Please try again."}
                </div>
              )}

              {bankSuccess && (
                <div className="mt-3 rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
                  {bankSuccess}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {hasBank && (
                 <button
  type="button"
  onClick={() => setEditBank(false)}
  disabled={saveBank.isPending}
  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors
    ${saveBank.isPending
      ? "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 opacity-60"
      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"}
  `}
>
  Cancel
</button>

                )}
<button
  type="submit"
  disabled={!gateOk || saveBank.isPending}
  className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-colors
    ${!gateOk || saveBank.isPending
      ? "cursor-not-allowed border border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500 opacity-60"
      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg focus:ring-2 focus:ring-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300"}
  `}
>
  {saveBank.isPending ? "Saving…" : "Save bank details"}
</button>

              </div>
            </form>
          )}
        </div>

        {/* Withdrawal form */}
        {gateOk && hasBank ? (
          <form
            onSubmit={withdrawForm.handleSubmit(onAmountSubmit)}
            className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
          >
            <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Request withdrawal
            </div>
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
                {...withdrawForm.register("amountFec")}
                disabled={withdraw.isPending}
              />
              {withdrawForm.formState.errors.amountFec && (
                <p className="mt-1 text-sm text-[#D9534F] dark:text-red-300">
                  {String(withdrawForm.formState.errors.amountFec.message)}
                </p>
              )}
            </div>

            {withdraw.isError && (
              <div className="mt-3 rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                {backendMessage(withdraw.error) ?? "Withdrawal request failed. Please try again."}
              </div>
            )}

            {withdrawSuccess && (
              <div className="mt-3 rounded-xl border border-[#B8D9B8] dark:border-green-700 bg-[#F0FAF0] dark:bg-green-900/20 p-3 text-sm text-[#2E7D32] dark:text-green-200">
                {withdrawSuccess}
              </div>
            )}

           <button
  type="submit"
  disabled={withdraw.isPending}
  className={`mt-3 inline-flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors
    ${withdraw.isPending
      ? "cursor-not-allowed bg-blue-200 text-blue-400 dark:bg-blue-900 dark:text-blue-500 opacity-50"
      : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md hover:shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300"}
  `}
>
  {withdraw.isPending ? "Processing…" : "Request withdrawal"}
</button>

          </form>
        ) : (
          <div className="rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-4 shadow-[0_4px_24px_rgba(91,143,204,0.12)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="text-sm font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
              Request withdrawal
            </div>
            <div className="mt-3 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
              {!token ? (
                <Link href="/login" className="underline text-[#5B8FCC] dark:text-[#7AAEE0]">
                  Sign in
                </Link>
              ) : !isFixerMode ? (
                <>
                  This page is for FIXER wallet actions.{" "}
                  <Link href="/app/profile" className="underline text-[#5B8FCC] dark:text-[#7AAEE0]">
                    Switch your active role
                  </Link>{" "}
                  to FIXER.
                </>
              ) : verificationLoading ? (
                "Loading verification status…"
              ) : !isVerifiedApproved ? (
                <>
                  Deposits are available only after verification is approved.{" "}
                  <Link href="/app/verification" className="underline text-[#5B8FCC] dark:text-[#7AAEE0]">
                    Go to Verification
                  </Link>
                </>
              ) : !hasBank ? (
                "Save bank details above before requesting a withdrawal."
              ) : null}
            </div>
          </div>
        )}

        {/* PIN MODAL */}
        {pinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
            <div className="max-w-md w-full rounded-2xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-white dark:bg-[#1E2A3A] p-6 shadow-[0_8px_32px_rgba(91,143,204,0.16)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              <h2 className="text-xl font-semibold text-[#1A2B4A] dark:text-[#E8F0FA]">
                Enter withdrawal pin
              </h2>
              <p className="mt-1 text-sm text-[#6B7C99] dark:text-[#8FA0BC]">
                For your security, please enter your withdrawal pin to confirm.
              </p>

              <div className="mt-4">
                <label className="block text-sm font-medium text-[#1A2B4A] dark:text-[#E8F0FA]">
                  Withdrawal pin
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-6 digit pin"
                  className="mt-1 w-full rounded-xl border border-[#C5D5EE] dark:border-[#2D3F55] bg-[#F4F8FF] dark:bg-[#16202E] px-4 py-3 text-sm text-[#1A2B4A] dark:text-[#E8F0FA] outline-none transition placeholder:text-[#9BAEC8] dark:placeholder:text-[#4A6080] focus:border-[#5B8FCC] dark:focus:border-[#5B8FCC] focus:ring-2 focus:ring-[#5B8FCC]/20"
                  autoFocus
                />
              </div>

              <div className="mt-6 flex gap-2">
                <button
  onClick={() => {
    setPinModalOpen(false);
    setPin("");
  }}
  className="flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition-colors
    border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900
    dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-gray-100"
>
  Cancel
</button>
                <button
  onClick={submitWithdrawalWithPin}
  disabled={withdraw.isPending || pin.length < 4}
  className={`flex-1 rounded-lg py-3 text-sm font-semibold text-white transition-colors
    ${withdraw.isPending || pin.length < 4
      ? "cursor-not-allowed bg-blue-200 text-blue-400 dark:bg-blue-900 dark:text-blue-500 opacity-50"
      : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 shadow-md hover:shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-300"}
  `}
>
  {withdraw.isPending ? "Submitting..." : "Confirm withdrawal"}
</button>

              </div>

              {withdraw.isError && (
                <div className="mt-3 rounded-xl border border-[#F2C0BC] dark:border-red-700 bg-[#FFF4F3] dark:bg-red-900/20 p-3 text-sm text-[#D9534F] dark:text-red-300">
                  {backendMessage(withdraw.error) ?? "Invalid pin or request failed."}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}