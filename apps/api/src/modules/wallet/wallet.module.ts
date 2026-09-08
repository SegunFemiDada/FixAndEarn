//path: apps/api/src/modules/wallet/wallet.module.ts
import { Module, } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { LedgerService } from "./ledger.service";
import { WalletController } from "./wallet.controller";
import { CryptoService } from "../../common/crypto/crypto.service";
import { AuthModule } from "../auth/auth.module";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { PlatformWalletService } from "./platform-wallet.service";
import { EarningsModule } from "../earnings/earnings.module";

@Module({
  imports: [ AuthModule, NotificationsModule, EarningsModule],
  providers: [
    WalletService,
    LedgerService,
    CryptoService,
    PrismaService,
    PlatformWalletService,
  ],
  exports: [
    WalletService,
    LedgerService,
    PlatformWalletService,
  ],
  controllers: [WalletController],
})
export class WalletModule {}