// Path: apps/api/src/admin/sidebar-notifications/admin-sidebar-notifications.module.ts

import { Module } from "@nestjs/common";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AdminSidebarNotificationsController } from "./admin-sidebar-notifications.controller";
import { AdminSidebarNotificationsRepo } from "./admin-sidebar-notifications.repo";
import { AdminSidebarNotificationsService } from "./admin-sidebar-notifications.service";

@Module({
  controllers: [AdminSidebarNotificationsController],
  providers: [
    PrismaService,
    AdminSidebarNotificationsRepo,
    AdminSidebarNotificationsService,
  ],
  exports: [
    AdminSidebarNotificationsRepo,
    AdminSidebarNotificationsService,
  ],
})
export class AdminSidebarNotificationsModule {}