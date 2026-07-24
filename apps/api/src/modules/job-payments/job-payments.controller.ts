//path: apps/api/src/modules/job-payments/job-payments.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";
import { JobPaymentsService } from "./job-payments.service";
import { UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { CurrentUserPayload } from "../../common/types/current-user";


function pickUserId(user: any): string {
  const id =
    user?.userId ??
    user?.id ??
    user?.sub ??
    user?.payload?.userId ??
    user?.payload?.id ??
    user?.payload?.sub;

  if (!id) throw new Error("CURRENT_USER_ID_MISSING");

  return id;
}
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
    clientId: pickUserId(user),
  });
}
@Get("status/:jobId")
async getPaymentStatus(
  @Param("jobId") jobId: string,
) {
  return this.jobPaymentsService.getPaymentStatus(jobId);
}

  @Post("final/:jobId")
  async createFinalPayment(
    @Param("jobId") jobId: string,
    @Body("conversationId") conversationId: string,
    @CurrentUser() user: CurrentUserPayload
  ) {
    return this.jobPaymentsService.createFinalPayment({
      jobId,
      conversationId,
      clientId: pickUserId(user),
    });
  }
}