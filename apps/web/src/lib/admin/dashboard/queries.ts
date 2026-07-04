//path: apps/web/src/lib/admin/dashboard/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import adminApi from "@/lib/admin/api";

export type AdminDashboardResponse = {
  users: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  };

  verification: {
    approved: number;
    pending: number;
    rejected: number;
  };

  jobs: {
    open: number;
    inProgress: number;
    disputed: number;
    completed: number;
    cancelled: number;
  };

  deposits: {
    pending: number;
    succeeded: number;
    failed: number;
  };

  withdrawals: {
    pending: number;
    processing: number;
    paid: number;
    rejected: number;
    failed: number;
  };

  reports: {
    pending: number;
    resolved: number;
    dismissed: number;
  };

  disputes: {
    open: number;
    resolved: number;
  };

  admins: {
    activeAdmins: number;
    lockedAdmins: number;
    activeSessions: number;
  };

  recentActivity: Array<{
    id: string;
    action: string;
    description: string;
    createdAt: string;
    actor: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    };
  }>;

  system: {
    healthy: boolean;
    generatedAt: string;
  };
};

export const adminDashboardKeys = {
  dashboard: ["admin", "dashboard"] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKeys.dashboard,
    queryFn: async () => {
      const { data } =
        await adminApi.get<AdminDashboardResponse>(
          "/admin/dashboard",
        );

      return data;
    },

    staleTime: 30_000,

    refetchInterval: 60_000,
  });
}