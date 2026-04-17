//path: apps/api/src/modules/payments/payments.controller.ts
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Req,
  Headers,
  Logger,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly payments: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("initialize")
  async initialize(
    @CurrentUser() user: { userId: string },
    @Body() dto: { amountMilliFec: number }
  ) {
    return this.payments.initializeDeposit(user.userId, dto.amountMilliFec);
  }

  @Post("webhook")
  async webhook(
    @Req() req: any,
    @Headers("x-paystack-signature") signature?: string
  ) {
    this.logger.log(`Received Paystack webhook. Signature present: ${Boolean(signature)}`);
    return this.payments.handleWebhook(req.rawBody, signature);
  }
}