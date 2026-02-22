// Path: /apps/api/src/modules/jobs/jobs.module.ts
import { Module } from "@nestjs/common";
import { JobsService } from "./jobs.service";
import { JobsRepo } from "./jobs.repo";
import { JobsController } from "./jobs.controller";
import { LedgerService } from "../wallet/ledger.service";
import { WalletService } from "../wallet/wallet.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [JobsController],
  providers: [JobsRepo, JobsService, LedgerService, WalletService]
})
export class JobsModule {}