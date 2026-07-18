//path: apps/api/src/modules/payments/payments.controller.ts

import {
  Body,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { PaymentsService } from "./payments.service";

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post("initialize")
  async initialize(
    @CurrentUser()
    user: {
      userId: string;
    },
    @Body()
    dto: {
      amountMilliFec: number;
    },
  ) {
    return this.payments.initializeDeposit(
      user.userId,
      dto.amountMilliFec,
    );
  }
}