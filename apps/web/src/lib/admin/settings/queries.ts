"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminSettingsOverview,
  updateAdminSettingsOverview,
} from "@/lib/admin/settings/api";
import type {
  AdminSettingsOverviewResponse,
  UpdateAdminSettingsPayload,
  UpdateAdminSettingsResponse,
} from "@/lib/admin/settings/types";

export const adminSettingsQueryKeys = {
  all: ["admin", "settings"] as const,
  overview: ["admin", "settings", "overview"] as const,
};

export function useAdminSettingsOverview(enabled = true) {
  return useQuery<AdminSettingsOverviewResponse, Error>({
    queryKey: adminSettingsQueryKeys.overview,
    queryFn: getAdminSettingsOverview,
    enabled,
    retry: false,
  });
}

export function useUpdateAdminSettingsOverview() {
  const queryClient = useQueryClient();

  return useMutation<UpdateAdminSettingsResponse, Error, UpdateAdminSettingsPayload>({
    mutationFn: updateAdminSettingsOverview,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminSettingsQueryKeys.all });
    },
  });
}