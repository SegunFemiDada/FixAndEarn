//path: apps/api/src/modules/job-payments/job-payments.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { PaymentsModule } from "../payments/payments.module";
import { JobsModule } from "../jobs/jobs.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { JobPaymentsController } from "./job-payments.controller";
import { JobPaymentsService } from "./job-payments.service";

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    forwardRef(() => PaymentsModule),
    forwardRef(() => JobsModule),
  ],
  controllers: [JobPaymentsController],
  providers: [JobPaymentsService],
  exports: [JobPaymentsService],
})
export class JobPaymentsModule {}