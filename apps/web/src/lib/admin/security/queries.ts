"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminSecurityInvestigation,
  getAdminSecurityOverview,
} from "@/lib/admin/security/api";
import type {
  AdminSecurityInvestigationResponse,
  AdminSecurityOverviewResponse,
  GetAdminSecurityOverviewParams,
} from "@/lib/admin/security/types";

export const adminSecurityQueryKeys = {
  all: ["admin", "security"] as const,
  overview: (params: GetAdminSecurityOverviewParams) =>
    [...adminSecurityQueryKeys.all, "overview", params.take ?? 50] as const,
  investigation: (id: string) =>
    [...adminSecurityQueryKeys.all, "investigation", id] as const,
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

export function useAdminSecurityInvestigation(
  id: string,
  enabled = true
) {
  return useQuery<AdminSecurityInvestigationResponse, Error>({
    queryKey: adminSecurityQueryKeys.investigation(id),
    queryFn: () => getAdminSecurityInvestigation(id),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}
