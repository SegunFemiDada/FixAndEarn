import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Post,
} from "@nestjs/common";
import { PaymentsService } from "../payments.service";
import { PAYMENT_PROVIDER } from "../payments.constants";
import type { PaymentProvider } from "../payment.provider";

@Controller("payments/monnify")
export class MonnifyWebhookController {
  constructor(
    private readonly paymentsService: PaymentsService,

    @Inject(PAYMENT_PROVIDER)
    private readonly paymentProvider: PaymentProvider,
  ) {}

  @Post("webhook")
  @HttpCode(200)
  async webhook(
    @Headers("monnify-signature")
    signature: string |undefined,

    @Body()
    payload: any,
  ) {
    const rawBody = Buffer.from(
      JSON.stringify(payload),
    );

    if (
      !this.paymentProvider.verifyWebhookSignature(
        rawBody,
        signature,
      )
    ) {
      return {
        received: false,
        reason: "INVALID_SIGNATURE",
      };
    }

    const eventType = payload?.eventType;

    if (
      eventType !==
      "SUCCESSFUL_TRANSACTION"
    ) {
      return {
        received: true,
        ignored: true,
      };
    }

    await this.paymentsService.handleWebhook(
      rawBody,
      signature,
    );

    return {
      received: true,
    };
  }
}