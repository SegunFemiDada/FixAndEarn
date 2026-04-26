import { adminApi } from "@/lib/admin/api";
import type {
  AdminAccountActionPayload,
  AdminAccountActionResponse,
  AdminListItem,
  CreateAdminPayload,
  CreateAdminResponse,
  RotateAdminTotpResponse,
} from "@/lib/admin/admins/types";

export async function listAdmins(): Promise<AdminListItem[]> {
  const response = await adminApi.get<AdminListItem[]>("/admin/admins");
  return response.data;
}

export async function createAdmin(
  payload: CreateAdminPayload
): Promise<CreateAdminResponse> {
  const response = await adminApi.post<CreateAdminResponse>("/admin/admins", payload);
  return response.data;
}

export async function deactivateAdmin(
  id: string,
  payload: AdminAccountActionPayload
): Promise<AdminAccountActionResponse> {
  const response = await adminApi.post<AdminAccountActionResponse>(
    `/admin/admins/${id}/deactivate`,
    payload
  );
  return response.data;
}

export async function reactivateAdmin(
  id: string,
  payload: AdminAccountActionPayload
): Promise<AdminAccountActionResponse> {
  const response = await adminApi.post<AdminAccountActionResponse>(
    `/admin/admins/${id}/reactivate`,
    payload
  );
  return response.data;
}

export async function rotateAdminTotp(
  id: string,
  payload: AdminAccountActionPayload
): Promise<RotateAdminTotpResponse> {
  const response = await adminApi.post<RotateAdminTotpResponse>(
    `/admin/admins/${id}/rotate-totp`,
    payload
  );
  return response.data;
}