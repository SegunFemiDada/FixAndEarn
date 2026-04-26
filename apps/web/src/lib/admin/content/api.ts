//path: apps/web/src/lib/admin/content/api.ts
import { adminApi } from "@/lib/admin/api";
import type {
  AdminContentOverviewResponse,
  UpdateAdminContentPayload,
  UpdateAdminContentResponse,
} from "@/lib/admin/content/types";

export async function getAdminContentOverview(): Promise<AdminContentOverviewResponse> {
  const response = await adminApi.get<AdminContentOverviewResponse>("/admin/content/overview");
  return response.data;
}

export async function updateAdminContentOverview(
  payload: UpdateAdminContentPayload
): Promise<UpdateAdminContentResponse> {
  const response = await adminApi.post<UpdateAdminContentResponse>(
    "/admin/content/overview",
    payload
  );

  return response.data;
}