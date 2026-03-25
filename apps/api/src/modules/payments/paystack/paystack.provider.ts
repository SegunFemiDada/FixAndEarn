// Path: apps/api/src/modules/payments/paystack/paystack.provider.ts
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
  bankCode: string;
};

export type PaystackCreateRecipientResponse = {
  recipientCode: string;
};

export type PaystackResolveAccountResponse = {
  accountName: string;
  accountNumber: string;
};

export type PaystackInitiateTransferRequest = {
  recipientCode: string;
  amountKobo: number;
  reference: string;
  reason?: string;
};

export type PaystackInitiateTransferResponse = {
  transferCode: string;
  transferId?: string | null;
};

export type PaystackFetchTransferResponse = {
  reference: string;
  transferCode?: string | null;
  status: string;
  raw?: unknown;
};

export interface PaystackProvider {
  initializeTransaction(req: PaystackInitRequest): Promise<PaystackInitResponse>;

  verifyWebhookSignature(rawBody: Buffer, signature?: string): boolean;

  resolveAccountNumber(
    accountNumber: string,
    bankCode: string
  ): Promise<PaystackResolveAccountResponse>;

  createTransferRecipient(
    req: PaystackCreateRecipientRequest
  ): Promise<PaystackCreateRecipientResponse>;

  initiateTransfer(
    req: PaystackInitiateTransferRequest
  ): Promise<PaystackInitiateTransferResponse>;

  fetchTransfer(reference: string): Promise<PaystackFetchTransferResponse>;
}