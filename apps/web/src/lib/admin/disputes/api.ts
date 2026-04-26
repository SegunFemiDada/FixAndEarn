import { adminApi } from "@/lib/admin/api";
import type {
  AdminDisputeChatMessagePayload,
  AdminDisputeChatMessageResponse,
  AdminDisputeChatResponse,
  ListAdminDisputesParams,
  ListAdminDisputesResponse,
  ResolveDisputePayload,
  ResolveDisputeResponse,
} from "@/lib/admin/disputes/types";

export async function listAdminDisputes(
  params: ListAdminDisputesParams = {}
): Promise<ListAdminDisputesResponse> {
  const response = await adminApi.get<ListAdminDisputesResponse>("/admin/disputes", {
    params: {
      status: params.status,
      jobId: params.jobId?.trim() || undefined,
    },
  });

  return response.data;
}

export async function resolveAdminDispute(
  disputeId: string,
  payload: ResolveDisputePayload
): Promise<ResolveDisputeResponse> {
  const response = await adminApi.post<ResolveDisputeResponse>(
    `/admin/disputes/${disputeId}/resolve`,
    payload
  );

  return response.data;
}

export async function resolveAdminDisputeAmicably(
  disputeId: string
): Promise<ResolveDisputeResponse> {
  const response = await adminApi.post<ResolveDisputeResponse>(
    `/admin/disputes/${disputeId}/resolve-amicably`
  );

  return response.data;
}

export async function getAdminDisputeChat(args: {
  disputeId: string;
  take?: number;
}): Promise<AdminDisputeChatResponse> {
  const response = await adminApi.get<AdminDisputeChatResponse>(
    `/admin/disputes/${args.disputeId}/chat`,
    {
      params: {
        take: args.take,
      },
    }
  );

  return response.data;
}

export async function sendAdminDisputeChatMessage(
  disputeId: string,
  payload: AdminDisputeChatMessagePayload
): Promise<AdminDisputeChatMessageResponse> {
  const response = await adminApi.post<AdminDisputeChatMessageResponse>(
    `/admin/disputes/${disputeId}/chat/messages`,
    payload
  );

  return response.data;
}

export async function getAdminAuditExportUrl(): Promise<string> {
  const baseURL = adminApi.defaults.baseURL;
  if (!baseURL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set.");
  }

  return `${baseURL}/admin/exports/audit-logs.csv`;
}