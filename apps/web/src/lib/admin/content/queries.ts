//path: apps/web/src/lib/admin/content/queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminContentOverview,
  updateAdminContentOverview,
} from "@/lib/admin/content/api";
import type {
  AdminContentOverviewResponse,
  UpdateAdminContentPayload,
  UpdateAdminContentResponse,
} from "@/lib/admin/content/types";

export const adminContentQueryKeys = {
  all: ["admin", "content"] as const,
  overview: ["admin", "content", "overview"] as const,
};

export function useAdminContentOverview(enabled = true) {
  return useQuery<AdminContentOverviewResponse, Error>({
    queryKey: adminContentQueryKeys.overview,
    queryFn: getAdminContentOverview,
    enabled,
    retry: false,
  });
}

export function useUpdateAdminContentOverview() {
  const queryClient = useQueryClient();

  return useMutation<UpdateAdminContentResponse, Error, UpdateAdminContentPayload>({
    mutationFn: updateAdminContentOverview,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminContentQueryKeys.all });
    },
  });
}