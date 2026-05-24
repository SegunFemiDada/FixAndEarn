//path: apps/web/src/lib/chat/queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acceptAgreement,
  getConversationDetail,
  listJobConversations,
  listMyConversations,
  lockPrice,
  proposePrice,
  respondLockedPrice,
  sendMessage,
} from "./api";

type ListParams = Record<string, unknown>;

const keys = {
  mine: (params: ListParams) => ["chats", "mine", params] as const,
  job: (jobId: string) => ["chats", "job", jobId] as const,
  detail: (jobId: string, fixerId: string, params: ListParams) =>
    ["chats", "detail", jobId, fixerId, params] as const,
};

function invalidateChatAndJobState(
  qc: ReturnType<typeof useQueryClient>,
  jobId: string,
  fixerId: string
) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["chats"] }),
    qc.invalidateQueries({ queryKey: ["jobs"] }),
    qc.invalidateQueries({ queryKey: ["jobs", "list"] }),
    qc.invalidateQueries({ queryKey: ["jobs", "mine"] }),
    qc.invalidateQueries({ queryKey: ["jobs", "myApplications"] }),
    qc.invalidateQueries({ queryKey: ["jobs", "byId", jobId] }),
    qc.invalidateQueries({ queryKey: keys.job(jobId) }),
    qc.invalidateQueries({ queryKey: ["chats", "detail", jobId, fixerId] }),
  ]);
}

export function useMyConversations(params?: ListParams) {
  const safeParams: ListParams = params ?? {};

  return useQuery({
    queryKey: keys.mine(safeParams),
    queryFn: () => listMyConversations(safeParams),
    staleTime: 10_000,
    retry: 1,
  });
}

export function useJobConversations(jobId: string, opts?: { enabled?: boolean }) {
  const enabled = (opts?.enabled ?? true) && !!jobId;

  return useQuery({
    queryKey: keys.job(jobId),
    enabled,
    queryFn: () => listJobConversations(jobId),
    staleTime: 10_000,
    retry: 1,
  });
}

export function useConversationDetail(
  jobId: string,
  fixerId: string,
  params?: ListParams
) {
  const safeParams: ListParams = params ?? {};

  return useQuery({
    queryKey: keys.detail(jobId, fixerId, safeParams),
    queryFn: () => getConversationDetail(jobId, fixerId, safeParams),
    enabled: !!jobId && !!fixerId,
    staleTime: 10_000,
    retry: 1,
  });
}

export function useAcceptAgreement(jobId: string, fixerId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { accepted: boolean }) =>
      acceptAgreement(jobId, fixerId, payload),
    onSuccess: async () => {
      await invalidateChatAndJobState(qc, jobId, fixerId);
    },
  });
}

export function useSendMessage(jobId: string, fixerId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { body: string }) => sendMessage(jobId, fixerId, payload),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["chats"] }),
        qc.invalidateQueries({ queryKey: keys.job(jobId) }),
        qc.invalidateQueries({ queryKey: ["chats", "detail", jobId, fixerId] }),
      ]);
    },
  });
}

export function useProposePrice(jobId: string, fixerId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { proposedPriceMilliFec: number }) =>
      proposePrice(jobId, fixerId, payload),
    onSuccess: async () => {
      await invalidateChatAndJobState(qc, jobId, fixerId);
    },
  });
}

export function useLockPrice(jobId: string, fixerId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { lockedPriceMilliFec: number }) =>
      lockPrice(jobId, fixerId, payload),
    onSuccess: async () => {
      await invalidateChatAndJobState(qc, jobId, fixerId);
    },
  });
}

export function useRespondLockedPrice(jobId: string, fixerId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { accept: boolean }) =>
      respondLockedPrice(jobId, fixerId, payload),
    onSuccess: async () => {
      await invalidateChatAndJobState(qc, jobId, fixerId);
    },
  });
}