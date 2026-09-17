import { Module } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { LedgerService } from "./ledger.service";
import { WalletController } from "./wallet.controller";
import { CryptoService } from "../../common/crypto/crypto.service";
import { AuthModule } from "../auth/auth.module";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { PlatformWalletService } from "./platform-wallet.service";
import { EarningsModule } from "../earnings/earnings.module";
import { PlatformConfigModule } from "../../common/platform-config/platform-config.module";

@Module({
  imports: [
    AuthModule,
    NotificationsModule,
    EarningsModule,
    PlatformConfigModule,
  ],
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
