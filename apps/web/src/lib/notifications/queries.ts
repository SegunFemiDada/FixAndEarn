import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./api";
import type { NotificationRow } from "./api";
import type { Role } from "@/lib/auth/session";

const keys = {
  list: (params?: { skip?: number; take?: number; unreadOnly?: boolean }) =>
    ["notifications", "list", params ?? {}] as const,
  unreadCount: (role?: Role | null) =>
    ["notifications", "unreadCount", role ?? "ALL"] as const,
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

export function useNotificationsList(params?: {
  skip?: number;
  take?: number;
  unreadOnly?: boolean;
}) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => listNotifications(params),
    staleTime: 10_000,
    refetchInterval: 10_000,
    retry: 1,
  });
}

export function useNotificationsUnreadCount(role?: Role | null) {
  return useQuery({
    queryKey: keys.unreadCount(role),
    queryFn: async () => {
      const res = await listNotifications({
        skip: 0,
        take: 200,
        unreadOnly: true,
      });

      const filtered = (res.notifications ?? []).filter((n) =>
        isNotificationVisibleForRole(n, role)
      );

      return filtered.length;
    },
    staleTime: 5_000,
    refetchInterval: 10_000,
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
 * Marks all notifications for the current user as read.
 *
 * The backend owns this operation and marks every unread notification
 * belonging to the authenticated user.
 *
 * IMPORTANT:
 * The frontend does not attempt to calculate or decide which
 * notifications the backend should mark. It simply calls the
 * existing backend endpoint.
 */
export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
export function useNotificationsInfiniteList(params?: {
  take?: number;
  unreadOnly?: boolean;
}) {
  const take = params?.take ?? 50;
  const unreadOnly = params?.unreadOnly ?? false;

  return useInfiniteQuery({
    queryKey: ["notifications", "infinite", { take, unreadOnly }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listNotifications({
        skip: pageParam,
        take,
        unreadOnly,
      }),
    getNextPageParam: (lastPage) => {
      const nextSkip = lastPage.skip + lastPage.notifications.length;

      if (nextSkip >= lastPage.total) {
        return undefined;
      }

      return nextSkip;
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
    retry: 1,
  });
}