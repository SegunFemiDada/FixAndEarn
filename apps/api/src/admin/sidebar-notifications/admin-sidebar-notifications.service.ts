//path: apps/api/src/admin/sidebar-notifications/admin-sidebar-notifications.service.ts
import { Injectable } from "@nestjs/common";
import {
  AdminSidebarNotifications,
  AdminSidebarNotificationsRepo,
} from "./admin-sidebar-notifications.repo";

@Injectable()
export class AdminSidebarNotificationsService {
  constructor(
    private readonly repo: AdminSidebarNotificationsRepo,
  ) {}

  async getOverview(): Promise<AdminSidebarNotifications> {
    return this.repo.getOverview();
  }
}