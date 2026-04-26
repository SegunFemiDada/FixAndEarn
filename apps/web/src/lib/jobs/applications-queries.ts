import { useQuery } from "@tanstack/react-query";
import { listJobApplications } from "./applications-api";

type ListParams = { skip?: number; take?: number };

const keys = {
  applications: (jobId: string, params: ListParams) =>
    ["jobs", "applications", jobId, params] as const,
};

export function useJobApplications(
  jobId: string,
  params?: ListParams & { enabled?: boolean }
) {
  const safeParams: ListParams = {
    skip: params?.skip ?? 0,
    take: params?.take ?? 50,
  };

  const enabled = (params?.enabled ?? true) && !!jobId;

  return useQuery({
    queryKey: keys.applications(jobId, safeParams),
    queryFn: () => listJobApplications(jobId, safeParams),
    enabled,
    staleTime: 0,
    retry: 1,
  });
}