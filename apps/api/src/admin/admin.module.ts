import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { PrismaModule } from "../infra/prisma/prisma.module";
import { CryptoService } from "../common/crypto/crypto.service";
import { AdminRepo } from "./admin.repo";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { AdminJwtStrategy } from "./auth/admin-jwt.strategy";
import { AdminAuditService } from "./audit/admin-audit.service";
import { AdminVerificationController } from "./verification/admin-verification.controller";
import { AdminVerificationService } from "./verification/admin-verification.service";
import { AdminVerificationRepo } from "./verification/admin-verification.repo";
import { AdminFinanceController } from "./finance/admin-finance.controller";
import { AdminFinanceService } from "./finance/admin-finance.service";
import { AdminFinanceRepo } from "./finance/admin-finance.repo";
import { AdminUsersController } from "./users/admin-users.controller";
import { AdminUsersService } from "./users/admin-users.service";
import { AdminUsersRepo } from "./users/admin-users.repo";
import { AdminExportsController } from "./exports/admin-exports.controller";
import { AdminExportsService } from "./exports/admin-exports.service";
import { AdminExportsRepo } from "./exports/admin-exports.repo";
import { DisputesModule } from "../modules/disputes/disputes.module";
import { AdminDisputesController } from "../modules/disputes/admin-disputes.controller";
import { NotificationsModule } from "../modules/notifications/notifications.module";

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    DisputesModule,
    NotificationsModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (cfg: ConfigService) => ({
        secret: cfg.get<string>("ADMIN_JWT_SECRET", "dev_admin_secret_change_me"),
        signOptions: { expiresIn: "12h" }
      })
    })
  ],
  controllers: [
    AdminController,
    AdminVerificationController,
    AdminFinanceController,
    AdminUsersController,
    AdminExportsController,
    AdminDisputesController
  ],
  providers: [
    CryptoService,
    AdminRepo,
    AdminService,
    AdminJwtStrategy,
    AdminAuditService,
    AdminVerificationRepo,
    AdminVerificationService,
    AdminFinanceRepo,
    AdminFinanceService,
    AdminUsersRepo,
    AdminUsersService,
    AdminExportsRepo,
    AdminExportsService
  ],
  exports: [AdminService, AdminAuditService]
})
export class AdminModule {}