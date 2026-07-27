// Path: apps/web/src/lib/admin/sidebar-notifications/queries.ts

"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminSidebarNotifications } from "./api";
import type { AdminSidebarNotifications } from "./types";

export const adminSidebarNotificationKeys = {
  all: ["admin", "sidebar-notifications"] as const,
};

export function useAdminSidebarNotifications(enabled = true) {
  return useQuery<AdminSidebarNotifications, Error>({
    queryKey: adminSidebarNotificationKeys.all,
    queryFn: getAdminSidebarNotifications,
    enabled,
    refetchInterval: 30000,
    staleTime: 15000,
    retry: false,
  });
}