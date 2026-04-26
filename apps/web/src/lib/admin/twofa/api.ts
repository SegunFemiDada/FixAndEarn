import { adminApi } from "@/lib/admin/api";
import type {
  AdminOwn2faRotatePayload,
  AdminOwn2faRotateResponse,
  AdminOwn2faStatusResponse,
  AdminOwn2faVerifyPayload,
  AdminOwn2faVerifyResponse,
} from "@/lib/admin/twofa/types";

export async function getAdminOwn2faStatus(): Promise<AdminOwn2faStatusResponse> {
  const response = await adminApi.get<AdminOwn2faStatusResponse>("/admin/2fa/status");
  return response.data;
}

export async function verifyAdminOwn2fa(
  payload: AdminOwn2faVerifyPayload
): Promise<AdminOwn2faVerifyResponse> {
  const response = await adminApi.post<AdminOwn2faVerifyResponse>("/admin/2fa/verify", payload);
  return response.data;
}

export async function rotateAdminOwn2fa(
  payload: AdminOwn2faRotatePayload
): Promise<AdminOwn2faRotateResponse> {
  const response = await adminApi.post<AdminOwn2faRotateResponse>("/admin/2fa/rotate", payload);
  return response.data;
}