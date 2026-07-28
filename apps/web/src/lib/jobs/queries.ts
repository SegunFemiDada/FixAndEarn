// Path: apps/web/src/lib/jobs/queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applyToJob,
  approveJobCompletion,
  createJob,
  getJobById,
  getJobDispute,
  listJobs,
  listMyApplications,
  listMyJobs,
  openJobDispute,
  rejectJobCompletion,
  requestJobCompletion,
  urgentDirectHire,
  updateJob,
  type CreateJobPayload,
  type OpenDisputePayload,
  initializePostingPayment,
  initializeFinalPayment,
  getMarketplaceStats,
} from "./api";
import { rateFixer } from "@/lib/jobs/api";
import apiClient from "../apiClient";


const keys = {
  list: ["jobs", "list"] as const,
  mine: ["jobs", "mine"] as const,
  stats: ["jobs", "stats"] as const,
  myApplications: ["jobs", "myApplications"] as const,
  byId: (id: string) => ["jobs", "byId", id] as const,
  dispute: (id: string) => ["jobs", "dispute", id] as const,
};

export function useCreateJob() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (values: CreateJobPayload) => createJob(values),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: keys.list }),
        qc.invalidateQueries({ queryKey: keys.mine }),
        qc.invalidateQueries({ queryKey: keys.stats }),
      ]);
    },
  });
}

export function useInitializePostingPayment() {
    return useMutation({
        mutationFn: initializePostingPayment,
    });
}

export function useInitializeFinalPayment() {
  return useMutation({
    mutationFn: (variables: {
      jobId: string;
      conversationId: string;
    }) =>
      initializeFinalPayment(
        variables.jobId,
        variables.conversationId,
      ),
  });
}

export function useJobsList(filters?: any) {
  return useQuery({
    queryKey: ["jobs", "list", filters],
    queryFn: () => listJobs(filters),
    staleTime: 10_000,
    retry: 1,
  });
}

export function useMyJobs(
  params?: { skip?: number; take?: number; status?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...keys.mine, params ?? {}],
    queryFn: () => listMyJobs(params),
    staleTime: 10_000,
    retry: 1,
    enabled: options?.enabled ?? true,
  });
}

export function useMyApplications(
  params?: { skip?: number; take?: number },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...keys.myApplications, params ?? {}],
    queryFn: () => listMyApplications(params),
    staleTime: 10_000,
    retry: 1,
    enabled: options?.enabled ?? true,
  });
}

export function useJobById(id: string) {
  return useQuery({
    queryKey: keys.byId(id),
    queryFn: () => getJobById(id),
    enabled: !!id,
    staleTime: 10_000,
    retry: 1,
  });
}

export function useApplyToJob(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { note?: string }) => applyToJob(id, payload),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: keys.byId(id) }),
        qc.invalidateQueries({ queryKey: keys.list }),
        qc.invalidateQueries({ queryKey: keys.stats }),
        qc.invalidateQueries({ queryKey: keys.myApplications }),
      ]);
    },
  });
}

export function useRequestCompletion(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { note?: string }) => requestJobCompletion(id, payload),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: keys.byId(id) }),
        qc.invalidateQueries({ queryKey: keys.list }),
        qc.invalidateQueries({ queryKey: keys.mine }),
        qc.invalidateQueries({ queryKey: keys.myApplications }),
      ]);
    },
  });
}

export function useApproveCompletion(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { rating: number; comment?: string }) =>
      approveJobCompletion(id, payload),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: keys.byId(id) }),
        qc.invalidateQueries({ queryKey: keys.list }),
        qc.invalidateQueries({ queryKey: keys.mine }),
        qc.invalidateQueries({ queryKey: keys.stats }),
        qc.invalidateQueries({ queryKey: keys.myApplications }),
      ]);
    },
  });
}

export function useRejectCompletion(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload?: { reason?: string }) => rejectJobCompletion(id, payload),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: keys.byId(id) }),
        qc.invalidateQueries({ queryKey: keys.list }),
        qc.invalidateQueries({ queryKey: keys.mine }),
        qc.invalidateQueries({ queryKey: keys.stats }),
        qc.invalidateQueries({ queryKey: keys.myApplications }),
      ]);
    },
  });
}
export function useUrgentDirectHire() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: urgentDirectHire,
    onSuccess: async () => {
      await Promise.all([
      qc.invalidateQueries({ queryKey: keys.list }),
      qc.invalidateQueries({ queryKey: keys.mine }),
      qc.invalidateQueries({ queryKey: keys.stats }),
    ]);
    },
  });
}

export function useJobDispute(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: keys.dispute(id),
    queryFn: () => getJobDispute(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    staleTime: 5_000,
    retry: 1,
  });
}

export function useOpenJobDispute(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: OpenDisputePayload) => openJobDispute(id, payload),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: keys.byId(id) }),
        qc.invalidateQueries({ queryKey: keys.dispute(id) }),
        qc.invalidateQueries({ queryKey: keys.list }),
        qc.invalidateQueries({ queryKey: keys.mine }),
        qc.invalidateQueries({ queryKey: keys.stats }),
        qc.invalidateQueries({ queryKey: keys.myApplications }),
      ]);
    },
  });
}

export function useRateFixer(jobId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { rating: number; review?: string | null }) =>
      rateFixer(jobId, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: keys.byId(jobId) });
    },
  });
}
export function useJobDetail(jobId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["job-detail", jobId],
    enabled: !!jobId && (options?.enabled ?? true),
    queryFn: async () => {
      const res = await apiClient.get(`/jobs/${jobId}`);
      return res.data;
    },
  });
}
export function useUpdateJob(jobId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof updateJob>[1]) => updateJob(jobId, data),
    onSuccess: () => {
      // Invalidate the specific job detail and the jobs list
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
export function useMarketplaceStats() {
  return useQuery({
    queryKey: keys.stats,
    queryFn: getMarketplaceStats,
    staleTime: 10_000,
    refetchInterval: 30_000,
    retry: 1,
  });
}