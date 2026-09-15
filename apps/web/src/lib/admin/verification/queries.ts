// Path: apps/web/src/lib/admin/verification/queries.ts

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getVerificationDetail,
  listPendingVerifications,
  submitNinVerificationDecision,
  submitVerificationDecision,
} from "./api";

import type {
  AdminVerificationDetail,
  NinVerificationDecisionPayload,
  NinVerificationDecisionResponse,
  PendingVerificationRow,
  VerificationDecisionPayload,
  VerificationDecisionResponse,
} from "./types";

import { invalidateSidebarNotifications } from "@/lib/admin/sidebar-notifications/invalidate";

const verificationKeys = {
  all: ["admin", "verification"] as const,

  pending: (skip: number, take: number) =>
    ["admin", "verification", "pending", skip, take] as const,

  detail: (id: string) =>
    ["admin", "verification", "detail", id] as const,
};

export function usePendingVerifications(params?: {
  skip?: number;
  take?: number;
}) {
  const skip = params?.skip ?? 0;
  const take = params?.take ?? 20;

  return useQuery<PendingVerificationRow[]>({
    queryKey: verificationKeys.pending(skip, take),
    queryFn: () => listPendingVerifications({ skip, take }),
    staleTime: 10_000,
  });
}

export function useVerificationDetail(
  id: string,
  enabled = true,
) {
  return useQuery<AdminVerificationDetail>({
    queryKey: verificationKeys.detail(id),
    queryFn: () => getVerificationDetail(id),
    enabled: Boolean(id) && enabled,
    staleTime: 10_000,
  });
}

export function useVerificationDecision(id: string) {
  const qc = useQueryClient();

  return useMutation<
    VerificationDecisionResponse,
    Error,
    VerificationDecisionPayload
  >({
    mutationFn: (payload) =>
      submitVerificationDecision(id, payload),

    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: verificationKeys.all,
        }),
        qc.invalidateQueries({
          queryKey: verificationKeys.detail(id),
        }),
        invalidateSidebarNotifications(qc),
      ]);
    },
  });
}

export function useNinVerificationDecision(id: string) {
  const qc = useQueryClient();

  return useMutation<
    NinVerificationDecisionResponse,
    Error,
    NinVerificationDecisionPayload
  >({
    mutationFn: (payload) =>
      submitNinVerificationDecision(id, payload),

    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: verificationKeys.all,
        }),
        qc.invalidateQueries({
          queryKey: verificationKeys.detail(id),
        }),
        invalidateSidebarNotifications(qc),
      ]);
    },
  });
}