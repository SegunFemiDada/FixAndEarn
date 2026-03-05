// Path: /apps/api/src/app.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { HealthModule } from "./modules/health/health.module";
import { UsersModule } from "./modules/users/users.module";
import { AuthModule } from "./modules/auth/auth.module";
import { AccountModule } from "./modules/account/account.module";
import { VerificationModule } from "./modules/verification/verification.module";
import { WalletModule } from "./modules/wallet/wallet.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { RolesGuard } from "./common/auth/roles.guard";
import { JobsModule } from "./modules/jobs/jobs.module";
import { AdminModule } from "./admin/admin.module";
import { JobCompletionModule } from "./modules/job-completion/job-completion.module";
import { ChatModule } from "./chat/chat.module";
import { FixersModule } from "./modules/fixers/fixers.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DisputesModule } from "./modules/disputes/disputes.module";
import { RatingsModule } from "./modules/ratings/ratings.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local", "../../.env", "../../.env.local"]
    }),
    PrismaModule,
    HealthModule,
    UsersModule,
    AuthModule,
    AccountModule,
    VerificationModule,
    PaymentsModule,
    WalletModule,
    JobsModule,
    AdminModule,
    JobCompletionModule,
    ChatModule,
    FixersModule,
    NotificationsModule,
    DisputesModule,
    ProfilesModule,
    RatingsModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
