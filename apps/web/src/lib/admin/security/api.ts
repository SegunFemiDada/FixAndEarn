import { adminApi } from "@/lib/admin/api";
import type {
  AdminSecurityOverviewResponse,
  GetAdminSecurityOverviewParams,
} from "@/lib/admin/security/types";

export async function getAdminSecurityOverview(
  params: GetAdminSecurityOverviewParams = {}
): Promise<AdminSecurityOverviewResponse> {
  const response = await adminApi.get<AdminSecurityOverviewResponse>("/admin/security/overview", {
    params: {
      take: params.take,
    },
  });

  return response.data;
}