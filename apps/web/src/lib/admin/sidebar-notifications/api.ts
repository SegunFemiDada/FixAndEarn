// Path: apps/web/src/lib/admin/sidebar-notifications/api.ts

import { adminApi } from "@/lib/admin/api";
import type { AdminSidebarNotifications } from "./types";

export async function getAdminSidebarNotifications(): Promise<AdminSidebarNotifications> {
  const response = await adminApi.get<AdminSidebarNotifications>(
    "/admin/sidebar-notifications"
  );

  return response.data;
}