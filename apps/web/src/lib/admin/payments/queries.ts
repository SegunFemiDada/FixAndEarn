"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminPaymentById,
  searchAdminPayments,
} from "./api";
import type {
  AdminPaymentDetail,
  AdminPaymentListItem,
  AdminPaymentSearchParams,
} from "./types";

export const adminPaymentsQueryKeys = {
  all: ["admin", "payments"] as const,

  list: (params: AdminPaymentSearchParams) =>
    [
      ...adminPaymentsQueryKeys.all,
      "list",
      params.q ?? "",
      params.status ?? "ALL",
      params.type ?? "ALL",
      params.jobId ?? "",
      params.clientId ?? "",
      params.fixerId ?? "",
      params.skip ?? 0,
      params.take ?? 20,
    ] as const,

  detail: (id: string) =>
    [
      ...adminPaymentsQueryKeys.all,
      "detail",
      id,
    ] as const,
};

export function useAdminPaymentsList(
  params: AdminPaymentSearchParams,
  enabled = true,
) {
  return useQuery<{
    items: AdminPaymentListItem[];
    total: number;
    skip: number;
    take: number;
  }>({
    queryKey: adminPaymentsQueryKeys.list(params),
    queryFn: () => searchAdminPayments(params),
    enabled,
  });
}

export function useAdminPaymentDetail(
  id: string,
  enabled = true,
) {
  return useQuery<AdminPaymentDetail>({
    queryKey: adminPaymentsQueryKeys.detail(id),
    queryFn: () => getAdminPaymentById(id),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}