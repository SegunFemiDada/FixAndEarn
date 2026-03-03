export type PaystackInitRequest = {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, unknown>;
};

export type PaystackInitResponse = {
  authorizationUrl: string;
  reference: string;
};

export type PaystackCreateRecipientRequest = {
  name: string;
  accountNumber: string;
  bankCode: string; // in stub we won't validate this
};

export type PaystackCreateRecipientResponse = {
  recipientCode: string;
};

export interface PaystackProvider {
  initializeTransaction(req: PaystackInitRequest): Promise<PaystackInitResponse>;

  // ✅ Milestone 1
  createTransferRecipient(
    req: PaystackCreateRecipientRequest
  ): Promise<PaystackCreateRecipientResponse>;
}
export type PaystackResolveAccountResponse = {
  accountName: string;
  accountNumber: string;
};
export interface PaystackProvider {
  initializeTransaction(req: PaystackInitRequest): Promise<PaystackInitResponse>;

  resolveAccountNumber(accountNumber: string, bankCode: string): Promise<PaystackResolveAccountResponse>;

  createTransferRecipient(req: PaystackCreateRecipientRequest): Promise<PaystackCreateRecipientResponse>;

  initiateTransfer(req: {
    recipientCode: string;
    amountKobo: number;
    reference: string;
    reason?: string;
  }): Promise<{
    transferCode: string;
    transferId?: string | null;
  }>;
}