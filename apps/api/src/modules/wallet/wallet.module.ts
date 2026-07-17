//path: apps/api/src/modules/wallet/wallet.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { LedgerService } from "./ledger.service";
import { WalletController } from "./wallet.controller";
import { PaymentsModule } from "../payments/payments.module";
import { CryptoService } from "../../common/crypto/crypto.service";
import { AuthModule } from "../auth/auth.module";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { EscrowLockService } from "./escrow-lock.service";
import { WithdrawalReversalService } from "./withdrawal-reversal.service";
import { NotificationsModule } from "../notifications/notifications.module";
import { PlatformWalletService } from "./platform-wallet.service";
import { EarningsModule } from "../earnings/earnings.module";

@Module({
  imports: [forwardRef(() => PaymentsModule), AuthModule, NotificationsModule, EarningsModule],
  providers: [
    WalletService,
    LedgerService,
    CryptoService,
    PrismaService,
    EscrowLockService,
    WithdrawalReversalService,
    PlatformWalletService,
  ],
  exports: [
    WalletService,
    LedgerService,
    WithdrawalReversalService,
    EscrowLockService,
    PlatformWalletService,
  ],
  controllers: [WalletController],
})
export class WalletModule {}