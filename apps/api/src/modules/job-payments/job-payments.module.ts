//path: apps/api/src/modules/job-payments/job-payments.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { PaymentsModule } from "../payments/payments.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { JobPaymentsController } from "./job-payments.controller";
import { JobPaymentsService } from "./job-payments.service";
import { JobPaymentProcessorService } from "./job-payment-processor.service";
import { ChatModule } from "../../chat/chat.module";
import { FinalPaymentExpirationService } from "./final-payment-expiration.service";

@Module({
  imports: [
  PrismaModule,
  NotificationsModule,
  forwardRef(() => PaymentsModule),
  forwardRef(() => ChatModule),

],
  controllers: [JobPaymentsController],
  providers: [
  JobPaymentsService,
  JobPaymentProcessorService,
  FinalPaymentExpirationService,
],

exports: [
  JobPaymentsService,
  JobPaymentProcessorService,
],
})
export class JobPaymentsModule {}