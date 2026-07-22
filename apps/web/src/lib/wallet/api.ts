//path: apps/web/src/lib/wallet/api.ts
import apiClient from "@/lib/apiClient";

export async function getWalletBalance(
  role?: "CLIENT" | "FIXER"
): Promise<{ role?: "CLIENT" | "FIXER"; balanceMilliFec: number; balanceFec?: number }> {
  const res = await apiClient.get("/wallet/balance", {
    params: role ? { role } : undefined,
  });
  return res.data;
}

export async function initiateDeposit(payload: { amountMilliFec: number }): Promise<any> {
  const res = await apiClient.post("/wallet/deposits/initiate", payload);
  return res.data;
}

export async function simulateDepositWebhook(payload: {
  paystackRef: string;
  status?: "success" | "failed";
}): Promise<any> {
  const res = await apiClient.post("/wallet/deposits/webhook-simulate", {
    paystackRef: payload.paystackRef,
    status: payload.status ?? "success",
  });
  return res.data;
}

export type BankDetailsDto = {
  hasBankDetails: boolean;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  updatedAt: string | null;
};

export async function getBankDetails(): Promise<BankDetailsDto> {
  const res = await apiClient.get("/wallet/bank-details");
  return res.data;
}

export async function saveBankDetails(payload: {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  bvn: string;
}): Promise<any> {
  const res = await apiClient.post("/wallet/bank-details", payload);
  return res.data;
}

export type DepositHistoryItem = {
  id: string;
  amountMilliFec: number;
  amountKobo: number;
  paystackRef: string;
  status: "PENDING" | "SUCCEEDED" | "FAILED" | string;
  createdAt: string;
};

export async function listDepositHistory(params?: { skip?: number; take?: number }) {
  const res = await apiClient.get("/wallet/deposits/history", { params });
  return res.data;
}

export type WithdrawalHistoryItem = {
  id: string;
  amountMilliFec: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PAID" | string;
  createdAt: string;
};

export async function listWithdrawalHistory(params?: { skip?: number; take?: number }) {
  const res = await apiClient.get("/wallet/withdrawals/history", { params });
  return res.data;
}

export type WalletHistoryItem = {
  id: string;
  type?: string;
  direction?: "CREDIT" | "DEBIT";
  amountMilliFec: number;
  reference?: string | null;
  createdAt: string;
  status?: string;
};

export type WalletHistoryResponse = {
  items: WalletHistoryItem[];
};

// Updated: includes pin parameter
export async function requestWithdrawal(data: { amountMilliFec: number; pin: string }) {
  const response = await apiClient.post("/wallet/withdrawals/request", data);
  return response.data;
}

export async function setWithdrawalPin(data: { currentPin?: string; newPin: string }) {
  const response = await apiClient.post("/wallet/set-withdrawal-pin", data);
  return response.data;
}

export async function verifyWithdrawalPin(pin: string) {
  const response = await apiClient.post("/wallet/verify-withdrawal-pin", { pin });
  return response.data;
}
export async function getWithdrawalPinStatus(): Promise<{ hasPin: boolean }> {
  const res = await apiClient.get("/wallet/withdrawal-pin-status");
  return res.data;
}