"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getAdminJobById,
  searchAdminJobs,
} from "./api";
import type {
  AdminJobDetail,
  AdminJobListItem,
  AdminJobSearchParams,
} from "./types";

export const adminJobsQueryKeys = {
  all: ["admin", "jobs"] as const,

  list: (params: AdminJobSearchParams) =>
    [
      ...adminJobsQueryKeys.all,
      "list",
      params.q ?? "",
      params.status ?? "ALL",
      params.postingType ?? "ALL",
      params.clientId ?? "",
      params.fixerId ?? "",
      params.skip ?? 0,
      params.take ?? 20,
    ] as const,

  detail: (id: string) =>
    [...adminJobsQueryKeys.all, "detail", id] as const,
};

export function useAdminJobsList(
  params: AdminJobSearchParams,
  enabled = true
) {
  return useQuery<{
    items: AdminJobListItem[];
    total: number;
    skip: number;
    take: number;
  }>({
    queryKey: adminJobsQueryKeys.list(params),
    queryFn: () => searchAdminJobs(params),
    enabled,
  });
}

export function useAdminJobDetail(
  id: string,
  enabled = true
) {
  return useQuery<AdminJobDetail>({
    queryKey: adminJobsQueryKeys.detail(id),
    queryFn: () => getAdminJobById(id),
    enabled: enabled && Boolean(id),
    retry: false,
  });
}