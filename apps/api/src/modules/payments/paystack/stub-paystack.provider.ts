import { Injectable } from "@nestjs/common";
import {
  PaystackCreateRecipientRequest,
  PaystackCreateRecipientResponse,
  PaystackInitRequest,
  PaystackInitResponse,
  PaystackProvider,
  PaystackResolveAccountResponse
} from "./paystack.provider";

@Injectable()
export class StubPaystackProvider implements PaystackProvider {
  async initializeTransaction(req: PaystackInitRequest): Promise<PaystackInitResponse> {
    return {
      reference: req.reference,
      authorizationUrl: `https://paystack.com/pay/${req.reference}`
    };
  }

  async resolveAccountNumber(accountNumber: string, _bankCode: string): Promise<PaystackResolveAccountResponse> {
    // stub "success"
    return {
      accountName: "Stub Account",
      accountNumber
    };
  }

  async createTransferRecipient(req: PaystackCreateRecipientRequest): Promise<PaystackCreateRecipientResponse> {
    return {
      recipientCode: `RCP_${req.bankCode}_${req.accountNumber.slice(-4)}_${Math.random().toString(36).slice(2, 8)}`
    };
  }

  async initiateTransfer(req: {
    recipientCode: string;
    amountKobo: number;
    reference: string;
    reason?: string;
  }): Promise<{ transferCode: string; transferId?: string | null }> {
    return {
      transferCode: `TRF_${req.reference}`,
      transferId: null
    };
  }
}