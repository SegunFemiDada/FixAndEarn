"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { bootstrapSuperAdmin, getBootstrapStatus } from "@/lib/admin/setup/api";
import type {
  AdminBootstrapPayload,
  AdminBootstrapResponse,
  AdminBootstrapStatusResponse,
} from "@/lib/admin/setup/types";

export const adminSetupQueryKeys = {
  bootstrapStatus: ["admin", "bootstrap", "status"] as const,
};

export function useBootstrapStatus(enabled = true) {
  return useQuery<AdminBootstrapStatusResponse, Error>({
    queryKey: adminSetupQueryKeys.bootstrapStatus,
    queryFn: getBootstrapStatus,
    enabled,
    retry: false,
  });
}

export function useBootstrapSuperAdmin() {
  return useMutation<AdminBootstrapResponse, Error, AdminBootstrapPayload>({
    mutationFn: bootstrapSuperAdmin,
  });
}