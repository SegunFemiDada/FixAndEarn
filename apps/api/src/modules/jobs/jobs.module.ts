//path: apps/api/src/modules/jobs/jobs.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { JobsRepo } from "./jobs.repo";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { WalletModule } from "../wallet/wallet.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { StorageModule } from "../../common/storage/storage.module";
import { JobPaymentsModule } from "../job-payments/job-payments.module";
import { JobCompletionModule } from "../job-completion/job-completion.module";
@Module({
  imports: [
  WalletModule,
  NotificationsModule,
  StorageModule,
  forwardRef(() => JobPaymentsModule),
  forwardRef(() => JobCompletionModule),
],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobsRepo,
    PrismaService,
    ],
  exports: [JobsService, JobsRepo],
})
export class JobsModule {}