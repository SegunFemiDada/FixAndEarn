import { adminApi } from "@/lib/admin/api";
import type {
  AdminSecurityInvestigationResponse,
  AdminSecurityOverviewResponse,
  GetAdminSecurityOverviewParams,
} from "@/lib/admin/security/types";

export async function getAdminSecurityOverview(
  params: GetAdminSecurityOverviewParams = {}
): Promise<AdminSecurityOverviewResponse> {
  const response = await adminApi.get<AdminSecurityOverviewResponse>(
    "/admin/security/overview",
    {
      params: {
        take: params.take,
      },
    }
  );

  return response.data;
}

export async function getAdminSecurityInvestigation(
  id: string
): Promise<AdminSecurityInvestigationResponse> {
  const response = await adminApi.get<AdminSecurityInvestigationResponse>(
    `/admin/security/${id}/investigation`
  );

  return response.data;
}
