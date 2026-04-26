// Path: apps/web/src/lib/admin/verification/api.ts
import { adminApi } from "@/lib/admin/api";
import type {
  AdminVerificationDetail,
  PendingVerificationRow,
  VerificationDecisionPayload,
  VerificationDecisionResponse,
} from "./types";

export async function listPendingVerifications(params?: { skip?: number; take?: number }) {
  const res = await adminApi.get<PendingVerificationRow[]>("/admin/verification/pending", {
    params,
  });

  return res.data;
}

export async function getVerificationDetail(id: string): Promise<AdminVerificationDetail> {
  const res = await adminApi.get<AdminVerificationDetail>(`/admin/verification/${id}`);
  return res.data;
}

export async function submitVerificationDecision(
  id: string,
  payload: VerificationDecisionPayload
): Promise<VerificationDecisionResponse> {
  const res = await adminApi.post<VerificationDecisionResponse>(
    `/admin/verification/${id}/decision`,
    payload
  );

  return res.data;
}