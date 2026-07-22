// Path: apps/api/src/modules/disputes/disputes.module.ts
import { forwardRef, Module } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { StorageModule } from "../../common/storage/storage.module";
import { LedgerService } from "../wallet/ledger.service";
import { WalletService } from "../wallet/wallet.service";
import { NotificationsService } from "../notifications/notifications.service";
import { DisputesController } from "./disputes.controller";
import { DisputesService } from "./disputes.service";
import { JobCompletionModule } from "../job-completion/job-completion.module";

@Module({
  imports: [StorageModule, forwardRef(() => JobCompletionModule),],
  controllers: [DisputesController,],
  providers: [
    PrismaService,
    WalletService,
    LedgerService,
    NotificationsService,
    DisputesService,
  ],
  exports: [DisputesService],
})
export class DisputesModule {}