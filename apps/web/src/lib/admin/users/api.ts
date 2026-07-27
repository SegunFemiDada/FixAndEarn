// Path: apps/web/src/lib/admin/users/api.ts
import { adminApi } from "@/lib/admin/api";
import type {
  AdminUserActionPayload,
  AdminUserActionResponse,
  AdminUserDetail,
  AdminUserListItem,
  SearchUsersParams,
} from "@/lib/admin/users/types";

export async function searchAdminUsers(
  params: SearchUsersParams = {}
): Promise<AdminUserListItem[]> {
  const response = await adminApi.get<AdminUserListItem[]>("/admin/users", {
    params: {
      q: params.q?.trim() || undefined,
      role: params.role || undefined,
      verificationStatus: params.verificationStatus || undefined, // ✅ FIX
      skip: params.skip ?? 0,
      take: params.take ?? 20,
    },
  });

  return response.data;
}

export async function getAdminUserById(id: string): Promise<AdminUserDetail> {
  const response = await adminApi.get<AdminUserDetail>(`/admin/users/${id}`);
  return response.data;
}

export async function suspendAdminUser(
  id: string,
  payload: AdminUserActionPayload
): Promise<AdminUserActionResponse> {
  const response = await adminApi.post<AdminUserActionResponse>(`/admin/users/${id}/suspend`, payload);
  return response.data;
}

export async function unsuspendAdminUser(
  id: string,
  payload: AdminUserActionPayload
): Promise<AdminUserActionResponse> {
  const response = await adminApi.post<AdminUserActionResponse>(`/admin/users/${id}/unsuspend`, payload);
  return response.data;
}

export async function forceReverifyAdminUser(
  id: string,
  payload: AdminUserActionPayload
): Promise<AdminUserActionResponse> {
  const response = await adminApi.post<AdminUserActionResponse>(`/admin/users/${id}/force-reverify`, payload);
  return response.data;
}

export async function setAdminUserNotes(
  id: string,
  payload: AdminUserActionPayload
): Promise<AdminUserActionResponse> {
  const response = await adminApi.post<AdminUserActionResponse>(`/admin/users/${id}/notes`, payload);
  return response.data;
}
export async function updateAdminUser(
  id: string,
  data: any
): Promise<AdminUserActionResponse> {
  const response = await adminApi.patch(`/admin/users/${id}`, data);
  return response.data;
}
export async function getAdminDeletionRequests(
  status?: "PENDING" | "APPROVED" | "REJECTED"
) {
  const response = await adminApi.get("/admin/users/deletion-requests", {
    params: { status },
  });

  return response.data;
}

export async function approveAdminDeletion(id: string) {
  const response = await adminApi.post(
    `/admin/users/${id}/approve-deletion`
  );

  return response.data;
}

export async function rejectAdminDeletion(
  id: string,
  payload: { reason?: string }
) {
  const response = await adminApi.post(
    `/admin/users/${id}/reject-deletion`,
    payload
  );

  return response.data;
}