// path: apps/api/src/modules/payments/paystack/paystack.webhook.controller.ts
import {
  Body,
  Controller,
  Headers,
  Post,
  BadRequestException,
} from "@nestjs/common";
import * as crypto from "crypto";
import { PaymentsService } from "../payments.service";

@Controller("payments/paystack")
export class PaystackWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("webhook")
  async handleWebhook(
    @Body() body: any,
    @Headers("x-paystack-signature") signature: string
  ) {
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {
      throw new BadRequestException("PAYSTACK_SECRET_NOT_CONFIGURED");
    }

    // ✅ Verify Paystack signature
    const hash = crypto
      .createHmac("sha512", secret)
      .update(JSON.stringify(body))
      .digest("hex");

    if (hash !== signature) {
      throw new BadRequestException("INVALID_SIGNATURE");
    }

    const event = body?.event;
    const data = body?.data;

    // ✅ Handle transfer success properly
    if (event === "transfer.success") {
      const reference = data?.reference;

      if (!reference) {
        return { received: true };
      }

      // 🔥 This is the real fix
      await this.paymentsService.handlePaystackTransferSuccess(reference);
    }

    return { received: true };
  }
}