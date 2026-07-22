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


export interface InitiateTransferRequest {
  amountKobo: number;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  reference: string;
  reason?: string;
}

export interface InitiateTransferResponse {
  transferCode: string;
  transferId: string | null;
}

export interface FetchTransferResponse {
  reference: string;
  transferCode: string | null;
  status: string;
  raw: unknown;
}

export interface PaymentProvider {
  verifyWebhookSignature(
    payload: unknown,
    signature?: string,
  ): boolean;

  initializeTransaction(
    request: InitializePaymentRequest,
  ): Promise<InitializePaymentResponse>;

  resolveAccountNumber(
    accountNumber: string,
    bankCode: string,
  ): Promise<ResolveAccountResponse>;


  initiateTransfer(
    request: InitiateTransferRequest,
  ): Promise<InitiateTransferResponse>;

  fetchTransfer(
    reference: string,
  ): Promise<FetchTransferResponse>;
}