// Path: apps/api/src/modules/payments/payments.module.ts
import { Module, forwardRef } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { AdminModule } from "../../admin/admin.module";
import { WalletModule } from "../wallet/wallet.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { ReconciliationService } from "./reconciliation.service";
import { PAYMENT_PROVIDER } from "./payments.constants";
import { MonnifyHttpProvider } from "./monnify/monnify.http.provider";
import { MonnifyWebhookController } from "./monnify/monnify.webhook.controller";
import { JobPaymentsModule } from "../job-payments/job-payments.module";
@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    ScheduleModule,
    forwardRef(() => AdminModule),
    forwardRef(() => WalletModule),
    JobPaymentsModule,
  ],

  controllers: [
    PaymentsController,
    MonnifyWebhookController,
  ],

  providers: [
    PaymentsService,
    ReconciliationService,
    {
      provide: PAYMENT_PROVIDER,
      useClass: MonnifyHttpProvider,
    },
  ],

  exports: [
    PAYMENT_PROVIDER,
    PaymentsService,
  ],
})
export class PaymentsModule {}