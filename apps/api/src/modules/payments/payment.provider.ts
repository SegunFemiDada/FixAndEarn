export interface InitializePaymentRequest {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, unknown>;
}

export interface InitializePaymentResponse {
  authorizationUrl: string;
  reference: string;
}

export interface ResolveAccountResponse {
  accountName: string;
  accountNumber: string;
}

export interface VerifyTransactionResponse {
  paymentReference: string;
  transactionReference: string;
  paymentStatus: string;
  amountPaid: number;
  currency: string;
  raw: unknown;
}

export interface PaymentProvider {
  verifyWebhookSignature(
    payload: unknown,
    signature?: string,
  ): boolean;
    verifyTransaction(
    reference: string,
  ): Promise<VerifyTransactionResponse>;

  initializeTransaction(
    request: InitializePaymentRequest,
  ): Promise<InitializePaymentResponse>;
}