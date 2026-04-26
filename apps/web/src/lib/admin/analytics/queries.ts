// Path: apps/web/src/lib/admin/analytics/queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminAnalyticsOverview } from "@/lib/admin/analytics/api";
import type {
  AdminAnalyticsOverviewResponse,
  GetAdminAnalyticsOverviewParams,
} from "@/lib/admin/analytics/types";

export const adminAnalyticsQueryKeys = {
  all: ["admin", "analytics"] as const,
  overview: (params: GetAdminAnalyticsOverviewParams) =>
    [
      ...adminAnalyticsQueryKeys.all,
      "overview",
      params.range ?? "week",
      params.anchor ?? "",
    ] as const,
};

export function useAdminAnalyticsOverview(
  params: GetAdminAnalyticsOverviewParams,
  enabled = true
) {
  return useQuery<AdminAnalyticsOverviewResponse, Error>({
    queryKey: adminAnalyticsQueryKeys.overview(params),
    queryFn: () => getAdminAnalyticsOverview(params),
    enabled,
    retry: false,
  });
}