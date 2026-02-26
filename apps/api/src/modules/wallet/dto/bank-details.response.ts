// Path: apps/api/src/modules/wallet/dto/bank-details.response.ts
export type BankDetailsResponse = {
  hasBankDetails: boolean;
  bankName: string | null;
  accountName: string | null;
  accountNumber: string | null;
  updatedAt: string | null;
};