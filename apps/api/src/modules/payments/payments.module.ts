// Path: apps/api/src/modules/payments/payments.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { WalletModule } from "../wallet/wallet.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PAYSTACK_PROVIDER } from "./payments.constants";
import { PaystackHttpProvider } from "./paystack/paystack.http.provider";
import { ReconciliationService } from "./reconciliation.service";
import { ScheduleModule } from "@nestjs/schedule";
import { PaystackWebhookController } from "./paystack/paystack.webhook.controller";
import { AdminModule } from "../../admin/admin.module";

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    ScheduleModule,
    forwardRef(() => AdminModule),
    forwardRef(() => WalletModule),
  ],
  controllers: [PaymentsController, PaystackWebhookController], // ✅ removed AdminFinanceService
  providers: [
    PaymentsService,
    ReconciliationService,
    {
      provide: PAYSTACK_PROVIDER,
      useClass: PaystackHttpProvider,
    },
  ],
  exports: [PAYSTACK_PROVIDER, PaymentsService], // ✅ added PaymentsService
})
export class PaymentsModule {}
