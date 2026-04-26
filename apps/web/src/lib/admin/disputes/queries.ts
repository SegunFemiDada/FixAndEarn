"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminDisputeChat,
  listAdminDisputes,
  resolveAdminDispute,
  resolveAdminDisputeAmicably,
  sendAdminDisputeChatMessage,
} from "@/lib/admin/disputes/api";
import type {
  AdminDisputeChatMessagePayload,
  AdminDisputeChatMessageResponse,
  AdminDisputeChatResponse,
  ListAdminDisputesParams,
  ListAdminDisputesResponse,
  ResolveDisputePayload,
  ResolveDisputeResponse,
} from "@/lib/admin/disputes/types";

export const adminDisputesQueryKeys = {
  all: ["admin", "disputes"] as const,
  list: (params: ListAdminDisputesParams) =>
    [
      ...adminDisputesQueryKeys.all,
      "list",
      params.status ?? "ALL",
      params.jobId ?? "",
    ] as const,
  chat: (disputeId: string, take?: number) =>
    [...adminDisputesQueryKeys.all, "chat", disputeId, take ?? 50] as const,
};

export function useAdminDisputesList(params: ListAdminDisputesParams, enabled = true) {
  return useQuery<ListAdminDisputesResponse, Error>({
    queryKey: adminDisputesQueryKeys.list(params),
    queryFn: () => listAdminDisputes(params),
    enabled,
    retry: false,
  });
}

export function useAdminResolveDispute() {
  const queryClient = useQueryClient();

  return useMutation<ResolveDisputeResponse, Error, { disputeId: string; payload: ResolveDisputePayload }>({
    mutationFn: ({ disputeId, payload }) => resolveAdminDispute(disputeId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminDisputesQueryKeys.all });
    },
  });
}

export function useAdminResolveDisputeAmicably() {
  const queryClient = useQueryClient();

  return useMutation<ResolveDisputeResponse, Error, { disputeId: string }>({
    mutationFn: ({ disputeId }) => resolveAdminDisputeAmicably(disputeId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminDisputesQueryKeys.all });
    },
  });
}

export function useAdminDisputeChat(
  args: { disputeId: string; take?: number },
  enabled = true
) {
  return useQuery<AdminDisputeChatResponse, Error>({
    queryKey: adminDisputesQueryKeys.chat(args.disputeId, args.take),
    queryFn: () => getAdminDisputeChat(args),
    enabled: enabled && !!args.disputeId,
    retry: false,
    refetchInterval: 10_000,
  });
}

export function useAdminSendDisputeChatMessage(disputeId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    AdminDisputeChatMessageResponse,
    Error,
    AdminDisputeChatMessagePayload
  >({
    mutationFn: (payload) => sendAdminDisputeChatMessage(disputeId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminDisputesQueryKeys.all });
      await queryClient.invalidateQueries({
        queryKey: [...adminDisputesQueryKeys.all, "chat", disputeId],
      });
    },
  });
}