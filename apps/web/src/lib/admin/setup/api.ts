import { adminApi } from "@/lib/admin/api";
import type {
  AdminBootstrapPayload,
  AdminBootstrapResponse,
  AdminBootstrapStatusResponse,
} from "@/lib/admin/setup/types";

export async function getBootstrapStatus(): Promise<AdminBootstrapStatusResponse> {
  const response = await adminApi.get<AdminBootstrapStatusResponse>("/admin/bootstrap/status");
  return response.data;
}

export async function bootstrapSuperAdmin(
  payload: AdminBootstrapPayload
): Promise<AdminBootstrapResponse> {
  const response = await adminApi.post<AdminBootstrapResponse>(
    "/admin/bootstrap/super-admin",
    payload
  );

  return response.data;
}