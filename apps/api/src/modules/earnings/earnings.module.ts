//path: apps/api/src/modules/earnings/earnings.module.ts
import { Module } from "@nestjs/common";
import { PrismaModule } from "../../infra/prisma/prisma.module";
import { EarningsController } from "./earnings.controller";
import { EarningsRepo } from "./earnings.repo";
import { EarningsService } from "./earnings.service";
import { WithdrawalAllocationRepo } from "./withdrawal-allocation.repo";

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [
    EarningsController,
  ],
  providers: [
  EarningsRepo,
  WithdrawalAllocationRepo,
  EarningsService,
],
  exports: [
  EarningsRepo,
  WithdrawalAllocationRepo,
  EarningsService,
],
})
export class EarningsModule {}