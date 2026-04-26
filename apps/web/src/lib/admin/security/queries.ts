"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminSecurityOverview } from "@/lib/admin/security/api";
import type {
  AdminSecurityOverviewResponse,
  GetAdminSecurityOverviewParams,
} from "@/lib/admin/security/types";

export const adminSecurityQueryKeys = {
  all: ["admin", "security"] as const,
  overview: (params: GetAdminSecurityOverviewParams) =>
    [...adminSecurityQueryKeys.all, "overview", params.take ?? 50] as const,
};

export function useAdminSecurityOverview(
  params: GetAdminSecurityOverviewParams,
  enabled = true
) {
  return useQuery<AdminSecurityOverviewResponse, Error>({
    queryKey: adminSecurityQueryKeys.overview(params),
    queryFn: () => getAdminSecurityOverview(params),
    enabled,
    retry: false,
  });
}