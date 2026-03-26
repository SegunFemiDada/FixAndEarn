//path: apps/api/src/modules/jobs/jobs.module.ts
import { Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { JobsRepo } from "./jobs.repo";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { WalletModule } from "../wallet/wallet.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { LocalStorageProvider } from "../../common/storage/local-storage.provider";

@Module({
  imports: [WalletModule, NotificationsModule],
  controllers: [JobsController],
  providers: [
    JobsService,
    JobsRepo,
    PrismaService,
    LocalStorageProvider,
  ],
  exports: [JobsService, JobsRepo],
})
export class JobsModule {}