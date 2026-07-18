import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
} from "@nestjs/common";
import { PaymentsService } from "../payments.service";
import { MonnifyHttpProvider } from "../monnify/monnify.http.provider";

@Controller("payments/monnify")
export class MonnifyWebhookController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly monnify: MonnifyHttpProvider,
  ) {}

  @Post("webhook")
  @HttpCode(200)
  async webhook(
    @Headers("monnify-signature")
    signature: string | undefined,

    @Body()
    payload: any,
  ) {
    if (
      !this.monnify.verifyWebhookSignature(
        Buffer.from(JSON.stringify(payload)),
        signature,
      )
    ) {
      return {
        received: false,
        reason: "INVALID_SIGNATURE",
      };
    }

    const eventType = payload?.eventType;

    if (eventType !== "SUCCESSFUL_TRANSACTION") {
      return {
        received: true,
        ignored: true,
      };
    }

    await this.paymentsService.handleWebhook(
      Buffer.from(JSON.stringify(payload)),
      signature,
    );

    return {
      received: true,
    };
  }
}