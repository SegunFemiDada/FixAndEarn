"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveWithdrawal,
  getWithdrawal,
  getWithdrawalEarningsTrace,
  listWithdrawals,
  markWithdrawalPaid,
  rejectWithdrawal,
} from "@/lib/admin/finance/api";
import type {
  ListWithdrawalsParams,
  ReviewWithdrawalPayload,
  ReviewWithdrawalResponse,
  WithdrawalDetail,
  WithdrawalEarningsTrace,
  WithdrawalListItem,
} from "@/lib/admin/finance/types";

export const adminFinanceQueryKeys = {
  all: ["admin", "finance"] as const,
  withdrawals: ["admin", "finance", "withdrawals"] as const,
  list: (params: ListWithdrawalsParams) =>
    [
      ...adminFinanceQueryKeys.withdrawals,
      "list",
      params.status ?? "ALL",
      params.skip ?? 0,
      params.take ?? 50,
    ] as const,
  detail: (id: string) => [...adminFinanceQueryKeys.withdrawals, "detail", id] as const,
  earningsTrace: (id: string) => [...adminFinanceQueryKeys.withdrawals, "earnings-trace", id] as const,
};

export function useAdminWithdrawalsList(params: ListWithdrawalsParams, enabled = true) {
  return useQuery<WithdrawalListItem[], Error>({
    queryKey: adminFinanceQueryKeys.list(params),
    queryFn: () => listWithdrawals(params),
    enabled,
  });
}

export function useAdminWithdrawal(id: string, enabled = true) {
  return useQuery<WithdrawalDetail, Error>({
    queryKey: adminFinanceQueryKeys.detail(id),
    queryFn: () => getWithdrawal(id),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}

export function useAdminWithdrawalEarningsTrace(id: string, enabled = true) {
  return useQuery<WithdrawalEarningsTrace, Error>({
    queryKey: adminFinanceQueryKeys.earningsTrace(id),
    queryFn: () => getWithdrawalEarningsTrace(id),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}

export function useAdminApproveWithdrawal(id: string) {
  const queryClient = useQueryClient();

  return useMutation<ReviewWithdrawalResponse, Error, ReviewWithdrawalPayload>({
    mutationFn: (payload) => approveWithdrawal(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminFinanceQueryKeys.withdrawals }),
      ]);
    },
  });
}

export function useAdminRejectWithdrawal(id: string) {
  const queryClient = useQueryClient();

  return useMutation<ReviewWithdrawalResponse, Error, ReviewWithdrawalPayload>({
    mutationFn: (payload) => rejectWithdrawal(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminFinanceQueryKeys.withdrawals }),
      ]);
    },
  });
}

export function useAdminMarkPaidWithdrawal(id: string) {
  const queryClient = useQueryClient();

  return useMutation<ReviewWithdrawalResponse, Error, ReviewWithdrawalPayload>({
    mutationFn: (payload) => markWithdrawalPaid(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminFinanceQueryKeys.withdrawals }),
      ]);
    },
  });
}