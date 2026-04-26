// Path: apps/web/src/lib/admin/analytics/api.ts
import { adminApi } from "@/lib/admin/api";
import type {
  AdminAnalyticsOverviewResponse,
  GetAdminAnalyticsOverviewParams,
} from "@/lib/admin/analytics/types";

export async function getAdminAnalyticsOverview(
  params: GetAdminAnalyticsOverviewParams = {}
): Promise<AdminAnalyticsOverviewResponse> {
  const response = await adminApi.get<AdminAnalyticsOverviewResponse>(
    "/admin/analytics/overview",
    {
      params: {
        range: params.range,
        anchor: params.anchor,
      },
    }
  );

  return response.data;
}