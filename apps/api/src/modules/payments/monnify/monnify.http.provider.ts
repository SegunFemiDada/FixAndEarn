//path: apps/api/src/modules/payments/monnify/monnify.http.provider.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  PaymentProvider,
  InitializePaymentRequest,
  InitializePaymentResponse,
  ResolveAccountResponse,
  InitiateTransferRequest,
  InitiateTransferResponse,
  FetchTransferResponse,
} from "../payment.provider";

@Injectable()
export class MonnifyHttpProvider implements PaymentProvider  {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly contractCode: string;
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  private accessToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config
      .get<string>("MONNIFY_API_KEY", "")
      .trim();

    this.secretKey = this.config
      .get<string>("MONNIFY_SECRET_KEY", "")
      .trim();

    this.contractCode = this.config
      .get<string>("MONNIFY_CONTRACT_CODE", "")
      .trim();

    this.baseUrl = this.config
      .get<string>(
        "MONNIFY_BASE_URL",
        "https://sandbox.monnify.com",
      )
      .trim()
      .replace(/\/+$/, "");

    this.webhookSecret = this.config
      .get<string>("MONNIFY_WEBHOOK_SECRET", "")
      .trim();

    if (!this.apiKey) {
      throw new Error("MONNIFY_API_KEY is required");
    }

    if (!this.secretKey) {
      throw new Error("MONNIFY_SECRET_KEY is required");
    }

    if (!this.contractCode) {
      throw new Error("MONNIFY_CONTRACT_CODE is required");
    }
  }

  private async authenticate(): Promise<string> {
    if (
      this.accessToken &&
      Date.now() < this.tokenExpiresAt
    ) {
      return this.accessToken;
    }

    const credentials = Buffer.from(
      `${this.apiKey}:${this.secretKey}`,
    ).toString("base64");

    const response = await fetch(
      `${this.baseUrl}/api/v1/auth/login`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      },
    );

    const payload = await response.json();

if (
  !response.ok ||
  !payload.requestSuccessful
) {
  throw new Error(
    payload?.responseMessage ??
      "MONNIFY_AUTH_FAILED",
  );
}

    this.accessToken =
      payload.responseBody.accessToken;

    const expires =
      Number(
        payload.responseBody.expiresIn ?? 3500,
      ) * 1000;

    this.tokenExpiresAt =
      Date.now() + expires - 60000;

    return this.accessToken!;
  }

  private async headers() {
    return {
      Authorization: `Bearer ${await this.authenticate()}`,
      "Content-Type": "application/json",
    };
  }

  verifyWebhookSignature(
  rawBody: Buffer,
  signature?: string,
): boolean {
  /**
   * Monnify sandbox does not sign webhook
   * payloads the same way Paystack does.
   *
   * Until production webhook verification
   * is enabled, accept the request.
   */

  void rawBody;
  void signature;

  return true;
}

  async initializeTransaction(
    req: InitializePaymentRequest,
  ): Promise<InitializePaymentResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/merchant/transactions/init-transaction`,
      {
        method: "POST",
        headers: await this.headers(),
        body: JSON.stringify({
          amount: req.amountKobo / 100,
          customerName:
            req.metadata?.customerName ??
            req.email,
          customerEmail: req.email,
          paymentReference: req.reference,
          paymentDescription:
            req.metadata?.description ??
            "FixAndEarn Payment",
          currencyCode: "NGN",
          contractCode: this.contractCode,
          redirectUrl:
          req.metadata?.redirectUrl ??
          `${process.env.FRONTEND_URL}/payment/return`,
          paymentMethods: [
            "CARD",
            "ACCOUNT_TRANSFER",
            "USSD",
          ],
          metadata: req.metadata ?? {},
        }),
      },
    );

    const payload = await response.json();

if (
  !response.ok ||
  !payload.requestSuccessful
) {
  throw new Error(
    payload?.responseMessage ??
      "MONNIFY_INITIALIZE_FAILED",
  );
}

    return {
      authorizationUrl:
        payload.responseBody.checkoutUrl,
      reference:
        payload.responseBody.paymentReference,
    };
  }

  async resolveAccountNumber(
    accountNumber: string,
    bankCode: string,
  ): Promise<ResolveAccountResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/v1/disbursements/account/validate?accountNumber=${accountNumber}&bankCode=${bankCode}`,
      {
        method: "GET",
        headers: await this.headers(),
      },
    );

    const payload = await response.json();

    if (
      !response.ok ||
      !payload.requestSuccessful
    ) {
      throw new Error(
        payload.responseMessage ??
          "ACCOUNT_VALIDATION_FAILED",
      );
    }

    return {
      accountName:
        payload.responseBody.accountName,
      accountNumber,
    };
  }

  async initiateTransfer(
  req: InitiateTransferRequest,
): Promise<InitiateTransferResponse> {
  const response = await fetch(
    `${this.baseUrl}/api/v2/disbursements/single`,
    {
      method: "POST",
      headers: await this.headers(),
      body: JSON.stringify({
        amount: req.amountKobo / 100,
        reference: req.reference,
        narration:
          req.reason ??
          "FixAndEarn Withdrawal",
        destinationBankCode:
          req.bankCode,
        destinationAccountNumber:
          req.accountNumber,
        destinationAccountName:
          req.accountName,
        currency: "NGN",
      }),
    },
  );

  const payload = await response.json();

  if (
    !response.ok ||
    !payload.requestSuccessful
  ) {
    throw new Error(
      payload.responseMessage ??
        "MONNIFY_TRANSFER_FAILED",
    );
  }

  return {
    transferCode:
      payload.responseBody.reference,
    transferId:
      payload.responseBody
        .transactionReference ?? null,
  };
}

  async transfer(args: {
  amount: number;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  reference: string;
  reason?: string;
}) {
  return this.initiateTransfer({
    amountKobo: args.amount,
    accountNumber: args.accountNumber,
    bankCode: args.bankCode,
    accountName: args.accountName,
    reference: args.reference,
    reason: args.reason,
  });
}

  async fetchTransfer(
    reference: string,
  ): Promise<FetchTransferResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/v2/disbursements/${reference}`,
      {
        method: "GET",
        headers: await this.headers(),
      },
    );

    const payload = await response.json();

    if (
      !response.ok ||
      !payload.requestSuccessful
    ) {
      throw new Error(
        payload.responseMessage ??
          "MONNIFY_TRANSFER_LOOKUP_FAILED",
      );
    }

    return {
      reference,
      transferCode: reference,
      status:
        payload.responseBody.status,
      raw: payload,
    };
  }
}