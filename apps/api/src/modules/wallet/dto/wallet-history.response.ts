//path: apps/api/src/modules/wallet/dto/wallet-history.response.ts
export type WalletHistoryItem = {
  id: string;
  amountMilliFec: number;
  status: string;
  createdAt: string;
  paystackRef?: string | null;
  amountKobo?: number | null;
};

export type WalletHistoryResponse = {
  items: WalletHistoryItem[];
};