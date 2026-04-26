import { adminApi } from "@/lib/admin/api";
import type {
  AdminSettingsOverviewResponse,
  UpdateAdminSettingsPayload,
  UpdateAdminSettingsResponse,
} from "@/lib/admin/settings/types";

export async function getAdminSettingsOverview(): Promise<AdminSettingsOverviewResponse> {
  const response = await adminApi.get<AdminSettingsOverviewResponse>("/admin/settings/overview");
  return response.data;
}

export async function updateAdminSettingsOverview(
  payload: UpdateAdminSettingsPayload
): Promise<UpdateAdminSettingsResponse> {
  const response = await adminApi.post<UpdateAdminSettingsResponse>(
    "/admin/settings/overview",
    payload
  );

  return response.data;
}