//path: apps/api/src/modules/job-payments/job-payments.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { JobPaymentsService } from "./job-payments.service";


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
    @Req() req: any,
  ) {
    return this.jobPaymentsService.createFinalPayment({
      jobId,
      conversationId,
      clientId: req.user.sub,
    });
  }
}