"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminDeletionDependencies } from "@/lib/admin/users/deletion-dependency.api";

export const adminDeletionDependencyQueryKeys = {
  all: ["admin", "users", "deletion-dependencies"] as const,
  detail: (id: string) => [...adminDeletionDependencyQueryKeys.all, id] as const,
};

export function useAdminDeletionDependencies(id: string, enabled = true) {
  return useQuery({
    queryKey: adminDeletionDependencyQueryKeys.detail(id),
    queryFn: () => getAdminDeletionDependencies(id),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}
