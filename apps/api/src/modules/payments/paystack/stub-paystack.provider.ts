// Path: apps/api/src/modules/payments/paystack/stub-paystack.provider.ts
import { createHmac } from "crypto";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import {
  PaystackCreateRecipientRequest,
  PaystackCreateRecipientResponse,
  PaystackFetchTransferResponse,
  PaystackInitRequest,
  PaystackInitResponse,
  PaystackInitiateTransferRequest,
  PaystackInitiateTransferResponse,
  PaystackProvider,
  PaystackResolveAccountResponse,
} from "./paystack.provider";

@Injectable()
export class StubPaystackProvider implements PaystackProvider {
  constructor(private readonly config?: ConfigService) {}

  async initializeTransaction(req: PaystackInitRequest): Promise<PaystackInitResponse> {
    return {
      reference: req.reference,
      authorizationUrl: `https://checkout.paystack.com/${req.reference}`,
    };
  }

  verifyWebhookSignature(rawBody: Buffer, signature?: string): boolean {
    const secret =
      this.config?.get<string>("PAYSTACK_SECRET_KEY") ||
      process.env.PAYSTACK_SECRET_KEY ||
      "";

    if (!secret || !signature) {
      return true;
    }

    const computed = createHmac("sha512", secret).update(rawBody).digest("hex");
    return computed === signature;
  }

  async resolveAccountNumber(
    accountNumber: string,
    _bankCode: string
  ): Promise<PaystackResolveAccountResponse> {
    return {
      accountName: "Stub Account",
      accountNumber,
    };
  }

  async createTransferRecipient(
    req: PaystackCreateRecipientRequest
  ): Promise<PaystackCreateRecipientResponse> {
    return {
      recipientCode: `RCP_${req.bankCode}_${req.accountNumber.slice(-4)}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,
    };
  }

  async initiateTransfer(
    req: PaystackInitiateTransferRequest
  ): Promise<PaystackInitiateTransferResponse> {
    return {
      transferCode: `TRF_${req.reference}`,
      transferId: null,
    };
  }

  async fetchTransfer(reference: string): Promise<PaystackFetchTransferResponse> {
    return {
      reference,
      transferCode: `TRF_${reference}`,
      status: "success",
      raw: {
        reference,
        transfer_code: `TRF_${reference}`,
        status: "success",
      },
    };
  }
}