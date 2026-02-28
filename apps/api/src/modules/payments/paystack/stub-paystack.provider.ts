import { Injectable } from "@nestjs/common";
import {
  PaystackCreateRecipientRequest,
  PaystackCreateRecipientResponse,
  PaystackInitRequest,
  PaystackInitResponse,
  PaystackProvider
} from "./paystack.provider";

@Injectable()
export class StubPaystackProvider implements PaystackProvider {
  async initializeTransaction(req: PaystackInitRequest): Promise<PaystackInitResponse> {
    // Sandbox stub
    return {
      reference: req.reference,
      authorizationUrl: `https://paystack.com/pay/${req.reference}`
    };
  }

  async createTransferRecipient(
    req: PaystackCreateRecipientRequest
  ): Promise<PaystackCreateRecipientResponse> {
    // Sandbox stub:
    // Deterministic-ish fake recipient code so repeated calls are stable enough in dev.
    const suffix = `${req.bankCode}-${req.accountNumber}`.replace(/\s+/g, "").slice(-20);
    return { recipientCode: `RCP_STUB_${suffix}` };
  }
}