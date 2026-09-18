//path: apps/api/src/modules/job-payments/job-payments.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { CurrentUserPayload } from "../../common/types/current-user";
import { JobPaymentsService } from "./job-payments.service";

@UseGuards(JwtAuthGuard)
@Controller("job-payments")
export class JobPaymentsController {
  constructor(
    private readonly jobPaymentsService: JobPaymentsService,
  ) {}

  @Get(":jobId")
  async getPayments(
    @Param("jobId") jobId: string,
  ) {
    return this.jobPaymentsService.getJobPayments(
      jobId,
    );
  }

  @Post("posting/:jobId")
  async createPostingPayment(
    @Param("jobId") jobId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.jobPaymentsService.createPostingPayment({
      jobId,
      clientId: user.userId!,
    });
  }

  @Post("continue/:jobId")
  async continuePayment(
    @Param("jobId") jobId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.jobPaymentsService.continuePayment({
      jobId,
      clientId: user.userId!,
    });
  }

  @Post("verify")
  async verifyPayment(
    @Body("paymentReference")
    paymentReference: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.jobPaymentsService.verifyPaymentFromReturn({
      paymentReference,
      clientId: user.userId!,
    });
  }

  @Get("status/:jobId")
  async getPaymentStatus(
    @Param("jobId") jobId: string,
  ) {
    return this.jobPaymentsService.getPaymentStatus(
      jobId,
    );
  }

  @Post("final/:jobId")
  async createFinalPayment(
    @Param("jobId") jobId: string,
    @Body("conversationId")
    conversationId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.jobPaymentsService.createFinalPayment({
      jobId,
      conversationId,
      clientId: user.userId!,
    });
  }
}