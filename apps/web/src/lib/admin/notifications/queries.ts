"use client";

import { useMutation } from "@tanstack/react-query";
import { sendAdminNotification } from "@/lib/admin/notifications/api";
import type {
  SendAdminNotificationPayload,
  SendAdminNotificationResponse,
} from "@/lib/admin/notifications/types";

export function useAdminSendNotification() {
  return useMutation<SendAdminNotificationResponse, Error, SendAdminNotificationPayload>({
    mutationFn: (payload) => sendAdminNotification(payload),
  });
}