"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getAdminDisputeChat,
  listAdminDisputes,
  resolveAdminDisputeAmicably,
  sendAdminDisputeChatMessage,
} from "@/lib/admin/disputes/api";

import type {
  AdminDisputeChatMessagePayload,
  AdminDisputeChatMessageResponse,
  AdminDisputeChatResponse,
  ListAdminDisputesParams,
  ListAdminDisputesResponse,
  ResolveDisputeResponse,
} from "@/lib/admin/disputes/types";

import { invalidateSidebarNotifications } from "@/lib/admin/sidebar-notifications/invalidate";

export const adminDisputesQueryKeys = {
  all: ["admin", "disputes"] as const,

  list: (params: ListAdminDisputesParams) =>
    [
      "admin",
      "disputes",
      "list",
      params.status ?? "ALL",
      params.jobId ?? "",
    ] as const,

  chat: (disputeId: string, take?: number) =>
    [
      "admin",
      "disputes",
      "chat",
      disputeId,
      take ?? 50,
    ] as const,
};

export function useAdminDisputesList(
  params: ListAdminDisputesParams,
  enabled = true,
) {
  return useQuery<ListAdminDisputesResponse, Error>({
    queryKey: adminDisputesQueryKeys.list(params),
    queryFn: () => listAdminDisputes(params),
    enabled,
    retry: false,
  });
}

export function useAdminResolveDisputeAmicably() {
  const queryClient = useQueryClient();

  return useMutation<
    ResolveDisputeResponse,
    Error,
    { disputeId: string }
  >({
    mutationFn: ({ disputeId }) =>
      resolveAdminDisputeAmicably(disputeId),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminDisputesQueryKeys.all,
        }),

        invalidateSidebarNotifications(queryClient),
      ]);
    },
  });
}

export function useAdminDisputeChat(
  args: {
    disputeId: string;
    take?: number;
  },
  enabled = true,
) {
  return useQuery<AdminDisputeChatResponse, Error>({
    queryKey: adminDisputesQueryKeys.chat(
      args.disputeId,
      args.take,
    ),

    queryFn: () => getAdminDisputeChat(args),

    enabled:
      enabled &&
      Boolean(args.disputeId),

    retry: false,

    refetchInterval: 10_000,
  });
}

export function useAdminSendDisputeChatMessage(
  disputeId: string,
) {
  const queryClient = useQueryClient();

  return useMutation<
    AdminDisputeChatMessageResponse,
    Error,
    AdminDisputeChatMessagePayload
  >({
    mutationFn: (payload) =>
      sendAdminDisputeChatMessage(
        disputeId,
        payload,
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminDisputesQueryKeys.all,
        }),

        queryClient.invalidateQueries({
          queryKey: [
            ...adminDisputesQueryKeys.all,
            "chat",
            disputeId,
          ],
        }),
      ]);
    },
  });
}