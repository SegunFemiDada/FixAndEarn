// Path: /apps/api/src/modules/payments/paystack/stub-paystack.provider.ts
import { Injectable } from "@nestjs/common";
import { PaystackInitRequest, PaystackInitResponse, PaystackProvider } from "./paystack.provider";

@Injectable()
export class StubPaystackProvider implements PaystackProvider {
  async initializeTransaction(req: PaystackInitRequest): Promise<PaystackInitResponse> {
    // Sandbox stub
    return {
      reference: req.reference,
      authorizationUrl: `https://paystack.com/pay/${req.reference}`
    };
  }
}
