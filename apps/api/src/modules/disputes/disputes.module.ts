import { Module } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { LedgerService } from "../wallet/ledger.service";
import { WalletService } from "../wallet/wallet.service";
import { NotificationsService } from "../notifications/notifications.service";
import { DisputesController } from "./disputes.controller";
import { DisputesService } from "./disputes.service";

@Module({
  controllers: [DisputesController],
  providers: [PrismaService, WalletService, LedgerService, NotificationsService, DisputesService],
  exports: [DisputesService]
})
export class DisputesModule {}