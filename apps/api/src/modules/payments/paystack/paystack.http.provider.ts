// Path: apps/api/src/modules/payments/paystack/paystack.http.provider.ts
import { createHmac } from "crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
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
export class PaystackHttpProvider implements PaystackProvider {
  private readonly secretKey: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.secretKey = this.config.get<string>("PAYSTACK_SECRET_KEY", "").trim();
    this.baseUrl = this.config
      .get<string>("PAYSTACK_BASE_URL", "https://api.paystack.co")
      .trim()
      .replace(/\/+$/, "");

    if (!this.secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is required");
    }
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  private async parseJson<T>(response: Response): Promise<T> {
    const payload = (await response.json()) as any;

    if (!response.ok || payload?.status === false) {
      throw new Error(String(payload?.message ?? "PAYSTACK_REQUEST_FAILED"));
    }

    return payload as T;
  }

  verifyWebhookSignature(rawBody: Buffer, signature?: string): boolean {
    if (!signature) return false;
    const computed = createHmac("sha512", this.secretKey).update(rawBody).digest("hex");
    return computed === signature;
  }

  async initializeTransaction(req: PaystackInitRequest): Promise<PaystackInitResponse> {
    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        email: req.email,
        amount: req.amountKobo,
        reference: req.reference,
        metadata: req.metadata ?? {},
      }),
    });

    const payload = await this.parseJson<{
      status: boolean;
      message: string;
      data: {
        authorization_url: string;
        reference: string;
      };
    }>(response);

    return {
      authorizationUrl: payload.data.authorization_url,
      reference: payload.data.reference,
    };
  }

  async resolveAccountNumber(
    accountNumber: string,
    bankCode: string
  ): Promise<PaystackResolveAccountResponse> {
    const url = new URL(`${this.baseUrl}/bank/resolve`);
    url.searchParams.set("account_number", accountNumber);
    url.searchParams.set("bank_code", bankCode);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.headers,
    });

    const payload = await this.parseJson<{
      status: boolean;
      message: string;
      data: {
        account_name: string;
        account_number: string;
      };
    }>(response);

    return {
      accountName: payload.data.account_name,
      accountNumber: payload.data.account_number,
    };
  }

  async createTransferRecipient(
    req: PaystackCreateRecipientRequest
  ): Promise<PaystackCreateRecipientResponse> {
    const response = await fetch(`${this.baseUrl}/transferrecipient`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        type: "nuban",
        name: req.name,
        account_number: req.accountNumber,
        bank_code: req.bankCode,
        currency: "NGN",
      }),
    });

    const payload = await this.parseJson<{
      status: boolean;
      message: string;
      data: {
        recipient_code: string;
      };
    }>(response);

    return {
      recipientCode: payload.data.recipient_code,
    };
  }

  async initiateTransfer(
    req: PaystackInitiateTransferRequest
  ): Promise<PaystackInitiateTransferResponse> {
    const response = await fetch(`${this.baseUrl}/transfer`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        source: "balance",
        amount: req.amountKobo,
        recipient: req.recipientCode,
        reason: req.reason ?? "FixAndEarn withdrawal",
        reference: req.reference,
      }),
    });

    const payload = await this.parseJson<{
      status: boolean;
      message: string;
      data: {
        transfer_code: string;
        id?: string | number | null;
      };
    }>(response);

    return {
      transferCode: payload.data.transfer_code,
      transferId: payload.data.id != null ? String(payload.data.id) : null,
    };
  }

  async fetchTransfer(reference: string): Promise<PaystackFetchTransferResponse> {
    const url = new URL(`${this.baseUrl}/transfer/verify/${encodeURIComponent(reference)}`);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.headers,
    });

    const payload = await this.parseJson<{
      status: boolean;
      message: string;
      data: {
        reference: string;
        transfer_code?: string | null;
        status: string;
      };
    }>(response);

    return {
      reference: payload.data.reference,
      transferCode: payload.data.transfer_code ?? null,
      status: payload.data.status,
      raw: payload,
    };
  }
}