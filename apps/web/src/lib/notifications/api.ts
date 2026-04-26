// Path: apps/web/src/lib/notifications/api.ts
import apiClient from "@/lib/apiClient";

export type NotificationRow = {
  id: string;
  userId: string;

  type: string;
  title: string;
  body: string;

  data?: any;

  createdAt?: string | null;
  readAt?: string | null;
};

export type NotificationsListResponse = {
  total: number;
  take: number;
  skip: number;
  unreadOnly: boolean;
  notifications: NotificationRow[];
};

const BASE = "/notifications";

export async function listNotifications(params?: {
  skip?: number;
  take?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsListResponse> {
  const res = await apiClient.get(BASE, { params });
  return res.data;
}

export async function markNotificationRead(id: string): Promise<{ ok: true }> {
  const res = await apiClient.post(`${BASE}/${id}/read`);
  return res.data;
}

export async function markAllNotificationsRead(): Promise<{ ok: true }> {
  const res = await apiClient.post(`${BASE}/read-all`);
  return res.data;
}