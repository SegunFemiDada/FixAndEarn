// Path: apps/web/src/lib/jobs/api.ts
import apiClient from "@/lib/apiClient";
import type { MarketplaceStats } from "./types";

export type CreateJobPayload = {
  skillCategory: string;
  state: string;
  city: string;
  lga?: string;
  area?: string;
  priceMilliFec: number;
  images?: File[];
};

export async function createJob(values: CreateJobPayload): Promise<any> {
  const form = new FormData();
  form.append("skillCategory", values.skillCategory);
  form.append("state", values.state);
  form.append("city", values.city);
  form.append("priceMilliFec", String(values.priceMilliFec));

  if (values.lga) form.append("lga", values.lga);
  if (values.area) form.append("area", values.area);

  for (const file of values.images ?? []) {
    form.append("images", file);
  }

  const res = await apiClient.post("/jobs", form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

export async function initializePostingPayment(jobId: string) {
  const res = await apiClient.post(`/job-payments/posting/${jobId}`);
  return res.data;
}

export async function initializeFinalPayment(
  jobId: string,
  conversationId: string,
) {
  const res = await apiClient.post(
    `/job-payments/final/${jobId}`,
    {
      conversationId,
    },
  );

  return res.data;
}

export type UrgentDirectHireResponse = {
  ok: boolean;
  jobId: string;
  checkoutUrl: string;
  reference: string;
};

export async function urgentDirectHire(payload: {
  fixerId: string;
  skillCategory: string;
  state: string;
  city: string;
  lga?: string;
  area?: string;
}): Promise<UrgentDirectHireResponse> {
  const res = await apiClient.post("/jobs/urgent-direct-hire", payload);
  return res.data;
}

export type JobsListResponse = {
  items: any[];
  total: number;
  skip: number;
  take: number;
};

export async function listJobs(params?: {
  skill?: string;
  state?: string;
  city?: string;
  minPriceMilliFec?: number;
  maxPriceMilliFec?: number;
  skip?: number;
  take?: number;
}): Promise<JobsListResponse> {
  const res = await apiClient.get("/jobs", { params });
  return res.data;
}

export async function listMyJobs(params?: { skip?: number; take?: number; status?: string }): Promise<JobsListResponse> {
  const res = await apiClient.get("/jobs/mine", { params });
  return res.data;
}

export async function listMyApplications(params?: { skip?: number; take?: number }): Promise<any[]> {
  const res = await apiClient.get("/jobs/applications/mine", { params });
  return res.data;
}

export async function getJobById(id: string): Promise<any> {
  const res = await apiClient.get(`/jobs/${id}`);
  return res.data;
}

export async function applyToJob(id: string, payload?: { note?: string }): Promise<any> {
  const res = await apiClient.post(`/jobs/${id}/apply`, payload ?? {});
  return res.data;
}

export async function requestJobCompletion(id: string, payload?: { note?: string }): Promise<any> {
  const res = await apiClient.post(`/jobs/${id}/completion/request`, payload ?? {});
  return res.data;
}

export async function approveJobCompletion(
  id: string,
  payload: { rating: number; comment?: string }
): Promise<any> {
  const res = await apiClient.post(`/jobs/${id}/completion/approve`, payload);
  return res.data;
}

export async function rejectJobCompletion(id: string, payload?: { reason?: string }): Promise<any> {
  const res = await apiClient.post(`/jobs/${id}/completion/reject`, payload ?? {});
  return res.data;
}

export async function getJobDispute(id: string): Promise<any> {
  const res = await apiClient.get(`/jobs/${id}/disputes`);
  return res.data;
}

export async function openJobDispute(id: string, payload: OpenDisputePayload): Promise<any> {
  const form = new FormData();
  form.append("reason", payload.reason);

  if (payload.evidence !== undefined) {
    form.append(
      "evidence",
      typeof payload.evidence === "string"
        ? payload.evidence
        : JSON.stringify(payload.evidence)
    );
  }

  if (payload.image) {
    form.append("image", payload.image);
  }

  const res = await apiClient.post(`/jobs/${id}/disputes`, form, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

export async function createJobRating(jobId: string, data: { rating: number; review?: string }) {
  const res = await apiClient.post(`/jobs/${jobId}/rating`, data);
  return res.data;
}

export async function rateFixer(jobId: string, payload: { rating: number; review?: string | null }) {
  const res = await apiClient.post(`/jobs/${jobId}/rating`, payload);
  return res.data;
}
export type OpenDisputePayload = {
  reason: string;
  evidence?: unknown;
  image?: File | null;
};
export async function updateJob(
  jobId: string,
  data: {
    skillCategory?: string;
    state?: string;
    city?: string;
    lga?: string;
    area?: string;
    priceMilliFec?: number;
  }
): Promise<any> {
  const response = await apiClient.patch(`/jobs/${jobId}`, data);
  return response.data;
}
export async function getMarketplaceStats(): Promise<MarketplaceStats> {
  const res = await apiClient.get("/jobs/stats");
  return res.data;
}