// Path: apps/web/src/lib/chat/api.ts
import apiClient from "@/lib/apiClient";

/**
 * GET /chats/me
 */
export async function listMyConversations(params?: any) {
  const res = await apiClient.get("/chats/me", { params });
  return res.data;
}

/**
 * GET /jobs/:jobId/chats/:fixerId
 */
export async function getConversationDetail(
  jobId: string,
  fixerId: string,
  params?: any
) {
  const res = await apiClient.get(`/jobs/${jobId}/chats/${fixerId}`, {
    params,
  });
  return res.data;
}

/**
 * POST /jobs/:jobId/chats/:fixerId/messages
 */
export async function sendMessage(
  jobId: string,
  fixerId: string,
  payload: { body: string }
) {
  const res = await apiClient.post(
    `/jobs/${jobId}/chats/${fixerId}/messages`,
    payload
  );
  return res.data;
}

/**
 * POST /jobs/:jobId/chats/:fixerId/agreement
 */
export async function acceptAgreement(
  jobId: string,
  fixerId: string,
  payload: { accepted: boolean }
) {
  const res = await apiClient.post(
    `/jobs/${jobId}/chats/${fixerId}/agreement`,
    payload
  );
  return res.data;
}

/**
 * POST /jobs/:jobId/chats/:fixerId/negotiation/propose
 */
export async function proposePrice(
  jobId: string,
  fixerId: string,
  payload: { proposedPriceMilliFec: number }
) {
  const res = await apiClient.post(
    `/jobs/${jobId}/chats/${fixerId}/negotiation/propose`,
    payload
  );
  return res.data;
}

/**
 * POST /jobs/:jobId/chats/:fixerId/negotiation/lock
 */
export async function lockPrice(
  jobId: string,
  fixerId: string,
  payload: { lockedPriceMilliFec: number }
) {
  const res = await apiClient.post(
    `/jobs/${jobId}/chats/${fixerId}/negotiation/lock`,
    payload
  );
  return res.data;
}

/**
 * POST /jobs/:jobId/chats/:fixerId/negotiation/respond
 */
export async function respondLockedPrice(
  jobId: string,
  fixerId: string,
  payload: { accept: boolean }
) {
  const res = await apiClient.post(
    `/jobs/${jobId}/chats/${fixerId}/negotiation/respond`,
    payload
  );
  return res.data;
}
