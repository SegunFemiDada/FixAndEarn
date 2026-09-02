//path: apps/api/src/modules/payments/monnify/monnify.webhook.controller.ts

import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Post,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import { PaymentsService } from "../payments.service";
import { PAYMENT_PROVIDER } from "../payments.constants";
import type { PaymentProvider } from "../payment.provider";

type RawBodyRequest = Request & {
  rawBody?: Buffer;
};

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
    signature: string | undefined,

    @Req()
    req: RawBodyRequest,

    @Body()
    payload: any,
  ) {
    const rawBody = req.rawBody;

    if (!rawBody) {
      return {
        received: false,
        reason: "RAW_BODY_UNAVAILABLE",
      };
    }

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