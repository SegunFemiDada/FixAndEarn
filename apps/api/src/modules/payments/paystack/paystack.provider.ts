// Path: /apps/api/src/modules/payments/paystack/paystack.provider.ts
export type PaystackInitRequest = {
  email: string;
  amountKobo: number;
  reference: string;
  metadata?: Record<string, any>;
};

export type PaystackInitResponse = {
  authorizationUrl: string;
  reference: string;
};

export interface PaystackProvider {
  initializeTransaction(req: PaystackInitRequest): Promise<PaystackInitResponse>;
}
