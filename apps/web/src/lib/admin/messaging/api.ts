import { adminApi } from "@/lib/admin/api";
import type {
  AdminMessagingConversationDetailResponse,
  AdminMessagingInterventionPayload,
  AdminMessagingInterventionResponse,
  AdminMessagingListParams,
  AdminMessagingListResponse,
  AdminMessagingRestrictPayload,
  AdminMessagingRestrictResponse,
  AdminMessagingUserActionPayload,
  AdminMessagingUserStrikeResponse,
  AdminMessagingUserSuspendResponse,
  AdminMessagingWarnPayload,
  AdminMessagingWarnResponse,
} from "@/lib/admin/messaging/types";

export async function listAdminMessagingConversations(
  params: AdminMessagingListParams = {}
): Promise<AdminMessagingListResponse> {
  const response = await adminApi.get<AdminMessagingListResponse>("/admin/messaging/conversations", {
    params: {
      jobId: params.jobId?.trim() || undefined,
      userId: params.userId?.trim() || undefined,
      status: params.status || undefined,
      flaggedOnly: params.flaggedOnly ? 1 : undefined,
      disputeLinkedOnly: params.disputeLinkedOnly ? 1 : undefined,
      skip: params.skip ?? 0,
      take: params.take ?? 20,
    },
  });

  return response.data;
}

export async function getAdminMessagingConversation(
  conversationId: string,
  take?: number
): Promise<AdminMessagingConversationDetailResponse> {
  const response = await adminApi.get<AdminMessagingConversationDetailResponse>(
    `/admin/messaging/conversations/${conversationId}`,
    {
      params: {
        take,
      },
    }
  );

  return response.data;
}

export async function sendAdminMessagingIntervention(
  conversationId: string,
  payload: AdminMessagingInterventionPayload
): Promise<AdminMessagingInterventionResponse> {
  const response = await adminApi.post<AdminMessagingInterventionResponse>(
    `/admin/messaging/conversations/${conversationId}/messages`,
    payload
  );

  return response.data;
}

export async function warnAdminMessagingConversation(
  conversationId: string,
  payload: AdminMessagingWarnPayload
): Promise<AdminMessagingWarnResponse> {
  const response = await adminApi.post<AdminMessagingWarnResponse>(
    `/admin/messaging/conversations/${conversationId}/warn`,
    payload
  );

  return response.data;
}

export async function restrictAdminMessagingConversation(
  conversationId: string,
  payload: AdminMessagingRestrictPayload
): Promise<AdminMessagingRestrictResponse> {
  const response = await adminApi.post<AdminMessagingRestrictResponse>(
    `/admin/messaging/conversations/${conversationId}/restrict`,
    payload
  );

  return response.data;
}

export async function addAdminMessagingUserStrike(
  userId: string,
  payload: AdminMessagingUserActionPayload
): Promise<AdminMessagingUserStrikeResponse> {
  const response = await adminApi.post<AdminMessagingUserStrikeResponse>(
    `/admin/messaging/users/${userId}/strike`,
    payload
  );

  return response.data;
}

export async function suspendAdminMessagingUser(
  userId: string,
  payload: AdminMessagingUserActionPayload
): Promise<AdminMessagingUserSuspendResponse> {
  const response = await adminApi.post<AdminMessagingUserSuspendResponse>(
    `/admin/messaging/users/${userId}/suspend`,
    payload
  );

  return response.data;
}

export async function unsuspendAdminMessagingUser(
  userId: string,
  payload: AdminMessagingUserActionPayload
): Promise<AdminMessagingUserSuspendResponse> {
  const response = await adminApi.post<AdminMessagingUserSuspendResponse>(
    `/admin/messaging/users/${userId}/unsuspend`,
    payload
  );

  return response.data;
}