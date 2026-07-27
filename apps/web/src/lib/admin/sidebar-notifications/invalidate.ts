// lib/admin/sidebar-notifications/invalidate.ts

import { QueryClient } from "@tanstack/react-query";
import { adminSidebarNotificationKeys } from "./queries";

export async function invalidateSidebarNotifications(
  queryClient: QueryClient,
) {
  await queryClient.invalidateQueries({
    queryKey: adminSidebarNotificationKeys.all,
  });
}