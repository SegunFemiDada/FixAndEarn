// Path: apps/api/src/admin/analytics/admin-analytics.module.ts
import { Module } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AdminAnalyticsController } from "./admin-analytics.controller";
import { AdminAnalyticsRepo } from "./admin-analytics.repo";
import { AdminAnalyticsService } from "./admin-analytics.service";

@Module({
  controllers: [AdminAnalyticsController],
  providers: [PrismaService, AdminAnalyticsRepo, AdminAnalyticsService],
  exports: [AdminAnalyticsRepo, AdminAnalyticsService],
})
export class AdminAnalyticsModule {}