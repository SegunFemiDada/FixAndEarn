import { adminApi } from "@/lib/admin/api";
import type {
  SendAdminNotificationPayload,
  SendAdminNotificationResponse,
} from "@/lib/admin/notifications/types";

export async function sendAdminNotification(
  payload: SendAdminNotificationPayload
): Promise<SendAdminNotificationResponse> {
  const response = await adminApi.post<SendAdminNotificationResponse>(
    "/admin/notifications/send",
    payload
  );

  return response.data;
}