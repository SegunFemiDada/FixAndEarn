import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listNotifications, markNotificationRead } from "./api";
import type { NotificationRow } from "./api";
import type { Role } from "@/lib/auth/session";

const keys = {
  list: (params?: { skip?: number; take?: number; unreadOnly?: boolean }) =>
    ["notifications", "list", params ?? {}] as const,
  unreadCount: (role?: Role | null) => ["notifications", "unreadCount", role ?? "ALL"] as const,
};

export function isNotificationVisibleForRole(
  notification: Pick<NotificationRow, "type">,
  role?: Role | null
): boolean {
  const type = String(notification.type ?? "").toUpperCase();

  if (type === "SYSTEM_ANNOUNCEMENT") {
    return true;
  }

  if (!role) return true;

  if (role === "CLIENT") {
    return [
      "JOB_APPLIED",
      "JOB_COMPLETION_REQUESTED",
      "ESCROW_LOCKED",
      "JOB_ESCROW_LOCKED",
      "DEPOSIT_SUCCEEDED",
      "DISPUTE_OPENED",
      "DISPUTE_RESOLVED",
    ].includes(type);
  }

  if (role === "FIXER") {
    return [
      "JOB_COMPLETION_APPROVED",
      "JOB_COMPLETION_REJECTED",
      "WITHDRAWAL_REQUESTED",
      "WITHDRAWAL_APPROVED",
      "WITHDRAWAL_REJECTED",
      "WITHDRAWAL_PAID",
      "DISPUTE_OPENED",
      "DISPUTE_RESOLVED",
    ].includes(type);
  }

  return true;
}

export function useNotificationsList(params?: { skip?: number; take?: number; unreadOnly?: boolean }) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => listNotifications(params),
    staleTime: 10_000,
    retry: 1,
  });
}

export function useNotificationsUnreadCount(role?: Role | null) {
  return useQuery({
    queryKey: keys.unreadCount(role),
    queryFn: async () => {
      const res = await listNotifications({ skip: 0, take: 200, unreadOnly: true });
      const filtered = (res.notifications ?? []).filter((n) => isNotificationVisibleForRole(n, role));
      return filtered.length;
    },
    staleTime: 5_000,
    retry: 1,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Role-aware "mark all read" on the frontend.
 *
 * IMPORTANT:
 * - Backend /notifications/read-all marks everything for the user.
 * - For role-separated UI, that is wrong because CLIENT mode should not silently
 *   mark FIXER notifications as read, and vice versa.
 * - So this hook marks only the currently visible unread notifications one by one.
 */
export function useMarkAllNotificationsRead(role?: Role | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notifications: NotificationRow[] = []) => {
      const visibleUnread = notifications.filter(
        (n) => !n.readAt && isNotificationVisibleForRole(n, role)
      );

      if (visibleUnread.length === 0) {
        return { ok: true, count: 0 };
      }

      await Promise.all(visibleUnread.map((n) => markNotificationRead(n.id)));

      return { ok: true, count: visibleUnread.length };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}