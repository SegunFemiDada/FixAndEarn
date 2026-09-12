"use client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  flagAdminJob,
  getAdminJobById,
  searchAdminJobs,
  unflagAdminJob,
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
      params.moderationStatus ?? "ALL",
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
    flaggedTotal: number;
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
export function useAdminFlagJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }) => flagAdminJob(id, reason),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminJobsQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: adminJobsQueryKeys.detail(variables.id),
        }),
      ]);
    },
  });
}

export function useAdminUnflagJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unflagAdminJob(id),

    onSuccess: async (_, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminJobsQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: adminJobsQueryKeys.detail(id),
        }),
      ]);
    },
  });
}