// Path: apps/web/src/lib/wallet/queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWalletBalance,
  initiateDeposit,
  requestWithdrawal,
  saveBankDetails,
  simulateDepositWebhook,
  getBankDetails,
  listDepositHistory,
  listWithdrawalHistory,
  setWithdrawalPin,
  verifyWithdrawalPin,
  getWithdrawalPinStatus,
} from "./api";


const keys = {
  balance: (role?: "CLIENT" | "FIXER") => ["wallet", "balance", role ?? "AUTO"] as const,
  bankDetails: ["wallet", "bankDetails"] as const,
  depositHistory: (take: number) => ["wallet", "depositHistory", take] as const,
  withdrawalHistory: (take: number) => ["wallet", "withdrawalHistory", take] as const,
};

export function useWalletBalance(role?: "CLIENT" | "FIXER") {
  return useQuery({
    queryKey: keys.balance(role),
    queryFn: () => getWalletBalance(role),
    staleTime: 10_000,
    retry: 1,
  });
}

export function useInitiateDeposit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { amountMilliFec: number }) => initiateDeposit(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["wallet", "balance"] });
      await qc.invalidateQueries({ queryKey: keys.depositHistory(50) });
    },
  });
}

export function useSimulateDepositWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { paystackRef: string; status?: "success" | "failed" }) =>
      simulateDepositWebhook(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["wallet", "balance"] });
      await qc.invalidateQueries({ queryKey: keys.depositHistory(50) });
    },
  });
}

export function useBankDetails(enabled: boolean) {
  return useQuery({
    queryKey: keys.bankDetails,
    queryFn: getBankDetails,
    enabled,
    staleTime: 10_000,
    retry: 1,
  });
}

export function useSaveBankDetails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      bankName: string;
      bankCode: string;
      accountNumber: string;
      accountName: string;
      bvn: string;
    }) => saveBankDetails(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.bankDetails });
    },
  });
}

export function useRequestWithdrawal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { amountMilliFec: number; pin: string }) => requestWithdrawal(data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["wallet", "balance"] });
      await qc.invalidateQueries({ queryKey: keys.withdrawalHistory(50) });
    },
  });
}
export function useSetWithdrawalPin() {
  return useMutation({
    mutationFn: (data: { currentPin?: string; newPin: string }) => setWithdrawalPin(data),
  });
}

export function useVerifyWithdrawalPin() {
  return useMutation({
    mutationFn: (pin: string) => verifyWithdrawalPin(pin),
  });
}

export function useDepositHistory(take: number, enabled: boolean) {
  return useQuery({
    queryKey: keys.depositHistory(take),
    queryFn: () => listDepositHistory({ take }),
    enabled,
    staleTime: 10_000,
    retry: 1,
  });
}

export function useWithdrawalHistory(take: number, enabled: boolean) {
  return useQuery({
    queryKey: keys.withdrawalHistory(take),
    queryFn: () => listWithdrawalHistory({ take }),
    enabled,
    staleTime: 10_000,
    retry: 1,
  });
}
export function useWithdrawalPinStatus() {
  return useQuery({
    queryKey: ["wallet", "pin-status"],
    queryFn: getWithdrawalPinStatus,
  });
}
