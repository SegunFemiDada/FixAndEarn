//path: apps/web/src/lib/admin/messaging/queries.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addAdminMessagingUserStrike,
  getAdminMessagingConversation,
  listAdminMessagingConversations,
  restrictAdminMessagingConversation,
  sendAdminMessagingIntervention,
  suspendAdminMessagingUser,
  unsuspendAdminMessagingUser,
  warnAdminMessagingConversation,
} from "@/lib/admin/messaging/api";
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

export const adminMessagingQueryKeys = {
  all: ["admin", "messaging"] as const,
  list: (params: AdminMessagingListParams) =>
    [
      ...adminMessagingQueryKeys.all,
      "list",
      params.jobId ?? "",
      params.userId ?? "",
      params.status ?? "ALL",
      params.flaggedOnly ? 1 : 0,
      params.disputeLinkedOnly ? 1 : 0,
      params.skip ?? 0,
      params.take ?? 20,
    ] as const,
  detail: (conversationId: string, take?: number) =>
    [...adminMessagingQueryKeys.all, "detail", conversationId, take ?? 100] as const,
};

export function useAdminMessagingConversations(params: AdminMessagingListParams, enabled = true) {
  return useQuery<AdminMessagingListResponse, Error>({
    queryKey: adminMessagingQueryKeys.list(params),
    queryFn: () => listAdminMessagingConversations(params),
    enabled,
    retry: false,
  });
}

export function useAdminMessagingConversation(
  args: { conversationId: string; take?: number },
  enabled = true
) {
  return useQuery<AdminMessagingConversationDetailResponse, Error>({
    queryKey: adminMessagingQueryKeys.detail(args.conversationId, args.take),
    queryFn: () => getAdminMessagingConversation(args.conversationId, args.take),
    enabled: enabled && Boolean(args.conversationId),
    retry: false,
    refetchInterval: 10_000,
  });
}

export function useAdminMessagingIntervention(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    AdminMessagingInterventionResponse,
    Error,
    AdminMessagingInterventionPayload
  >({
    mutationFn: (payload) => sendAdminMessagingIntervention(conversationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminMessagingQueryKeys.all });
      await queryClient.invalidateQueries({
        queryKey: [...adminMessagingQueryKeys.all, "detail", conversationId],
      });
    },
  });
}

export function useAdminMessagingWarnConversation(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminMessagingWarnResponse, Error, AdminMessagingWarnPayload>({
    mutationFn: (payload) => warnAdminMessagingConversation(conversationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminMessagingQueryKeys.all });
    },
  });
}

export function useAdminMessagingRestrictConversation(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminMessagingRestrictResponse, Error, AdminMessagingRestrictPayload>({
    mutationFn: (payload) => restrictAdminMessagingConversation(conversationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminMessagingQueryKeys.all });
    },
  });
}

export function useAdminMessagingAddUserStrike(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminMessagingUserStrikeResponse, Error, AdminMessagingUserActionPayload>({
    mutationFn: (payload) => addAdminMessagingUserStrike(userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminMessagingQueryKeys.all });
    },
  });
}

export function useAdminMessagingSuspendUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminMessagingUserSuspendResponse, Error, AdminMessagingUserActionPayload>({
    mutationFn: (payload) => suspendAdminMessagingUser(userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminMessagingQueryKeys.all });
    },
  });
}

export function useAdminMessagingUnsuspendUser(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<AdminMessagingUserSuspendResponse, Error, AdminMessagingUserActionPayload>({
    mutationFn: (payload) => unsuspendAdminMessagingUser(userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminMessagingQueryKeys.all });
    },
  });
}