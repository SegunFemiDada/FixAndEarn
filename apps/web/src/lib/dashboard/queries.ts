// Path: apps/web/src/lib/dashboard/queries.ts

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type Job = {
  id: string;
  clientId: string;
  skillCategory: string;
  state: string;
  city: string;
  lga: string | null;
  area: string | null;
  priceMilliFec: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

export type JobsListParams = {
  skill?: string;
  state?: string;
  city?: string;
  minPriceMilliFec?: number;
  maxPriceMilliFec?: number;
  skip?: number;
  take?: number;
};

export function useVerificationMe() {
  return useQuery({
    queryKey: ["verification", "me"],
    queryFn: async () => {
      const res = await apiClient.get("/verification/me");
      // Backend note: can return PENDING even if no record exists.
      return res.data as { status: VerificationStatus } | { status: VerificationStatus; [k: string]: any };
    }
  });
}

export function useOpenJobs(params: JobsListParams) {
  return useQuery({
    queryKey: ["jobs", "open", params],
    queryFn: async () => {
      const res = await apiClient.get("/jobs", { params });
      return res.data as Job[];
    }
  });
}
